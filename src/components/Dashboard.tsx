import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
    Cpu,
    MemoryStick,
    HardDrive,
    Wifi,
    MonitorSpeaker,
    Activity,
    AlertTriangle,
    CheckCircle
} from "lucide-react";
import { AreaChart, Area, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useMetrics } from "@/hooks/useMetrics";

// --- Types ---

interface FlattenedMetrics {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
    gpu: number;
    timestamp: string;
}

interface ProcessInfo {
    name: string;
    usage: number;
    memory: number;
    pid: number;
}

const Dashboard = () => {
    const navigate = useNavigate();

    const [metrics, setMetrics] = useState<FlattenedMetrics[]>([]);
    const [currentMetrics, setCurrentMetrics] = useState<FlattenedMetrics>({
        cpu: 0,
        memory: 0,
        disk: 0,
        network: 0,
        gpu: 0,
        timestamp: new Date().toLocaleTimeString()
    });

    const [processes, setProcesses] = useState<ProcessInfo[]>([]);

    const liveMetrics = useMetrics();
    useEffect(() => {
        if (!liveMetrics) return;

        const flattened: FlattenedMetrics = {
            cpu: liveMetrics.cpu?.usage ?? 0,
            memory: liveMetrics.memory?.usage ?? 0,
            disk: liveMetrics.disk?.usage ?? 0,
            network: liveMetrics.network?.uploadSpeed ?? 0,
            gpu: liveMetrics.gpu?.usage ?? 0,
            timestamp: new Date().toLocaleTimeString()
        };

        setCurrentMetrics(flattened);
        setMetrics(prev => [...prev.slice(-19), flattened]);
    }, [liveMetrics]);


    const getStatusColor = (value: number): "success" | "warning" | "destructive" => {
        if (value >= 90) return "destructive";
        if (value >= 70) return "warning";
        return "success";
    };

    const getStatusIcon = (value: number) => {
        if (value >= 70) return <AlertTriangle className="h-4 w-4" />;
        return <CheckCircle className="h-4 w-4" />;
    };

    const renderMetricCard = (
        label: string,
        value: number,
        icon: JSX.Element,
        onClick?: () => void
    ) => (
        <Card
            className="bg-card border-border shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
            onClick={onClick}
        >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{label}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value.toFixed(1)}%</div>
                <Progress value={value} className="mt-2" />
                <div className="flex items-center gap-1 mt-2">
                    {getStatusIcon(value)}
                    <Badge variant={getStatusColor(value)} className="text-xs">
                        {value < 70 ? "Normal" : value < 90 ? "High" : "Critical"}
                    </Badge>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        Eagle Eye System Monitor
                    </h1>
                    <p className="text-muted-foreground">Real-time system performance monitoring</p>
                </div>
                <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary animate-pulse" />
                    <span className="text-sm text-muted-foreground">Live</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {renderMetricCard("CPU Usage", currentMetrics.cpu, <Cpu className="h-4 w-4 text-cpu" />, () => navigate("/cpu"))}
                {renderMetricCard("Memory", currentMetrics.memory, <MemoryStick className="h-4 w-4 text-memory" />, () => navigate("/memory"))}
                {renderMetricCard("Disk I/O", currentMetrics.disk, <HardDrive className="h-4 w-4 text-disk" />, () => navigate("/disk"))}
                {renderMetricCard("Network", currentMetrics.network, <Wifi className="h-4 w-4 text-network" />, () => navigate("/network"))}
                {renderMetricCard("GPU", currentMetrics.gpu, <MonitorSpeaker className="h-4 w-4 text-gpu" />, () => navigate("/gpu"))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 bg-card border-border shadow-lg">
                    <CardHeader>
                        <CardTitle>System Performance Timeline</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={metrics}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="timestamp" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "hsl(var(--card))",
                                        border: "1px solid hsl(var(--border))",
                                        borderRadius: "8px"
                                    }}
                                />
                                <Area type="monotone" dataKey="cpu" stackId="1" stroke="hsl(var(--cpu-color))" fill="hsl(var(--cpu-color) / 0.3)" name="CPU %" />
                                <Area type="monotone" dataKey="memory" stackId="2" stroke="hsl(var(--memory-color))" fill="hsl(var(--memory-color) / 0.3)" name="Memory %" />
                                <Area type="monotone" dataKey="gpu" stackId="3" stroke="hsl(var(--gpu-color))" fill="hsl(var(--gpu-color) / 0.3)" name="GPU %" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="bg-card border-border shadow-lg">
                    <CardHeader>
                        <CardTitle>Top Processes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {processes.map((process) => (
                                <div key={process.pid} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                    <div>
                                        <div className="font-medium text-sm">{process.name}</div>
                                        <div className="text-xs text-muted-foreground">PID: {process.pid}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-medium">{process.usage.toFixed(1)}%</div>
                                        <div className="text-xs text-muted-foreground">{process.memory} MB</div>
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

export default Dashboard;
