using EagleEyeMonitor.Server.Hubs;
using EagleEyeMonitor.Server.Services;

var builder = WebApplication.CreateBuilder(args);

// Services
builder.Services.AddSignalR();
builder.Services.AddSingleton<HardwareMonitorService>();

// API Docs
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors(policy => policy
    .AllowAnyHeader()
    .AllowAnyMethod()
    .AllowAnyOrigin());

app.MapHub<MetricsHub>("/hubs/metrics");

app.MapGet("/api/systemPerformance/stats", (HardwareMonitorService monitor) => monitor.GetMetrics());

app.Run();
