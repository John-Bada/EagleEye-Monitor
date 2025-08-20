namespace EagleEyeMonitor.Server.Models;

public class SystemMetrics
{
    public CpuMetrics Cpu { get; set; } = new();
    public MemoryMetrics Memory { get; set; } = new();
    public DiskMetrics Disk { get; set; } = new();
    public NetworkMetrics Network { get; set; } = new();
    public GpuMetrics Gpu { get; set; } = new();
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
}

public class MemoryMetrics
{
    public double Usage { get; set; }
    public double Total { get; set; }
    public double Available { get; set; }
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
}
