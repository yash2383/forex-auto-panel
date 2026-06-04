"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObservabilityController = void 0;
const common_1 = require("@nestjs/common");
const observability_service_1 = require("./observability.service");
const notifications_service_1 = require("../notifications/notifications.service");
let ObservabilityController = class ObservabilityController {
    observabilityService;
    notificationsService;
    constructor(observabilityService, notificationsService) {
        this.observabilityService = observabilityService;
        this.notificationsService = notificationsService;
    }
    async getMetrics() {
        try {
            const health = await this.notificationsService.getQueueHealth();
            this.observabilityService.setGauge('redis_connected', {}, health.redisConnected ? 1 : 0);
            const queueNames = ['push', 'email', 'socket', 'sms', 'dlq'];
            for (const qName of queueNames) {
                const queueMetrics = health[qName];
                if (queueMetrics) {
                    this.observabilityService.setGauge('notification_queue_depth', { queue: qName, type: 'waiting' }, queueMetrics.waiting);
                    this.observabilityService.setGauge('notification_queue_depth', { queue: qName, type: 'active' }, queueMetrics.active);
                    this.observabilityService.setGauge('notification_queue_depth', { queue: qName, type: 'failed' }, queueMetrics.failed);
                }
            }
        }
        catch (err) {
            this.observabilityService.setGauge('redis_connected', {}, 0);
        }
        return this.observabilityService.getMetricsAsString();
    }
};
exports.ObservabilityController = ObservabilityController;
__decorate([
    (0, common_1.Get)('metrics'),
    (0, common_1.Header)('Content-Type', 'text/plain; version=0.0.4; charset=utf-8'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ObservabilityController.prototype, "getMetrics", null);
exports.ObservabilityController = ObservabilityController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [observability_service_1.ObservabilityService,
        notifications_service_1.NotificationsService])
], ObservabilityController);
//# sourceMappingURL=observability.controller.js.map