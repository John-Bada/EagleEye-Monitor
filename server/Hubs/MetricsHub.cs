using EagleEyeMonitor.Server.Services;
using Microsoft.AspNetCore.SignalR;

namespace EagleEyeMonitor.Server.Hubs;

public class MetricsHub : Hub
{
    private readonly HardwareMonitorService _monitor;

    public MetricsHub(HardwareMonitorService monitor)
    {
        _monitor = monitor;
    }

    public override async Task OnConnectedAsync()
    {
        await Clients.Caller.SendAsync("metrics", _monitor.GetMetrics());
        await base.OnConnectedAsync();
    }
}

