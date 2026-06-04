"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObservabilityService = void 0;
const common_1 = require("@nestjs/common");
let ObservabilityService = class ObservabilityService {
    counters = new Map();
    gauges = new Map();
    getMetricKey(name, labels) {
        const serializedLabels = Object.entries(labels)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => `${k}="${v}"`)
            .join(',');
        return `${name}{${serializedLabels}}`;
    }
    increment(name, labels = {}, value = 1) {
        const key = this.getMetricKey(name, labels);
        const existing = this.counters.get(key);
        if (existing) {
            existing.value += value;
        }
        else {
            this.counters.set(key, { name, labels, value });
        }
    }
    setGauge(name, labels = {}, value) {
        const key = this.getMetricKey(name, labels);
        this.gauges.set(key, { name, labels, value });
    }
    recordDuration(name, durationSeconds) {
        this.setGauge(name, {}, durationSeconds);
    }
    getMetricsAsString() {
        const lines = [];
        const counterHelpWritten = new Set();
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
        const gaugeHelpWritten = new Set();
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
};
exports.ObservabilityService = ObservabilityService;
exports.ObservabilityService = ObservabilityService = __decorate([
    (0, common_1.Injectable)()
], ObservabilityService);
//# sourceMappingURL=observability.service.js.map