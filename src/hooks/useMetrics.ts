import { useEffect, useState } from "react";
import * as signalR from "@microsoft/signalr";
import type { SystemMetrics } from "@/Types/systemMetrics";

export const useMetrics = () => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);

  useEffect(() => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "";
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${baseUrl}/hubs/metrics`)
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
