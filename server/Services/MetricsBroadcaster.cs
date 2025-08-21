using EagleEyeMonitor.Server.Hubs;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Hosting;

namespace EagleEyeMonitor.Server.Services;

public class MetricsBroadcaster : BackgroundService
{
    private readonly IHubContext<MetricsHub> _hub;
    private readonly HardwareMonitorService _monitor;

    public MetricsBroadcaster(IHubContext<MetricsHub> hub, HardwareMonitorService monitor)
    {
        _hub = hub;
        _monitor = monitor;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            var data = _monitor.GetMetrics();
            await _hub.Clients.All.SendAsync("metrics", data, stoppingToken);
            try
            {
                await Task.Delay(TimeSpan.FromSeconds(1), stoppingToken);
            }
            catch (TaskCanceledException)
            {
                break;
            }
        }
    }
}
