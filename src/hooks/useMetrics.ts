import { useEffect, useState } from "react";
import * as signalR from "@microsoft/signalr";
import type { SystemMetrics } from "@/Types/systemMetrics";

export const useMetrics = () => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);

  useEffect(() => {
    const baseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ?? "";
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${baseUrl}/hubs/metrics`, {
        transport: signalR.HttpTransportType.WebSockets,
        skipNegotiation: true,
      })
      .withAutomaticReconnect()
      .build();

    connection.on("metrics", (data: SystemMetrics) => setMetrics(data));

    connection.onclose((err) => console.error("SignalR connection closed", err));
    connection.onreconnected(() => console.info("SignalR reconnected"));

    connection.start().catch((err) => console.error("SignalR connection error", err));

    return () => {
      connection.stop().catch(() => undefined);
    };
  }, []);

  return metrics;
};
