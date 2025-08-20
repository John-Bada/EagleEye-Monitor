using System.Diagnostics;
using EagleEyeMonitor.Server.Models;
using LibreHardwareMonitor.Hardware;

namespace EagleEyeMonitor.Server.Services;

public class HardwareMonitorService : IDisposable
{
    private readonly Computer _computer;
    private readonly UpdateVisitor _visitor = new();

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
                    metrics.Cpu.Cores = Environment.ProcessorCount;
                    metrics.Cpu.Threads = Environment.ProcessorCount;
                    foreach (var sensor in hardware.Sensors)
                    {
                        if (sensor.SensorType == SensorType.Load && sensor.Name.Equals("CPU Total", StringComparison.OrdinalIgnoreCase))
                            metrics.Cpu.Usage = sensor.Value ?? 0;
                        else if (sensor.SensorType == SensorType.Temperature && sensor.Name.Contains("Package"))
                            metrics.Cpu.Temperature = sensor.Value ?? 0;
                        else if (sensor.SensorType == SensorType.Clock && sensor.Name.Contains("Core"))
                            metrics.Cpu.Frequency += sensor.Value ?? 0;
                    }
                    if (metrics.Cpu.Cores > 0)
                        metrics.Cpu.Frequency /= metrics.Cpu.Cores;
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
                        if (sensor.SensorType == SensorType.Load && sensor.Name.Contains("Used Space"))
                            metrics.Disk.Usage = Math.Max(metrics.Disk.Usage, sensor.Value ?? 0);
                        else if (sensor.SensorType == SensorType.Throughput && sensor.Name.Contains("Read"))
                            metrics.Disk.ReadSpeed += sensor.Value ?? 0;
                        else if (sensor.SensorType == SensorType.Throughput && sensor.Name.Contains("Write"))
                            metrics.Disk.WriteSpeed += sensor.Value ?? 0;
                    }
                    break;
                case HardwareType.Network:
                    foreach (var sensor in hardware.Sensors)
                    {
                        if (sensor.SensorType == SensorType.Throughput && sensor.Name.Contains("Upload"))
                            metrics.Network.UploadSpeed += sensor.Value ?? 0;
                        else if (sensor.SensorType == SensorType.Throughput && sensor.Name.Contains("Download"))
                            metrics.Network.DownloadSpeed += sensor.Value ?? 0;
                    }
                    break;
                case HardwareType.GpuNvidia:
                case HardwareType.GpuAmd:
                case HardwareType.GpuIntel:
                    foreach (var sensor in hardware.Sensors)
                    {
                        if (sensor.SensorType == SensorType.Load && sensor.Name.Contains("Core"))
                            metrics.Gpu.Usage = sensor.Value ?? 0;
                    }
                    break;
            }
        }

        metrics.Processes = Process.GetProcesses().Length;
        metrics.Timestamp = DateTime.UtcNow;
        return metrics;
    }

    public void Dispose() => _computer.Close();
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
