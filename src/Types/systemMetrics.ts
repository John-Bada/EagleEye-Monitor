export type SystemMetrics = {
  cpu: {
    usage: number;
    temperature: number;
    frequency: number;
    cores: number;
    threads: number;
  };
  memory: {
    usage: number;
    total: number;
    available: number;
  };
  disk: {
    usage: number;
    readSpeed: number;
    writeSpeed: number;
  };
  network: {
    usage: number;
    uploadSpeed: number;
    downloadSpeed: number;
  };
  gpu: {
    usage: number;
  };
  processes: number;
  timestamp: string;
};
