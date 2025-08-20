import {
    ArrowLeft,
    Cpu,
    Thermometer,
    Zap,
    Clock
} from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar
} from "recharts";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

const CpuDashboard = () => {
    const navigate = useNavigate();

    const [cpuData, setCpuData] = useState({
        usage: 0,
        temperature: 0,
        frequency: 0,
        cores: 0,
        threads: 0,
        processes: 0
    });

    const [historicalData, setHistoricalData] = useState<
        { time: string; usage: number; temperature: number; frequency: number }[]
    >([]);

    const [coreData, setCoreData] = useState<
        { core: string; usage: number; temperature: number }[]
    >([]);

    const [topProcesses, setTopProcesses] = useState<
        { name: string; usage: number; pid: number }[]
    >([]);

    useEffect(() => {
        const fetchCpuData = async () => {
            try {
                const res = await fetch("https://localhost:7102/api/systemPerformance/stats");
                const data = await res.json();

                const cpu = data.cpu ?? {};
                setCpuData({
                    usage: cpu.usage ?? 0,
                    temperature: cpu.temperature ?? 0,
                    frequency: cpu.frequency ?? 0,
                    cores: cpu.cores ?? 0,
                    threads: cpu.threads ?? 0,
                    processes: data.processes ?? 0
                });

                if (cpu.coreData) setCoreData(cpu.coreData);
                if (data.topProcesses) setTopProcesses(data.topProcesses);

                setHistoricalData(prev => [
                    ...prev.slice(-19),
                    {
                        time: new Date().toLocaleTimeString(),
                        usage: cpu.usage ?? 0,
                        temperature: cpu.temperature ?? 0,
                        frequency: cpu.frequency ?? 0
                    }
                ]);
            } catch (error) {
                console.error("Error fetching CPU data:", error);
            }
        };

        fetchCpuData();
        const interval = setInterval(fetchCpuData, 2000);
        return () => clearInterval(interval);
    }, []);

    const getUsageColor = (usage: number) =>
        usage < 50
            ? "hsl(var(--success))"
            : usage < 80
                ? "hsl(var(--warning))"
                : "hsl(var(--destructive))";

    const getTempColor = (temp: number) =>
        temp < 70
            ? "hsl(var(--success))"
            : temp < 80
                ? "hsl(var(--warning))"
                : "hsl(var(--destructive))";

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
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Cpu className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">CPU Performance Monitor</h1>
                            <p className="text-muted-foreground">
                                Real-time processor analytics and core monitoring
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                        {
                            label: "CPU Usage",
                            icon: <Cpu className="h-4 w-4 text-muted-foreground" />,
                            value: cpuData.usage.toFixed(1) + "%",
                            color: getUsageColor(cpuData.usage),
                            progress: cpuData.usage
                        },
                        {
                            label: "Temperature",
                            icon: <Thermometer className="h-4 w-4 text-muted-foreground" />,
                            value: cpuData.temperature.toFixed(1) + "°C",
                            color: getTempColor(cpuData.temperature),
                            progress: cpuData.temperature,
                            max: 100
                        },
                        {
                            label: "Frequency",
                            icon: <Zap className="h-4 w-4 text-muted-foreground" />,
                            value: cpuData.frequency.toFixed(2) + " GHz",
                            color: "hsl(var(--foreground))",
                            progress: cpuData.frequency,
                            max: 5
                        },
                        {
                            label: "Threads",
                            icon: <Clock className="h-4 w-4 text-muted-foreground" />,
                            value: cpuData.threads.toString()
                        },
                        {
                            label: "Cores",
                            icon: <Cpu className="h-4 w-4 text-muted-foreground" />,
                            value: cpuData.cores.toString()
                        },
                        {
                            label: "Processes",
                            icon: <Zap className="h-4 w-4 text-muted-foreground" />,
                            value: cpuData.processes.toString()
                        }
                    ].map((stat, idx) => (
                        <Card key={idx}>
                            <CardHeader className="flex justify-between items-center pb-2">
                                <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                                {stat.icon}
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
                                {stat.progress !== undefined && (
                                    <Progress
                                        value={stat.progress}
                                        className="mt-2"
                                        max={stat.max || 100}
                                    />
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Performance History</CardTitle>
                            <CardDescription>
                                CPU usage, temperature, and frequency over time
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={historicalData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                    <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
                                    <YAxis stroke="hsl(var(--muted-foreground))" />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "hsl(var(--card))",
                                            border: "1px solid hsl(var(--border))",
                                            borderRadius: "8px"
                                        }}
                                    />
                                    <Line type="monotone" dataKey="usage" stroke="hsl(var(--primary))" strokeWidth={2} name="Usage %" />
                                    <Line type="monotone" dataKey="temperature" stroke="hsl(var(--warning))" strokeWidth={2} name="Temp °C" />
                                    <Line type="monotone" dataKey="frequency" stroke="hsl(var(--success))" strokeWidth={2} name="Freq GHz" />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Per-Core Analysis</CardTitle>
                            <CardDescription>Individual core usage and temperature</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={coreData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                    <XAxis dataKey="core" stroke="hsl(var(--muted-foreground))" />
                                    <YAxis stroke="hsl(var(--muted-foreground))" />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "hsl(var(--card))",
                                            border: "1px solid hsl(var(--border))",
                                            borderRadius: "8px"
                                        }}
                                    />
                                    <Bar dataKey="usage" fill="hsl(var(--primary))" name="Usage %" />
                                    <Bar dataKey="temperature" fill="hsl(var(--warning))" name="Temp °C" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* Top Processes */}
                <Card>
                    <CardHeader>
                        <CardTitle>Top CPU Consuming Processes</CardTitle>
                        <CardDescription>Processes using the most CPU resources</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {topProcesses.map((p, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium">
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
                                        <Progress value={p.usage} className="w-20 mt-1" />
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

export default CpuDashboard;
