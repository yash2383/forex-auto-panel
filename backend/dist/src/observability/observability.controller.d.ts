import { ObservabilityService } from './observability.service';
import { NotificationsService } from '../notifications/notifications.service';
export declare class ObservabilityController {
    private readonly observabilityService;
    private readonly notificationsService;
    constructor(observabilityService: ObservabilityService, notificationsService: NotificationsService);
    getMetrics(): Promise<string>;
}
