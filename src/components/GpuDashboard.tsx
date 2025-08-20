import {
    ArrowLeft, Zap, Thermometer, Activity, Monitor
} from "lucide-react";
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from "recharts";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

interface GpuProcess {
    name: string;
    pid: number;
    usage: number;
    memory: number;
}

const GpuDashboard = () => {
    const navigate = useNavigate();

    const [gpuUsage, setGpuUsage] = useState(0);
    const [temperature, setTemperature] = useState(0);
    const [vramUsed, setVramUsed] = useState(0);
    const [vramTotal, setVramTotal] = useState(12); // Default VRAM capacity
    const [powerDraw, setPowerDraw] = useState(0);
    const [fanSpeed, setFanSpeed] = useState(0);
    const [gpuProcesses, setGpuProcesses] = useState<GpuProcess[]>([]);
    const [historicalData, setHistoricalData] = useState<
        { time: string; usage: number; temperature: number; memory: number; power: number }[]
    >([]);

    useEffect(() => {
        const fetchGpuStats = async () => {
            try {
                const res = await fetch("http://localhost:7102/api/systemperformance/stats");
                const data = await res.json();

                const usage = data.gpuUsage ?? 0;
                setGpuUsage(usage);

                // If you later add more metrics to backend:
                setTemperature(data.gpuTemperature ?? 0);
                setVramUsed(data.gpuMemoryUsed ?? 0);
                setVramTotal(data.gpuMemoryTotal ?? 12);
                setPowerDraw(data.gpuPowerDraw ?? 0);
                setFanSpeed(data.gpuFanSpeed ?? 0);

                const processes = data.topProcesses?.map((p: GpuProcess) => ({
                    name: p.name,
                    pid: p.pid,
                    usage: p.usage,
                    memory: p.memory / 1024 // Assume memory is in MB → convert to GB
                })) ?? [];
                setGpuProcesses(processes);

                setHistoricalData(prev => [
                    ...prev.slice(-19),
                    {
                        time: new Date().toLocaleTimeString(),
                        usage: usage,
                        temperature: data.gpuTemperature ?? 0,
                        memory: (vramUsed / vramTotal) * 100,
                        power: data.gpuPowerDraw ?? 0
                    }
                ]);
            } catch (err) {
                console.error("Failed to fetch GPU data", err);
            }
        };

        fetchGpuStats();
        const interval = setInterval(fetchGpuStats, 3000);
        return () => clearInterval(interval);
    }, [vramUsed, vramTotal]);

    const getUsageColor = (value: number) =>
        value < 60 ? "hsl(var(--success))" : value < 85 ? "hsl(var(--warning))" : "hsl(var(--destructive))";

    const getTempColor = (temp: number) =>
        temp < 75 ? "hsl(var(--success))" : temp < 85 ? "hsl(var(--warning))" : "hsl(var(--destructive))";

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
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

                {/* Key Metrics */}
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
                                {((vramUsed / vramTotal) * 100).toFixed(1)}%
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {vramUsed.toFixed(1)} / {vramTotal} GB
                            </p>
                            <Progress value={(vramUsed / vramTotal) * 100} className="mt-2" />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Power Draw</CardTitle>
                            <Zap className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-warning">{powerDraw.toFixed(0)} W</div>
                            <p className="text-xs text-muted-foreground">Fan: {fanSpeed.toFixed(0)}%</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts */}
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
                                    <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
                                    <YAxis stroke="hsl(var(--muted-foreground))" />
                                    <Tooltip contentStyle={{
                                        backgroundColor: "hsl(var(--card))",
                                        border: "1px solid hsl(var(--border))",
                                        borderRadius: "8px"
                                    }} />
                                    <Line type="monotone" dataKey="usage" stroke="hsl(var(--warning))" strokeWidth={2} name="Usage %" />
                                    <Line type="monotone" dataKey="temperature" stroke="hsl(var(--destructive))" strokeWidth={2} name="Temp °C" />
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
                                    <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
                                    <YAxis stroke="hsl(var(--muted-foreground))" />
                                    <Tooltip contentStyle={{
                                        backgroundColor: "hsl(var(--card))",
                                        border: "1px solid hsl(var(--border))",
                                        borderRadius: "8px"
                                    }} />
                                    <Area
                                        type="monotone"
                                        dataKey="power"
                                        stroke="hsl(var(--warning))"
                                        fill="hsl(var(--warning))"
                                        fillOpacity={0.3}
                                        name="Power (W)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* GPU Processes */}
                <Card>
                    <CardHeader>
                        <CardTitle>GPU Processes</CardTitle>
                        <CardDescription>Top resource-consuming applications</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {gpuProcesses.map((p, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-warning/10 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-warning/20 rounded-full flex items-center justify-center text-sm font-medium">
                                            {i + 1}
                                        </div>
                                        <div>
                                            <div className="font-medium">{p.name}</div>
                                            <div className="text-sm text-muted-foreground">PID: {p.pid}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-medium" style={{ color: getUsageColor(p.usage) }}>
                                            {p.usage.toFixed(1)}%
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {p.memory.toFixed(1)} GB VRAM
                                        </div>
                                    </div>
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
