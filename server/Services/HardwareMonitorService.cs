using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Net.NetworkInformation;
using System.Management;
using EagleEyeMonitor.Server.Models;
using LibreHardwareMonitor.Hardware;

namespace EagleEyeMonitor.Server.Services;

public class HardwareMonitorService : IDisposable
{
    private readonly Computer _computer;
    private readonly UpdateVisitor _visitor = new();
    private readonly Dictionary<string, (long sent, long received)> _networkSnapshot = new();
    private readonly Dictionary<int, TimeSpan> _processSnapshot = new();
    private DateTime _lastNetworkSample = DateTime.UtcNow;
    private DateTime _lastProcessSample = DateTime.UtcNow;
    private readonly Queue<double> _cpuHistory = new();
    private readonly Queue<double> _cpuTempHistory = new();
    private readonly Queue<double> _cpuFreqHistory = new();
    private readonly Queue<double> _memoryHistory = new();
    private readonly Queue<double> _diskHistory = new();
    private readonly Queue<double> _networkHistory = new();
    private readonly Queue<double> _gpuHistory = new();

    public HardwareMonitorService()
    {
        _computer = new Computer
        {
            IsCpuEnabled = true,
            IsMemoryEnabled = true,
            IsNetworkEnabled = true,
            IsStorageEnabled = true,
            IsGpuEnabled = true
        };
        _computer.Open();
    }

    public SystemMetrics GetMetrics()
    {
        _computer.Accept(_visitor);
        var metrics = new SystemMetrics();

        foreach (var hardware in _computer.Hardware)
        {
            hardware.Accept(_visitor);
            switch (hardware.HardwareType)
            {
                case HardwareType.Cpu:
                    metrics.Cpu.Threads = Environment.ProcessorCount;
                    metrics.Cpu.Cores = GetPhysicalCoreCount();
                    var coreLoads = new List<ISensor>();
                    var coreTemps = new List<ISensor>();
                    foreach (var sensor in hardware.Sensors)
                    {
                        if (sensor.SensorType == SensorType.Load && sensor.Name.Equals("CPU Total", StringComparison.OrdinalIgnoreCase))
                            metrics.Cpu.Usage = sensor.Value ?? 0;
                        else if (sensor.SensorType == SensorType.Temperature && sensor.Name.Contains("Package"))
                            metrics.Cpu.Temperature = sensor.Value ?? 0;
                        else if (sensor.SensorType == SensorType.Clock && sensor.Name.Contains("Core"))
                            metrics.Cpu.Frequency += sensor.Value ?? 0;
                        else if (sensor.SensorType == SensorType.Load && sensor.Name.Contains("Core #"))
                            coreLoads.Add(sensor);
                        else if (sensor.SensorType == SensorType.Temperature && sensor.Name.Contains("Core #"))
                            coreTemps.Add(sensor);
                    }
                    if (metrics.Cpu.Cores > 0)
                        metrics.Cpu.Frequency /= metrics.Cpu.Cores;
                    foreach (var load in coreLoads)
                    {
                        var temp = coreTemps.FirstOrDefault(t => t.Name.EndsWith(load.Name.Substring(load.Name.IndexOf('#'))));
                        metrics.Cpu.CoreData.Add(new CpuCoreMetrics
                        {
                            Core = load.Name.Replace("CPU ", string.Empty),
                            Usage = load.Value ?? 0,
                            Temperature = temp?.Value ?? 0
                        });
                    }
                    break;
                case HardwareType.Memory:
                    foreach (var sensor in hardware.Sensors)
                    {
                        if (sensor.SensorType == SensorType.Load && sensor.Name.Equals("Memory", StringComparison.OrdinalIgnoreCase))
                            metrics.Memory.Usage = sensor.Value ?? 0;
                        else if (sensor.SensorType == SensorType.Data && sensor.Name.Equals("Available Memory", StringComparison.OrdinalIgnoreCase))
                            metrics.Memory.Available = sensor.Value ?? 0;
                        else if (sensor.SensorType == SensorType.Data && sensor.Name.Equals("Used Memory", StringComparison.OrdinalIgnoreCase))
                            metrics.Memory.Total = metrics.Memory.Available + (sensor.Value ?? 0);
                    }
                    break;
                case HardwareType.Storage:
                    foreach (var sensor in hardware.Sensors)
                    {
                        if (sensor.SensorType == SensorType.Throughput && sensor.Name.Contains("Read"))
                            metrics.Disk.ReadSpeed += sensor.Value ?? 0;
                        else if (sensor.SensorType == SensorType.Throughput && sensor.Name.Contains("Write"))
                            metrics.Disk.WriteSpeed += sensor.Value ?? 0;
                    }
                    break;
                case HardwareType.GpuNvidia:
                case HardwareType.GpuAmd:
                case HardwareType.GpuIntel:
                    foreach (var sensor in hardware.Sensors)
                    {
                        if (sensor.SensorType == SensorType.Load && (sensor.Name.Contains("Core") || sensor.Name.Contains("GPU")))
                            metrics.Gpu.Usage = sensor.Value ?? 0;
                        else if (sensor.SensorType == SensorType.Temperature && sensor.Name.Contains("Core"))
                            metrics.Gpu.Temperature = sensor.Value ?? 0;
                    }
                    break;
            }
        }

        foreach (var drive in DriveInfo.GetDrives())
        {
            if (!drive.IsReady || drive.DriveType != DriveType.Fixed) continue;
            var used = 1 - (double)drive.AvailableFreeSpace / drive.TotalSize;
            metrics.Disk.Usage = Math.Max(metrics.Disk.Usage, used * 100);
        }

        var now = DateTime.UtcNow;
        var elapsed = (now - _lastNetworkSample).TotalSeconds;
        if (elapsed <= 0) elapsed = 1;
        foreach (var nic in NetworkInterface.GetAllNetworkInterfaces())
        {
            if (nic.NetworkInterfaceType == NetworkInterfaceType.Loopback || nic.OperationalStatus != OperationalStatus.Up)
                continue;
            var stats = nic.GetIPv4Statistics();
            if (_networkSnapshot.TryGetValue(nic.Id, out var prev))
            {
                var sent = stats.BytesSent - prev.sent;
                var recv = stats.BytesReceived - prev.received;
                metrics.Network.UploadSpeed += sent / elapsed;
                metrics.Network.DownloadSpeed += recv / elapsed;
                var speed = nic.Speed <= 0 ? 1 : nic.Speed; // bits per second
                var upPct = (sent * 8) / (speed * elapsed) * 100;
                var downPct = (recv * 8) / (speed * elapsed) * 100;
                metrics.Network.Usage = Math.Max(metrics.Network.Usage, Math.Max(upPct, downPct));
            }
            _networkSnapshot[nic.Id] = (stats.BytesSent, stats.BytesReceived);
        }
        _lastNetworkSample = now;

        // Processes
        var processElapsed = (now - _lastProcessSample).TotalSeconds;
        if (processElapsed <= 0) processElapsed = 1;
        var processes = Process.GetProcesses();
        var procInfos = new List<ProcessInfo>();
        foreach (var proc in processes)
        {
            try
            {
                var total = proc.TotalProcessorTime;
                var prev = _processSnapshot.TryGetValue(proc.Id, out var ts) ? ts : TimeSpan.Zero;
                var cpu = ((total - prev).TotalMilliseconds / (processElapsed * 1000 * Environment.ProcessorCount)) * 100;
                var mem = proc.WorkingSet64 / 1024d / 1024d;
                procInfos.Add(new ProcessInfo { Name = proc.ProcessName, Pid = proc.Id, Usage = cpu, Memory = mem });
                _processSnapshot[proc.Id] = total;
            }
            catch { }
        }
        var dead = _processSnapshot.Keys.Except(processes.Select(p => p.Id)).ToList();
        foreach (var d in dead) _processSnapshot.Remove(d);
        metrics.TopProcesses = procInfos.OrderByDescending(p => p.Usage).Take(5).ToList();
        _lastProcessSample = now;
        metrics.Processes = processes.Length;

        // History
        void Enqueue(Queue<double> q, double v)
        {
            q.Enqueue(v);
            if (q.Count > 60) q.Dequeue();
        }
        Enqueue(_cpuHistory, metrics.Cpu.Usage);
        Enqueue(_cpuTempHistory, metrics.Cpu.Temperature);
        Enqueue(_cpuFreqHistory, metrics.Cpu.Frequency);
        Enqueue(_memoryHistory, metrics.Memory.Usage);
        Enqueue(_diskHistory, metrics.Disk.Usage);
        Enqueue(_networkHistory, metrics.Network.Usage);
        Enqueue(_gpuHistory, metrics.Gpu.Usage);
        metrics.History = new PerformanceHistory
        {
            Cpu = _cpuHistory.ToList(),
            CpuTemperature = _cpuTempHistory.ToList(),
            CpuFrequency = _cpuFreqHistory.ToList(),
            Memory = _memoryHistory.ToList(),
            Disk = _diskHistory.ToList(),
            Network = _networkHistory.ToList(),
            Gpu = _gpuHistory.ToList()
        };

        metrics.Timestamp = DateTime.UtcNow;
        return metrics;
    }

    public void Dispose() => _computer.Close();

    private static int GetPhysicalCoreCount()
    {
        try
        {
            using var searcher = new ManagementObjectSearcher("select NumberOfCores from Win32_Processor");
            var count = 0;
            foreach (var mo in searcher.Get())
                count += Convert.ToInt32(mo["NumberOfCores"]);
            return count > 0 ? count : Environment.ProcessorCount;
        }
        catch
        {
            return Environment.ProcessorCount;
        }
    }
    private class UpdateVisitor : IVisitor
    {
        public void VisitComputer(IComputer computer)
        {
            computer.Traverse(this);
        }

        public void VisitHardware(IHardware hardware)
        {
            hardware.Update();
            foreach (var subHardware in hardware.SubHardware)
                subHardware.Accept(this);
        }

        public void VisitSensor(ISensor sensor) { }

        public void VisitParameter(IParameter parameter) { }
    }
}
