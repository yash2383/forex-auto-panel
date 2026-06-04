export declare class ObservabilityService {
    private counters;
    private gauges;
    private getMetricKey;
    increment(name: string, labels?: Record<string, string>, value?: number): void;
    setGauge(name: string, labels: Record<string, string> | undefined, value: number): void;
    recordDuration(name: string, durationSeconds: number): void;
    getMetricsAsString(): string;
}
