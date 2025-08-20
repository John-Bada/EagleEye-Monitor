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

    public override Task OnConnectedAsync()
    {
        var token = Context.ConnectionAborted;
        _ = BroadcastMetricsAsync(token);
        return base.OnConnectedAsync();
    }

    private async Task BroadcastMetricsAsync(CancellationToken token)
    {
        while (!token.IsCancellationRequested)
        {
            var data = _monitor.GetMetrics();
            await Clients.Caller.SendAsync("metrics", data, token);
            try
            {
                await Task.Delay(TimeSpan.FromSeconds(1), token);
            }
            catch (TaskCanceledException)
            {
                break;
            }
        }
    }
}
