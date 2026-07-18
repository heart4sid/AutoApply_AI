// ============================================================
// AutoApply AI — WebSocket Gateway (Socket.IO)
// ============================================================

import {
  WebSocketGateway, WebSocketServer, OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets: Map<string, string[]> = new Map(); // userId -> socketIds[]

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

      // Map sockets to userId
      const sockets = this.userSockets.get(userId) || [];
      sockets.push(client.id);
      this.userSockets.set(userId, sockets);

      // Join user specific room
      client.join(`user:${userId}`);
      console.log(`[WS] Client connected: ${client.id} (user: ${userId})`);
    } catch (e) {
      console.error('[WS] Connection authorization failed:', e.message);
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
    console.log(`[WS] Client disconnected: ${client.id}`);
  }

  // ── Emit Real-time Event to User ──
  emitToUser(userId: string, event: string, payload: any) {
    this.server.to(`user:${userId}`).emit(event, {
      type: event,
      payload,
      timestamp: new Date().toISOString(),
    });
  }
}
