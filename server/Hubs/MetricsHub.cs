using EagleEyeMonitor.Server.Services;
using Microsoft.AspNetCore.SignalR;

namespace EagleEyeMonitor.Server.Hubs;

public class MetricsHub : Hub
{
    private readonly HardwareMonitorService _monitor;
    private Timer? _timer;

    public MetricsHub(HardwareMonitorService monitor)
    {
        _monitor = monitor;
    }

    public override Task OnConnectedAsync()
    {
        _timer = new Timer(async _ =>
        {
            var data = _monitor.GetMetrics();
            await Clients.Caller.SendAsync("metrics", data);
        }, null, TimeSpan.Zero, TimeSpan.FromSeconds(1));
        return base.OnConnectedAsync();
    }

    public override Task OnDisconnectedAsync(Exception? exception)
    {
        _timer?.Dispose();
        return base.OnDisconnectedAsync(exception);
    }
}
