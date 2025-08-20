import {
    ArrowLeft,
    Wifi,
    Download,
    Upload,
    Signal,
    Globe
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
    PieChart,
    Pie,
    Cell
} from "recharts";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

type NetworkInterface = {
    name: string;
    status: string;
    speed: string;
    ip: string;
};

type NetworkConnection = {
    process: string;
    protocol: string;
    remoteAddress: string;
    port: number;
    status: string;
};

type TrafficItem = {
    name: string;
    value: number;
    color: string;
};

type HistoricalEntry = {
    time: string;
    download: number;
    upload: number;
    ping: number;
};

const NetworkDashboard = () => {
    const navigate = useNavigate();

    const [networkData, setNetworkData] = useState({
        downloadSpeed: 0,
        uploadSpeed: 0,
        ping: 0,
        packetsReceived: 0,
        packetsSent: 0,
        bytesReceived: 0,
        bytesSent: 0
    });

    const [interfaces, setInterfaces] = useState<NetworkInterface[]>([]);
    const [connections, setConnections] = useState<NetworkConnection[]>([]);
    const [trafficData, setTrafficData] = useState<TrafficItem[]>([]);

    const [historicalData, setHistoricalData] = useState<HistoricalEntry[]>([]);

    useEffect(() => {
        const fetchNetworkStats = async () => {
            try {
                const response = await fetch("http://localhost:7102/api/systemperformance/stats");
                const data = await response.json();

                const net = data.network;

                setNetworkData({
                    downloadSpeed: net.downloadSpeed,
                    uploadSpeed: net.uploadSpeed,
                    ping: net.ping,
                    packetsReceived: net.packetsReceived,
                    packetsSent: net.packetsSent,
                    bytesReceived: net.bytesReceived,
                    bytesSent: net.bytesSent
                });

                if (net.interfaces) setInterfaces(net.interfaces);
                if (net.connections) setConnections(net.connections);
                if (net.trafficDistribution) setTrafficData(net.trafficDistribution);

                setHistoricalData((prev) => {
                    const newEntry: HistoricalEntry = {
                        time: new Date().toLocaleTimeString(),
                        download: net.downloadSpeed,
                        upload: net.uploadSpeed,
                        ping: net.ping
                    };
                    return [...prev.slice(-19), newEntry];
                });
            } catch (err) {
                console.error("Failed to fetch network stats", err);
            }
        };

        fetchNetworkStats();
        const interval = setInterval(fetchNetworkStats, 3000);
        return () => clearInterval(interval);
    }, []);

    const getSpeedColor = (speed: number, max: number) => {
        const percent = (speed / max) * 100;
        if (percent > 70) return "hsl(var(--success))";
        if (percent > 40) return "hsl(var(--warning))";
        return "hsl(var(--destructive))";
    };

    const getPingColor = (ping: number) => {
        if (ping < 20) return "hsl(var(--success))";
        if (ping < 50) return "hsl(var(--warning))";
        return "hsl(var(--destructive))";
    };

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
                        <div className="p-2 bg-success/10 rounded-lg">
                            <Wifi className="h-6 w-6 text-success" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Network Performance Monitor</h1>
                            <p className="text-muted-foreground">Network traffic analysis and connection monitoring</p>
                        </div>
                    </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex justify-between items-center pb-2">
                            <CardTitle className="text-sm font-medium">Download Speed</CardTitle>
                            <Download className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold" style={{ color: getSpeedColor(networkData.downloadSpeed, 500) }}>
                                {networkData.downloadSpeed.toFixed(1)} Mbps
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex justify-between items-center pb-2">
                            <CardTitle className="text-sm font-medium">Upload Speed</CardTitle>
                            <Upload className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold" style={{ color: getSpeedColor(networkData.uploadSpeed, 200) }}>
                                {networkData.uploadSpeed.toFixed(1)} Mbps
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex justify-between items-center pb-2">
                            <CardTitle className="text-sm font-medium">Ping</CardTitle>
                            <Signal className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold" style={{ color: getPingColor(networkData.ping) }}>
                                {networkData.ping.toFixed(0)} ms
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex justify-between items-center pb-2">
                            <CardTitle className="text-sm font-medium">Data Transferred</CardTitle>
                            <Globe className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent className="text-sm">
                            <div className="text-success">↓ {networkData.bytesReceived.toFixed(1)} GB</div>
                            <div className="text-warning">↑ {networkData.bytesSent.toFixed(1)} GB</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Interfaces */}
                <Card>
                    <CardHeader>
                        <CardTitle>Network Interfaces</CardTitle>
                        <CardDescription>Active adapters and IPs</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {interfaces.map((iface, i) => (
                                <div key={i} className="p-4 border rounded-lg space-y-3">
                                    <div className="flex justify-between items-center">
                                        <div className="flex gap-2 items-center">
                                            <Wifi className="h-5 w-5" />
                                            <span className="font-medium">{iface.name}</span>
                                        </div>
                                        <div className={`text-sm px-2 py-1 rounded ${iface.status === "Connected"
                                            ? "bg-success/20 text-success"
                                            : "bg-destructive/20 text-destructive"
                                            }`}>
                                            {iface.status}
                                        </div>
                                    </div>
                                    <div className="text-sm space-y-1">
                                        <div>Speed: {iface.speed}</div>
                                        <div>IP: {iface.ip}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Historical Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Network History</CardTitle>
                        <CardDescription>Download, Upload, and Ping</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={historicalData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
                                <YAxis stroke="hsl(var(--muted-foreground))" />
                                <Tooltip />
                                <Line type="monotone" dataKey="download" stroke="hsl(var(--success))" strokeWidth={2} name="Download" />
                                <Line type="monotone" dataKey="upload" stroke="hsl(var(--warning))" strokeWidth={2} name="Upload" />
                                <Line type="monotone" dataKey="ping" stroke="hsl(var(--destructive))" strokeWidth={2} name="Ping" />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Traffic Pie */}
                {trafficData.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Traffic Distribution</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={trafficData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={120}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {trafficData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                )}

                {/* Active Connections */}
                <Card>
                    <CardHeader>
                        <CardTitle>Active Connections</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {connections.map((conn, i) => (
                            <div key={i} className="flex justify-between p-3 bg-secondary/20 rounded-lg">
                                <div>
                                    <div className="font-medium">{conn.process}</div>
                                    <div className="text-sm text-muted-foreground">{conn.protocol}</div>
                                </div>
                                <div className="text-right text-sm">
                                    <div>{conn.remoteAddress}:{conn.port}</div>
                                    <div className={`px-2 py-1 text-xs rounded ${conn.status === "Established"
                                        ? "bg-success/20 text-success"
                                        : conn.status === "Listening"
                                            ? "bg-warning/20 text-warning"
                                            : "bg-muted/20 text-muted-foreground"
                                        }`}>
                                        {conn.status}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default NetworkDashboard;
