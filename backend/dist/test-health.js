"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./src/app.module");
const notifications_service_1 = require("./src/notifications/notifications.service");
async function main() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const service = app.get(notifications_service_1.NotificationsService);
    const health = await service.getQueueHealth();
    console.log('--- QUEUE HEALTH ---');
    console.log(JSON.stringify(health, null, 2));
    await app.close();
}
main().catch(e => console.error(e));
//# sourceMappingURL=test-health.js.map