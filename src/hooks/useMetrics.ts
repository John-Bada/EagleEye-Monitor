import { useEffect, useState } from "react";
import * as signalR from "@microsoft/signalr";
import type { SystemMetrics } from "@/Types/systemMetrics";

export const useMetrics = () => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);

  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl("https://localhost:7102/hubs/metrics")
      .withAutomaticReconnect()
      .build();

    connection.on("metrics", (data: SystemMetrics) => {
      setMetrics(data);
    });

    connection.start().catch(err => console.error("SignalR Connection Error", err));

    return () => {
      connection.stop();
    };
  }, []);

  return metrics;
};
