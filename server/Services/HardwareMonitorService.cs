using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Net.NetworkInformation;
using System.Net.Sockets;
using System.Management;
using EagleEyeMonitor.Server.Models;
using LibreHardwareMonitor.Hardware;

namespace EagleEyeMonitor.Server.Services;

public class HardwareMonitorService : IDisposable
{
    private readonly Computer _computer;
    private readonly UpdateVisitor _visitor = new();
    private readonly Dictionary<string, (long sent, long received)> _networkSnapshot = new();
    private readonly Dictionary<string, (long sent, long received)> _networkBaseline = new();
    private readonly Dictionary<int, TimeSpan> _processSnapshot = new();
    private DateTime _lastNetworkSample = DateTime.UtcNow;
    private DateTime _lastProcessSample = DateTime.UtcNow;
    private readonly Queue<double> _cpuHistory = new();
    private readonly Queue<double> _cpuTempHistory = new();
    private readonly Queue<double> _cpuFreqHistory = new();
    private readonly Queue<double> _memoryHistory = new();
    private readonly Queue<double> _diskHistory = new();
    private readonly Queue<double> _networkHistory = new();
    private readonly Queue<double> _networkDownHistory = new();
    private readonly Queue<double> _networkUpHistory = new();
    private readonly Queue<double> _pingHistory = new();
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

    private static IEnumerable<ISensor> EnumerateSensors(IHardware hardware)
    {
        foreach (var sensor in hardware.Sensors)
            yield return sensor;

        foreach (var sub in hardware.SubHardware)
        {
            sub.Update();
            foreach (var sensor in EnumerateSensors(sub))
                yield return sensor;
        }
    }

    public SystemMetrics GetMetrics()
    {
        _computer.Accept(_visitor);
        var metrics = new SystemMetrics();

        double totalVirtualKb = 0;
        double freeVirtualKb = 0;
        double totalSwapKb = 0;
        double freeSwapKb = 0;
        double cacheBytes = 0;

        if (OperatingSystem.IsWindows())
        {
            try
            {
                using var searcher = new ManagementObjectSearcher("select TotalVirtualMemorySize, FreeVirtualMemory, TotalSwapSpaceSize, FreeSpaceInPagingFiles, SizeStoredInPagingFiles from Win32_OperatingSystem");
                foreach (var mo in searcher.Get())
                {
                    totalVirtualKb = Convert.ToDouble(mo["TotalVirtualMemorySize"]);
                    freeVirtualKb = Convert.ToDouble(mo["FreeVirtualMemory"]);
                    totalSwapKb = Convert.ToDouble(mo["TotalSwapSpaceSize"]);
                    if (totalSwapKb <= 0)
                        totalSwapKb = Convert.ToDouble(mo["SizeStoredInPagingFiles"]);
                    freeSwapKb = Convert.ToDouble(mo["FreeSpaceInPagingFiles"]);
                    break;
                }
            }
            catch { }

            try
            {
                using var cacheCounter = new PerformanceCounter("Memory", "Cache Bytes");
                cacheBytes = cacheCounter.NextValue();
            }
            catch { }
        }

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
                    foreach (var sensor in EnumerateSensors(hardware))
                    {
                        var name = sensor.Name.ToLowerInvariant();
                        switch (sensor.SensorType)
                        {
                            case SensorType.Load when name.Contains("core") || name.Contains("gpu"):
                                metrics.Gpu.Usage = sensor.Value ?? metrics.Gpu.Usage;
                                break;
                            case SensorType.Temperature when name.Contains("core") || name.Contains("gpu"):
                                metrics.Gpu.Temperature = sensor.Value ?? metrics.Gpu.Temperature;
                                break;
                            case SensorType.SmallData or SensorType.Data when name.Contains("memory used") || name.Contains("used memory"):
                                metrics.Gpu.MemoryUsed = (sensor.Value ?? 0) / 1024.0;
                                break;
                            case SensorType.SmallData or SensorType.Data when name.Contains("memory total") || name.Contains("total memory"):
                                metrics.Gpu.MemoryTotal = (sensor.Value ?? 0) / 1024.0;
                                break;
                            case SensorType.Power when name.Contains("gpu"):
                                metrics.Gpu.Power = sensor.Value ?? metrics.Gpu.Power;
                                break;
                            case SensorType.Fan when name.Contains("gpu"):
                                metrics.Gpu.FanSpeed = sensor.Value ?? metrics.Gpu.FanSpeed;
                                break;
                        }
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
        long totalSent = 0;
        long totalRecv = 0;
        foreach (var nic in NetworkInterface.GetAllNetworkInterfaces())
        {
            if (nic.NetworkInterfaceType == NetworkInterfaceType.Loopback)
                continue;
            var stats = nic.GetIPv4Statistics();
            if (!_networkBaseline.ContainsKey(nic.Id))
                _networkBaseline[nic.Id] = (stats.BytesSent, stats.BytesReceived);
            if (_networkSnapshot.TryGetValue(nic.Id, out var prev))
            {
                var sent = stats.BytesSent - prev.sent;
                var recv = stats.BytesReceived - prev.received;
                metrics.Network.UploadSpeed += sent * 8 / 1_000_000d / elapsed;
                metrics.Network.DownloadSpeed += recv * 8 / 1_000_000d / elapsed;
                var speed = nic.Speed <= 0 ? 1 : nic.Speed; // bits per second
                var upPct = (sent * 8) / (speed * elapsed) * 100;
                var downPct = (recv * 8) / (speed * elapsed) * 100;
                metrics.Network.Usage = Math.Max(metrics.Network.Usage, Math.Max(upPct, downPct));
            }
            _networkSnapshot[nic.Id] = (stats.BytesSent, stats.BytesReceived);

            var baseline = _networkBaseline[nic.Id];
            totalSent += stats.BytesSent - baseline.sent;
            totalRecv += stats.BytesReceived - baseline.received;

            var ip = nic.GetIPProperties().UnicastAddresses
                .FirstOrDefault(a => a.Address.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork)?.Address
                .ToString() ?? string.Empty;
            metrics.Network.Interfaces.Add(new NetworkInterfaceInfo
            {
                Name = nic.Name,
                Status = nic.OperationalStatus == OperationalStatus.Up ? "Connected" : "Disconnected",
                Speed = $"{nic.Speed / 1_000_000d:F0} Mbps",
                Ip = ip
            });
        }
        metrics.Network.Data = new DataTransfer
        {
            Up = totalSent / 1024d / 1024d / 1024d,
            Down = totalRecv / 1024d / 1024d / 1024d
        };

        try
        {
            using var ping = new Ping();
            var reply = ping.Send("8.8.8.8", 1000);
            if (reply.Status == IPStatus.Success)
                metrics.Network.Ping = reply.RoundtripTime;
        }
        catch { }

        var ipProps = IPGlobalProperties.GetIPGlobalProperties();
        foreach (var conn in ipProps.GetActiveTcpConnections().Take(10))
        {
            // Disambiguate from Microsoft.AspNetCore.Http.ConnectionInfo
            metrics.Network.Connections.Add(new Models.ConnectionInfo
            {
                Protocol = "TCP",
                RemoteAddress = conn.RemoteEndPoint.Address.ToString(),
                Port = conn.RemoteEndPoint.Port,
                State = conn.State.ToString(),
                Process = conn.LocalEndPoint.ToString()
            });
        }

        _lastNetworkSample = now;

        // Processes
        var processElapsed = (now - _lastProcessSample).TotalSeconds;
        if (processElapsed <= 0) processElapsed = 1;
        var processes = Process.GetProcesses();
        var procInfos = new List<ProcessInfo>();
        var memProcInfos = new List<MemoryProcess>();
        long appBytes = 0;
        foreach (var proc in processes)
        {
            try
            {
                var total = proc.TotalProcessorTime;
                var prev = _processSnapshot.TryGetValue(proc.Id, out var ts) ? ts : TimeSpan.Zero;
                var cpu = ((total - prev).TotalMilliseconds / (processElapsed * 1000 * Environment.ProcessorCount)) * 100;
                var memBytes = proc.WorkingSet64;
                var memMb = memBytes / 1024d / 1024d;
                procInfos.Add(new ProcessInfo { Name = proc.ProcessName, Pid = proc.Id, Usage = cpu, Memory = memMb });
                memProcInfos.Add(new MemoryProcess
                {
                    Name = proc.ProcessName,
                    Memory = memBytes / 1024d / 1024d / 1024d,
                    Type = proc.SessionId == 0 ? "System" : "Application"
                });
                appBytes += memBytes;
                _processSnapshot[proc.Id] = total;
            }
            catch { }
        }
        var dead = _processSnapshot.Keys.Except(processes.Select(p => p.Id)).ToList();
        foreach (var d in dead) _processSnapshot.Remove(d);
        metrics.TopProcesses = procInfos.OrderByDescending(p => p.Usage).Take(5).ToList();
        metrics.TopMemoryProcesses = memProcInfos.OrderByDescending(p => p.Memory).Take(5).ToList();
        _lastProcessSample = now;
        metrics.Processes = processes.Length;

        // Detailed memory stats
        var physicalTotalGb = metrics.Memory.Total;
        var physicalFreeGb = metrics.Memory.Available;
        var physicalUsedGb = physicalTotalGb - physicalFreeGb;
        metrics.Memory.Physical = new MemoryDetail { Total = physicalTotalGb, Used = physicalUsedGb, Percentage = metrics.Memory.Usage };

        var virtualTotalGb = totalVirtualKb / 1024 / 1024;
        var virtualFreeGb = freeVirtualKb / 1024 / 1024;
        metrics.Memory.Virtual = new MemoryDetail
        {
            Total = virtualTotalGb,
            Used = virtualTotalGb - virtualFreeGb,
            Percentage = virtualTotalGb > 0 ? (virtualTotalGb - virtualFreeGb) / virtualTotalGb * 100 : 0
        };

        var cacheGb = cacheBytes / 1024 / 1024 / 1024;
        metrics.Memory.Cache = new MemoryDetail
        {
            Total = physicalTotalGb,
            Used = cacheGb,
            Percentage = physicalTotalGb > 0 ? cacheGb / physicalTotalGb * 100 : 0
        };

        var swapTotalGb = totalSwapKb / 1024 / 1024;
        var swapFreeGb = freeSwapKb / 1024 / 1024;
        metrics.Memory.Swap = new MemoryDetail
        {
            Total = swapTotalGb,
            Used = swapTotalGb - swapFreeGb,
            Percentage = swapTotalGb > 0 ? (swapTotalGb - swapFreeGb) / swapTotalGb * 100 : 0
        };

        var totalPhysBytes = physicalTotalGb * 1024 * 1024 * 1024;
        var cacheBytesTotal = cacheGb * 1024 * 1024 * 1024;
        var freeBytes = physicalFreeGb * 1024 * 1024 * 1024;
        var systemBytes = Math.Max(totalPhysBytes - (appBytes + cacheBytesTotal + freeBytes), 0);
        metrics.MemoryDistribution = new MemoryDistribution
        {
            Applications = totalPhysBytes > 0 ? appBytes / totalPhysBytes * 100 : 0,
            System = totalPhysBytes > 0 ? systemBytes / totalPhysBytes * 100 : 0,
            Cache = totalPhysBytes > 0 ? cacheBytesTotal / totalPhysBytes * 100 : 0,
            Free = totalPhysBytes > 0 ? freeBytes / totalPhysBytes * 100 : 0
        };

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
        Enqueue(_networkDownHistory, metrics.Network.DownloadSpeed);
        Enqueue(_networkUpHistory, metrics.Network.UploadSpeed);
        Enqueue(_pingHistory, metrics.Network.Ping);
        Enqueue(_gpuHistory, metrics.Gpu.Usage);
        metrics.History = new PerformanceHistory
        {
            Cpu = _cpuHistory.ToList(),
            CpuTemperature = _cpuTempHistory.ToList(),
            CpuFrequency = _cpuFreqHistory.ToList(),
            Memory = _memoryHistory.ToList(),
            Disk = _diskHistory.ToList(),
            Network = _networkHistory.ToList(),
            NetworkDownload = _networkDownHistory.ToList(),
            NetworkUpload = _networkUpHistory.ToList(),
            Ping = _pingHistory.ToList(),
            Gpu = _gpuHistory.ToList()
        };

        metrics.Timestamp = DateTime.UtcNow;
        return metrics;
    }

    public void Dispose() => _computer.Close();

    private static int GetPhysicalCoreCount()
    {
        if (OperatingSystem.IsWindows())
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

        return Environment.ProcessorCount;
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
