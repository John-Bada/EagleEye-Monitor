export type SystemMetrics = {
  cpu: {
    usage: number;
    temperature: number;
    frequency: number;
    cores: number;
    coreData: { core: string; usage: number; temperature: number }[];
  };
  memory: {
    usage: number;
    total: number;
    available: number;
    physical: { used: number; total: number; percentage: number };
    virtual: { used: number; total: number; percentage: number };
    cache: { used: number; total: number; percentage: number };
    swap: { used: number; total: number; percentage: number };
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
    ping: number;
    data: { up: number; down: number };
    interfaces: { name: string; status: string; speed: string; ip: string }[];
    connections: {
      protocol: string;
      remoteAddress: string;
      port: number;
      state: string;
      process: string;
    }[];
  };
  gpu: {
    usage: number;
    temperature: number;
    memoryUsed: number;
    memoryTotal: number;
    power: number;
    fanSpeed: number;
  };
  processes: number;
  topProcesses: {
    name: string;
    pid: number;
    usage: number;
    memory: number;
  }[];
  topMemoryProcesses: { name: string; memory: number; type: string }[];
  memoryDistribution: {
    applications: number;
    system: number;
    cache: number;
    free: number;
  };
  history: {
    cpu: number[];
    cpuTemperature: number[];
    cpuFrequency: number[];
    memory: number[];
    disk: number[];
    network: number[];
    networkDownload: number[];
    networkUpload: number[];
    ping: number[];
    gpu: number[];
  };
  timestamp: string;
};
