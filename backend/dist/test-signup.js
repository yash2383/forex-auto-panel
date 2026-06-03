"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./src/app.module");
const auth_service_1 = require("./src/auth/auth.service");
async function main() {
    console.log('Booting NestJS application context...');
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const authService = app.get(auth_service_1.AuthService);
    console.log('Testing signup method with harsh@nexus.com...');
    try {
        const result = await authService.signup('harsh@nexus.com', undefined, undefined, 'ewfw', 'wd', 'alpha-traders', undefined);
        console.log('Signup Result:', result);
    }
    catch (error) {
        console.error('SIGNUP ERROR STACK TRACE:');
        console.error(error);
    }
    finally {
        await app.close();
    }
}
main().catch(console.error);
//# sourceMappingURL=test-signup.js.map