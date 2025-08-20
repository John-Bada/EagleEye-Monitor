// src/types/systemMetrics.ts

export interface SystemMetrics {
    cpu: {
        usage: number;
        temperature: number;
        cores: number;
        threads: number;
        perCoreUsage: number[];
    };
    memory: {
        usage: number;
        available: number;
        total: number;
    };
    disk: {
        usage: number;
        readSpeed: number;
        writeSpeed: number;
        iops: number;
    };
    network: {
        uploadSpeed: number;
        downloadSpeed: number;
        totalSent: number;
        totalReceived: number;
    };
    gpu: {
        usage: number;
        temperature: number;
        memoryUsed: number;
        memoryTotal: number;
    };
    timestamp: string;
}
