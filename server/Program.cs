using EagleEyeMonitor.Server.Hubs;
using EagleEyeMonitor.Server.Services;

var builder = WebApplication.CreateBuilder(args);

// Listen on all network interfaces so the frontend proxy can always reach
// the backend, regardless of whether the machine prefers IPv4 or IPv6.
// Binding to 0.0.0.0 covers both scenarios and avoids connection-refused
// errors when the proxy targets 127.0.0.1.
builder.WebHost.UseUrls("http://0.0.0.0:5019");

// Services
builder.Services.AddSignalR();
builder.Services.AddSingleton<HardwareMonitorService>();
builder.Services.AddHostedService<MetricsBroadcaster>();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.AllowAnyHeader()
              .AllowAnyMethod()
              .AllowAnyOrigin());
});

// API Docs
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();

app.MapHub<MetricsHub>("/hubs/metrics");

app.MapGet("/api/systemPerformance/stats", (HardwareMonitorService monitor) => monitor.GetMetrics());

app.Run();
