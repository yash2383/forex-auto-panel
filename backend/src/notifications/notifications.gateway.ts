import { WebSocketGateway, WebSocketServer, ConnectedSocket, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Inject, forwardRef } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { verifyJwt } from '../common/crypto.util';

@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
    ],
    credentials: true,
  },
  namespace: '/notifications',
  transports: ['websocket', 'polling'],
})
export class NotificationsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
  ) {}

  afterInit(server: Server) {
    // optional init logic
  }

  handleConnection(@ConnectedSocket() client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      client.join(`user-${userId}`);
    }

    // Authenticate token server-side for admin room mapping
    const token = client.handshake.auth?.token as string;
    if (token) {
      try {
        const decoded = verifyJwt(token);
        if (decoded && ['SUPER_ADMIN', 'MANAGER', 'VIEWER'].includes(decoded.role)) {
          client.join('admins');
        }
      } catch (err) {
        // Invalid or expired token
      }
    }
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    // cleanup if needed
  }
}
