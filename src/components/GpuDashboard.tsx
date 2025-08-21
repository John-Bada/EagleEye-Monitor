import { ArrowLeft, Zap, Thermometer, Activity, Monitor } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useMetrics } from "@/hooks/useMetrics";

interface GpuProcess {
  name: string;
  pid: number;
  usage: number;
  memory: number;
}

const GpuDashboard = () => {
  const navigate = useNavigate();
  const metrics = useMetrics();

  const [gpuUsage, setGpuUsage] = useState(0);
  const [temperature, setTemperature] = useState(0);
  const [vramUsed, setVramUsed] = useState(0);
  const [vramTotal, setVramTotal] = useState(0);
  const [powerDraw, setPowerDraw] = useState(0);
  const [fanSpeed, setFanSpeed] = useState(0);
  const [gpuProcesses, setGpuProcesses] = useState<GpuProcess[]>([]);
  const [historicalData, setHistoricalData] = useState<
    { timestamp: number; usage: number; temperature: number; memory: number; power: number }[]
  >([]);

  useEffect(() => {
    if (!metrics) return;
    const usage = metrics.gpu?.usage ?? 0;
    const temp = metrics.gpu?.temperature ?? 0;
    const used = metrics.gpu?.memoryUsed ?? 0;
    const total = metrics.gpu?.memoryTotal ?? 0;
    const power = metrics.gpu?.power ?? 0;
    const fan = metrics.gpu?.fanSpeed ?? 0;

    setGpuUsage(usage);
    setTemperature(temp);
    setVramUsed(used);
    setVramTotal(total);
    setPowerDraw(power);
    setFanSpeed(fan);

    const processes =
      metrics.topProcesses?.map(p => ({
        name: p.name,
        pid: p.pid,
        usage: p.usage,
        memory: p.memory / 1024,
      })) ?? [];
    setGpuProcesses(processes);

    setHistoricalData(prev => [
      ...prev.slice(-19),
      {
        timestamp: Date.now(),
        usage,
        temperature: temp,
        memory: total > 0 ? (used / total) * 100 : 0,
        power,
      },
    ]);
  }, [metrics]);

  const getUsageColor = (value: number) =>
    value < 60 ? "hsl(var(--success))" : value < 85 ? "hsl(var(--warning))" : "hsl(var(--destructive))";

  const getTempColor = (temp: number) =>
    temp < 75 ? "hsl(var(--success))" : temp < 85 ? "hsl(var(--warning))" : "hsl(var(--destructive))";

  const historyTicks = historicalData
    .filter((_, i) => i % 2 === 0)
    .map(d => d.timestamp);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Overview
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-warning/10 rounded-lg">
              <Monitor className="h-6 w-6 text-warning" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">GPU Performance Monitor</h1>
              <p className="text-muted-foreground">Graphics card performance and memory analytics</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex justify-between pb-2">
              <CardTitle className="text-sm font-medium">GPU Usage</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: getUsageColor(gpuUsage) }}>
                {gpuUsage.toFixed(1)}%
              </div>
              <Progress value={gpuUsage} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex justify-between pb-2">
              <CardTitle className="text-sm font-medium">Temperature</CardTitle>
              <Thermometer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: getTempColor(temperature) }}>
                {temperature.toFixed(1)}°C
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex justify-between pb-2">
              <CardTitle className="text-sm font-medium">VRAM Usage</CardTitle>
              <Monitor className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {vramTotal > 0 ? ((vramUsed / vramTotal) * 100).toFixed(1) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                {vramUsed.toFixed(1)} / {vramTotal.toFixed(1)} GB
              </p>
              <Progress value={vramTotal > 0 ? (vramUsed / vramTotal) * 100 : 0} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex justify-between pb-2">
              <CardTitle className="text-sm font-medium">Power Draw</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{powerDraw.toFixed(0)} W</div>
              <p className="text-xs text-muted-foreground">Fan: {fanSpeed.toFixed(0)}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance History</CardTitle>
              <CardDescription>GPU usage, temperature, and memory utilization</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="timestamp"
                    type="number"
                    domain={['dataMin', 'dataMax']}
                    scale="time"
                    ticks={historyTicks}
                    tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Line type="monotone" dataKey="usage" stroke="hsl(var(--warning))" strokeWidth={2} name="Usage %" />
                  <Line
                    type="monotone"
                    dataKey="temperature"
                    stroke="hsl(var(--destructive))"
                    strokeWidth={2}
                    name="Temp °C"
                  />
                  <Line type="monotone" dataKey="memory" stroke="hsl(var(--primary))" strokeWidth={2} name="VRAM %" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Power Consumption</CardTitle>
              <CardDescription>GPU power draw over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="timestamp"
                    type="number"
                    domain={['dataMin', 'dataMax']}
                    scale="time"
                    ticks={historyTicks}
                    tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Area type="monotone" dataKey="power" stroke="hsl(var(--warning))" fill="hsl(var(--warning) / 0.3)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Top Processes</CardTitle>
            <CardDescription>Processes using the most resources</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {gpuProcesses.map((p, i) => (
                <div key={p.pid} className="flex items-center justify-between text-sm">
                  <span className="w-8 text-muted-foreground">{i + 1}</span>
                  <span className="flex-1 truncate">{p.name}</span>
                  <span className="w-20 text-right">{p.usage.toFixed(1)}%</span>
                  <span className="w-24 text-right">{p.memory.toFixed(2)} GB</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GpuDashboard;

