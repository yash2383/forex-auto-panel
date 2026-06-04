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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const notifications_service_1 = require("./notifications.service");
const crypto_util_1 = require("../common/crypto.util");
let NotificationsGateway = class NotificationsGateway {
    notificationsService;
    server;
    constructor(notificationsService) {
        this.notificationsService = notificationsService;
    }
    afterInit(server) {
    }
    handleConnection(client) {
        const userId = client.handshake.query.userId;
        if (userId) {
            client.join(`user-${userId}`);
        }
        const token = client.handshake.auth?.token;
        if (token) {
            try {
                const decoded = (0, crypto_util_1.verifyJwt)(token);
                if (decoded &&
                    ['SUPER_ADMIN', 'MANAGER', 'VIEWER'].includes(decoded.role)) {
                    client.join('admins');
                }
            }
            catch (err) {
            }
        }
    }
    handleDisconnect(client) {
    }
};
exports.NotificationsGateway = NotificationsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], NotificationsGateway.prototype, "server", void 0);
__decorate([
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], NotificationsGateway.prototype, "handleConnection", null);
__decorate([
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], NotificationsGateway.prototype, "handleDisconnect", null);
exports.NotificationsGateway = NotificationsGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: ['http://localhost:3000', 'http://localhost:3001'],
            credentials: true,
        },
        namespace: '/notifications',
        transports: ['websocket', 'polling'],
    }),
    __param(0, (0, common_1.Inject)((0, common_1.forwardRef)(() => notifications_service_1.NotificationsService))),
    __metadata("design:paramtypes", [notifications_service_1.NotificationsService])
], NotificationsGateway);
//# sourceMappingURL=notifications.gateway.js.map