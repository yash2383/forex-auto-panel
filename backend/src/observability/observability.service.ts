import { Injectable } from '@nestjs/common';

interface MetricEntry {
  name: string;
  labels: Record<string, string>;
  value: number;
}

@Injectable()
export class ObservabilityService {
  private counters = new Map<string, MetricEntry>();
  private gauges = new Map<string, MetricEntry>();

  private getMetricKey(name: string, labels: Record<string, string>): string {
    const serializedLabels = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    return `${name}{${serializedLabels}}`;
  }

  increment(name: string, labels: Record<string, string> = {}, value = 1) {
    const key = this.getMetricKey(name, labels);
    const existing = this.counters.get(key);
    if (existing) {
      existing.value += value;
    } else {
      this.counters.set(key, { name, labels, value });
    }
  }

  setGauge(name: string, labels: Record<string, string> = {}, value: number) {
    const key = this.getMetricKey(name, labels);
    this.gauges.set(key, { name, labels, value });
  }

  recordDuration(name: string, durationSeconds: number) {
    this.setGauge(name, {}, durationSeconds);
  }

  getMetricsAsString(): string {
    const lines: string[] = [];

    // Group counters by name to output HELP and TYPE once per metric name
    const counterHelpWritten = new Set<string>();
    for (const [_, entry] of this.counters) {
      if (!counterHelpWritten.has(entry.name)) {
        lines.push(`# HELP ${entry.name} Total count of ${entry.name.replace(/_/g, ' ')}`);
        lines.push(`# TYPE ${entry.name} counter`);
        counterHelpWritten.add(entry.name);
      }
      const labelStr = Object.keys(entry.labels).length > 0
        ? `{${Object.entries(entry.labels).map(([k, v]) => `${k}="${v}"`).join(',')}}`
        : '';
      lines.push(`${entry.name}${labelStr} ${entry.value}`);
    }

    // Group gauges by name to output HELP and TYPE once per metric name
    const gaugeHelpWritten = new Set<string>();
    for (const [_, entry] of this.gauges) {
      if (!gaugeHelpWritten.has(entry.name)) {
        lines.push(`# HELP ${entry.name} Value of ${entry.name.replace(/_/g, ' ')}`);
        lines.push(`# TYPE ${entry.name} gauge`);
        gaugeHelpWritten.add(entry.name);
      }
      const labelStr = Object.keys(entry.labels).length > 0
        ? `{${Object.entries(entry.labels).map(([k, v]) => `${k}="${v}"`).join(',')}}`
        : '';
      lines.push(`${entry.name}${labelStr} ${entry.value}`);
    }

    return lines.join('\n') + '\n';
  }
}
