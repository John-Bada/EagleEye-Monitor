import { ArrowLeft, HardDrive } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useMetrics } from "@/hooks/useMetrics";

const DiskDashboard = () => {
  const navigate = useNavigate();
  const metrics = useMetrics();

  const diskUsage = metrics?.disk.usage ?? 0;
  const topProcesses = metrics?.topProcesses ?? [];

  const getUsageColor = (usage: number) => {
    if (usage < 70) return "hsl(var(--success))";
    if (usage < 85) return "hsl(var(--warning))";
    return "hsl(var(--destructive))";
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Overview
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent/10 rounded-lg">
              <HardDrive className="h-6 w-6 text-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Disk Monitor</h1>
              <p className="text-muted-foreground">Real-time disk usage monitoring</p>
            </div>
          </div>
        </div>

        {/* Disk Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Disk Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" style={{ color: getUsageColor(diskUsage) }}>
              {diskUsage.toFixed(1)}%
            </div>
            <Progress value={diskUsage} className="mt-3" />
          </CardContent>
        </Card>

        {/* Top Processes */}
        <Card>
          <CardHeader>
            <CardTitle>Top Processes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topProcesses.map((proc) => (
                <div key={proc.pid} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <div>
                    <div className="font-medium">{proc.name}</div>
                    <div className="text-sm text-muted-foreground">PID: {proc.pid}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{proc.usage.toFixed(1)}%</div>
                    <div className="text-xs text-muted-foreground">{proc.memory.toFixed(1)} MB</div>
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

export default DiskDashboard;
