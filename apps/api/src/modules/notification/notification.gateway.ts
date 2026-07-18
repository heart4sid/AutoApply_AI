// ============================================================
// AutoApply AI — WebSocket Gateway (Production Hardened)
// ============================================================

import {
  WebSocketGateway, WebSocketServer, OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? process.env.FRONTEND_URL
      : [process.env.FRONTEND_URL || 'http://localhost:3000', 'http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  },
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger('WebSocketGateway');

  @WebSocketServer()
  server: Server;

  private userSockets: Map<string, string[]> = new Map();

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      let token = '';
      const authHeader = client.handshake.headers.authorization;
      if (authHeader) {
        token = authHeader.split(' ')[1];
      } else if (client.handshake.auth?.token) {
        token = client.handshake.auth.token;
      }

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.config.get('JWT_SECRET'),
      });

      const userId = payload.sub;
      client.data.userId = userId;

      const sockets = this.userSockets.get(userId) || [];
      sockets.push(client.id);
      this.userSockets.set(userId, sockets);

      client.join(`user:${userId}`);
      this.logger.log(`Client connected: ${client.id} (user: ${userId})`);
    } catch (e: any) {
      this.logger.warn(`Connection auth failed: ${e.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      const sockets = this.userSockets.get(userId) || [];
      const updated = sockets.filter(sid => sid !== client.id);
      if (updated.length > 0) {
        this.userSockets.set(userId, updated);
      } else {
        this.userSockets.delete(userId);
      }
    }
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  emitToUser(userId: string, event: string, payload: any) {
    this.server.to(`user:${userId}`).emit(event, {
      type: event,
      payload,
      timestamp: new Date().toISOString(),
    });
  }
}
