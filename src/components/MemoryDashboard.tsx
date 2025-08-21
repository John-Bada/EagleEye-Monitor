import { ArrowLeft, MemoryStick, HardDrive, Zap, Activity } from "lucide-react";
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
    PieChart,
    Pie,
    Cell
} from "recharts";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useMetrics } from "@/hooks/useMetrics";

interface MemoryUsage {
    used: number;
    total: number;
    percentage: number;
}

interface MemoryData {
    physical: MemoryUsage;
    virtual: MemoryUsage;
    cache: MemoryUsage;
    swap: MemoryUsage;
}

interface HistoricalMemory {
    timestamp: number;
    physical: number;
    virtual: number;
    cache: number;
    swap: number;
}

interface MemoryDistribution {
    name: string;
    value: number;
    color: string;
}

interface MemoryProcess {
    name: string;
    memory: number;
    type: string;
}

const MemoryDashboard = () => {
    const navigate = useNavigate();
    const [memoryData, setMemoryData] = useState<MemoryData>({
        physical: { used: 0, total: 0, percentage: 0 },
        virtual: { used: 0, total: 0, percentage: 0 },
        cache: { used: 0, total: 0, percentage: 0 },
        swap: { used: 0, total: 0, percentage: 0 }
    });

    const [historicalData, setHistoricalData] = useState<HistoricalMemory[]>([]);
    const [distribution, setDistribution] = useState<MemoryDistribution[]>([]);
    const [topProcesses, setTopProcesses] = useState<MemoryProcess[]>([]);

    const liveMetrics = useMetrics();

    useEffect(() => {
        if (!liveMetrics) return;

        const memory = liveMetrics.memory;
        setMemoryData({
            physical: memory.physical ?? { used: 0, total: 0, percentage: 0 },
            virtual: memory.virtual ?? { used: 0, total: 0, percentage: 0 },
            cache: memory.cache ?? { used: 0, total: 0, percentage: 0 },
            swap: memory.swap ?? { used: 0, total: 0, percentage: 0 }
        });

        setTopProcesses(liveMetrics.topMemoryProcesses ?? []);

        setDistribution([
            {
                name: "Applications",
                value: liveMetrics.memoryDistribution?.applications ?? 0,
                color: "hsl(var(--primary))"
            },
            {
                name: "System",
                value: liveMetrics.memoryDistribution?.system ?? 0,
                color: "hsla(122, 96%, 27%, 1.00)"
            },
            {
                name: "Cache",
                value: liveMetrics.memoryDistribution?.cache ?? 0,
                color: "hsla(284, 98%, 32%, 1.00)"
            },
            {
                name: "Free",
                value: liveMetrics.memoryDistribution?.free ?? 0,
                color: "hsl(var(--muted))"
            }
        ]);

        setHistoricalData(prev => [
            ...prev.slice(-59),
            {
                timestamp: Date.now(),
                physical: memory.physical?.percentage ?? 0,
                virtual: memory.virtual?.percentage ?? 0,
                cache: memory.cache?.percentage ?? 0,
                swap: memory.swap?.percentage ?? 0
            }
        ]);
    }, [liveMetrics]);

    const getMemoryColor = (percentage: number): string => {
        if (percentage < 60) return "hsl(var(--success))";
        if (percentage < 80) return "hsl(var(--warning))";
        return "hsl(var(--destructive))";
    };

    const historyTicks = historicalData
        .filter((_, i) => i % 2 === 0)
        .map(d => d.timestamp);

    const renderMemoryCard = (
        title: string,
        usage: MemoryUsage,
        icon: JSX.Element
    ) => (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold" style={{ color: getMemoryColor(usage.percentage) }}>
                    {usage.percentage.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                    {usage.used.toFixed(1)} / {usage.total.toFixed(1)} GB
                </p>
                <Progress value={usage.percentage} className="mt-2" />
            </CardContent>
        </Card>
    );

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Overview
                    </Button>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-secondary/10 rounded-lg">
                            <MemoryStick className="h-6 w-6 text-secondary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Memory Performance Monitor</h1>
                            <p className="text-muted-foreground">Comprehensive RAM and virtual memory analysis</p>
                        </div>
                    </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {renderMemoryCard("Physical RAM", memoryData.physical, <MemoryStick className="h-4 w-4 text-muted-foreground" />)}
                    {renderMemoryCard("Virtual Memory", memoryData.virtual, <HardDrive className="h-4 w-4 text-muted-foreground" />)}
                    {renderMemoryCard("Cache", memoryData.cache, <Zap className="h-4 w-4 text-muted-foreground" />)}
                    {renderMemoryCard("Swap", memoryData.swap, <Activity className="h-4 w-4 text-muted-foreground" />)}
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Memory Usage History</CardTitle>
                            <CardDescription>Trends in RAM usage</CardDescription>
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
                                        stroke="hsl(var(--muted-foreground))"
                                        tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                                    />
                                    <YAxis stroke="hsl(var(--muted-foreground))" />
                                       <Tooltip
                                        contentStyle={{
                                            backgroundColor: "hsl(var(--card))",
                                            border: "1px solid hsl(var(--border))",
                                            borderRadius: "8px"
                                        }}
                                    />
                                    <Line type="monotone" dataKey="physical" stroke="hsl(195 100% 50%)" strokeWidth={2} />
                                    <Line type="monotone" dataKey="virtual" stroke="hsl(0 75% 60%)" strokeWidth={2} />
                                    <Line type="monotone" dataKey="cache" stroke="hsl(142 76% 55%)" strokeWidth={2} />
                                    <Line type="monotone" dataKey="swap" stroke="hsl(var(--warning))" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Memory Distribution</CardTitle>
                            <CardDescription>How memory is allocated</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie data={distribution} innerRadius={60} outerRadius={100} dataKey="value">
                                        {distribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                     <Tooltip
                                        contentStyle={{
                                            backgroundColor: "hsla(58, 100%, 39%, 1.00)",
                                            border: "1px solid hsl(var(--border))",
                                            borderRadius: "8px"
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="grid grid-cols-2 gap-2 mt-4">
                                {distribution.map((type, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: type.color }} />
                                        <span className="text-sm">{type.name}:{Math.round(type.value * 1000) / 1000}
                                     %</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Top Memory Processes */}
                <Card>
                    <CardHeader>
                        <CardTitle>Top Memory Consuming Processes</CardTitle>
                        <CardDescription>Applications using the most RAM</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {topProcesses.map((process, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center text-sm font-medium">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <div className="font-medium">{process.name}</div>
                                            <div className="text-sm text-muted-foreground">{process.type}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-medium text-secondary">{process.memory.toFixed(1)} GB</div>
                                        <div className="text-sm text-muted-foreground">
                                            {((process.memory / memoryData.physical.total) * 100).toFixed(1)}%
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

export default MemoryDashboard;
