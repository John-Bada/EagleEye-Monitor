using System.Collections.Generic;

namespace EagleEyeMonitor.Server.Models;

public class SystemMetrics
{
    public CpuMetrics Cpu { get; set; } = new();
    public MemoryMetrics Memory { get; set; } = new();
    public DiskMetrics Disk { get; set; } = new();
    public NetworkMetrics Network { get; set; } = new();
    public GpuMetrics Gpu { get; set; } = new();
    public List<ProcessInfo> TopProcesses { get; set; } = new();
    public List<MemoryProcess> TopMemoryProcesses { get; set; } = new();
    public MemoryDistribution MemoryDistribution { get; set; } = new();
    public PerformanceHistory History { get; set; } = new();
    public int Processes { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public class CpuMetrics
{
    public double Usage { get; set; }
    public double Temperature { get; set; }
    public double Frequency { get; set; }
    public int Cores { get; set; }
    public int Threads { get; set; }
    public List<CpuCoreMetrics> CoreData { get; set; } = new();
}

public class CpuCoreMetrics
{
    public string Core { get; set; } = string.Empty;
    public double Usage { get; set; }
    public double Temperature { get; set; }
}

public class MemoryMetrics
{
    public double Usage { get; set; }
    public double Total { get; set; }
    public double Available { get; set; }
    public MemoryDetail Physical { get; set; } = new();
    public MemoryDetail Virtual { get; set; } = new();
    public MemoryDetail Cache { get; set; } = new();
    public MemoryDetail Swap { get; set; } = new();
}

public class DiskMetrics
{
    public double Usage { get; set; }
    public double ReadSpeed { get; set; }
    public double WriteSpeed { get; set; }
}

public class NetworkMetrics
{
    public double Usage { get; set; }
    public double UploadSpeed { get; set; }
    public double DownloadSpeed { get; set; }
}

public class GpuMetrics
{
    public double Usage { get; set; }
    public double Temperature { get; set; }
    public double MemoryUsed { get; set; }
    public double MemoryTotal { get; set; }
    public double Power { get; set; }
    public double FanSpeed { get; set; }
}

public class ProcessInfo
{
    public string Name { get; set; } = string.Empty;
    public int Pid { get; set; }
    public double Usage { get; set; }
    public double Memory { get; set; }
}

public class MemoryProcess
{
    public string Name { get; set; } = string.Empty;
    public double Memory { get; set; }
    public string Type { get; set; } = string.Empty;
}

public class MemoryDetail
{
    public double Used { get; set; }
    public double Total { get; set; }
    public double Percentage { get; set; }
}

public class MemoryDistribution
{
    public double Applications { get; set; }
    public double System { get; set; }
    public double Cache { get; set; }
    public double Free { get; set; }
}

public class PerformanceHistory
{
    public List<double> Cpu { get; set; } = new();
    public List<double> CpuTemperature { get; set; } = new();
    public List<double> CpuFrequency { get; set; } = new();
    public List<double> Memory { get; set; } = new();
    public List<double> Disk { get; set; } = new();
    public List<double> Network { get; set; } = new();
    public List<double> Gpu { get; set; } = new();
}
