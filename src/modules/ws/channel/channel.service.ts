import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from 'src/config/prisma/prisma.service';
import { ClientApp } from 'generated/prisma';
import {
  ChannelPrefix,
  WSRequest,
  WSResponse,
  PublishChannel,
  WsClient,
} from 'src/types/websocket.type';
import { WebSocket } from 'ws';
import { verifyWebSocketSignature } from 'src/common/utils/signature.util';
import { MetricsService } from 'src/modules/dashboard/metrics/metrics.service';
import { RedisService } from 'src/config/redis/redis.service';

@Injectable()
export class ChannelService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ChannelService.name);

  private readonly CHECK_INTERVAL = 30_000; // 30 seconds
  private readonly ACTIVITY_TIMEOUT = 60_000; // 60 seconds
  private channels = new Map<string, Set<WsClient>>();
  private socketChannels = new Map<string, Set<string>>();
  readonly sockets = new Map<string, WsClient>();
  private watchdogTimer: NodeJS.Timeout;
  private readonly SOCKET_TTL = 120; // seconds
  private readonly REPLAY_TTL = 30; // seconds

  constructor(
    private readonly prisma: PrismaService,
    private readonly metrics: MetricsService,
    private readonly redis: RedisService,
  ) {}

  onModuleInit() {
    this.startSocketWatchdog();
  }

  onModuleDestroy() {
    if (this.watchdogTimer) clearInterval(this.watchdogTimer);

    for (const ws of this.sockets.values()) {
      try {
        ws.close(1012, 'SERVER_SHUTDOWN');
      } catch {
        // ignore
      }
    }
  }

  async registerSocket(ws: WsClient) {
    if (!ws.socketId || !ws.app) return;

    const socketKey = `socket:${ws.socketId}`;

    const ok = await this.redis.set(
      socketKey,
      ws.app.id.toString(),
      this.SOCKET_TTL,
    );

    if (!ok) {
      ws.close(4009, 'DUPLICATE_SOCKET');
      return;
    }

    await this.redis.set(
      `activity:${ws.socketId}`,
      Date.now().toString(),
      this.SOCKET_TTL,
    );

    this.sockets.set(ws.socketId, ws);
    this.socketChannels.delete(ws.socketId);

    ws.send(
      JSON.stringify({
        event: 'ws_internal:connect_success',
        data: {
          socket_id: ws.socketId,
          activity_timeout: this.ACTIVITY_TIMEOUT / 1000,
        },
      } as WSResponse),
    );

    await this.metrics.socketConnected(ws.socketId);

    this.logger.debug({ socketId: ws.socketId, message: 'Socket registered' });
  }

  async handleMessage(ws: WsClient, raw: Buffer) {
    let msg: WSRequest;

    try {
      msg = JSON.parse(raw.toString()) as WSRequest;

      ws.lastActivityAt = Date.now();
      await this.redis.set(
        `activity:${ws.socketId}`,
        ws.lastActivityAt.toString(),
        this.SOCKET_TTL,
      );
    } catch {
      ws.send(
        JSON.stringify({
          event: 'ws_internal:error',
          message: 'INVALID_JSON',
        } as WSResponse),
      );
      return;
    }

    try {
      const event = msg.event;
      switch (event) {
        case 'ws:ping':
          if (ws.hasSubscribed) {
            ws.send(
              JSON.stringify({
                event: 'ws:pong',
              } as WSResponse),
            );
          }
          break;

        case 'ws:subscribe':
          return this.subscribe(ws, msg.channel!, msg.data?.auth);

        case 'ws:unsubscribe':
          return this.unsubscribe(ws, msg.channel!);

        default:
          ws.send(
            JSON.stringify({
              event: 'ws_internal:error',
              message: 'UNKNOWN_EVENT',
            } as WSResponse),
          );
      }
    } catch (err) {
      this.logger.error(err);
      ws.send(
        JSON.stringify({
          event: 'ws_internal:error',
          message: 'INTERNAL_ERROR',
        } as WSResponse),
      );
    }

    // Logging
    this.logger.debug({
      socketId: ws.socketId,
      event: msg.event,
      channel: msg.channel,
    });
  }

  async subscribe(ws: WsClient, channel: string, auth?: string) {
    if (!ws.socketId || !ws.app) return;

    const parsed = this.parseChannel(channel);

    if (parsed.type === ChannelPrefix.PRIVATE) {
      if (!auth) {
        ws.send(
          JSON.stringify({
            event: 'ws_internal:auth_failed',
            channel,
            message: 'AUTH_REQUIRED',
          } as WSResponse),
        );
        return;
      }

      const valid = verifyWebSocketSignature(
        ws.socketId,
        channel,
        auth,
        ws.app.secret,
      );

      if (!valid) {
        ws.send(
          JSON.stringify({
            event: 'ws_internal:auth_failed',
            channel,
            message: 'INVALID_SIGNATURE',
          } as WSResponse),
        );
        return;
      }

      const replayKey = `replay:${ws.socketId}:${channel}`;
      if (await this.redis.get(replayKey)) {
        ws.send(
          JSON.stringify({
            event: 'ws_internal:auth_failed',
            channel,
            message: 'REPLAY_ATTACK',
          } as WSResponse),
        );
        return;
      }

      await this.redis.set(replayKey, '1', this.REPLAY_TTL);
    }

    if (parsed.type === ChannelPrefix.PRESENCE) {
      await this.redis.incr(`presence:${channel}`);
    }

    this.channels.set(channel, this.channels.get(channel) ?? new Set());
    const subscribers = this.channels.get(channel)!;

    if (subscribers.has(ws)) {
      ws.send(
        JSON.stringify({
          event: 'ws_internal:subscribe_error',
          channel,
          message: 'ALREADY_SUBSCRIBED',
        } as WSResponse),
      );
      return;
    }

    // Add subscriber
    subscribers.add(ws);
    // Track channels per socket
    this.socketChannels.set(
      ws.socketId,
      this.socketChannels.get(ws.socketId) ?? new Set(),
    );
    this.socketChannels.get(ws.socketId)!.add(channel);

    ws.hasSubscribed = true;
    ws.send(
      JSON.stringify({
        event: 'ws_internal:subscribe_success',
        channel,
        data: {
          socket_id: ws.socketId,
          timestamp: Date.now(),
        },
      } as WSResponse),
    );

    // update metrics
    await this.metrics.channelSubscribed(channel);
  }

  async unsubscribe(ws: WsClient, channel: string) {
    if (!ws.socketId) return;

    const socketId = ws.socketId;

    if (channel.startsWith('presence-')) {
      await this.redis.decr(`presence:${channel}`);
    }

    this.channels.get(channel)?.delete(ws);
    this.socketChannels.get(socketId)?.delete(channel);

    if (!this.socketChannels.get(ws.socketId)?.size) {
      ws.hasSubscribed = false;
    }

    ws.send(
      JSON.stringify({
        event: 'ws_internal:unsubscribe_success',
        channel,
        data: {
          socket_id: socketId,
          timestamp: Date.now(),
        },
      } as WSResponse),
    );

    await this.metrics.channelUnsubscribed(channel);
  }

  async disconnect(ws: WsClient) {
    if (!ws.socketId) return;

    const socketId = ws.socketId;
    const channels = this.socketChannels.get(socketId);

    if (channels) {
      for (const channel of channels) {
        this.channels.get(channel)?.delete(ws);
        if (channel.startsWith('presence-')) {
          await this.redis.decr(`presence:${channel}`);
        }
      }
    }

    await this.redis.del(`socket:${socketId}`);
    await this.redis.del(`activity:${socketId}`);

    this.sockets.delete(socketId);
    this.socketChannels.delete(socketId);

    ws.hasSubscribed = false;
    ws.removeAllListeners();

    await this.metrics.socketDisconnected(ws.socketId);

    this.logger.debug({ socketId, message: 'Socket disconnected' });
  }

  authenticateApp(key: string): Promise<ClientApp | null> {
    return this.prisma.clientApp.findUnique({ where: { key } });
  }

  parseChannel(channel: string) {
    if (channel.startsWith('private-')) {
      return { type: ChannelPrefix.PRIVATE };
    }

    if (channel.startsWith('presence-')) {
      return { type: ChannelPrefix.PRESENCE };
    }

    return { type: ChannelPrefix.PUBLIC };
  }

  async publishToChannel(params: PublishChannel): Promise<{
    delivered: boolean;
    subscribers: number;
  }> {
    const clients = this.channels.get(params.channel);
    if (!clients || clients.size === 0) {
      return { delivered: false, subscribers: 0 };
    }

    const payload = JSON.stringify({
      event: params.event,
      channel: params.channel,
      data: params.payload,
    } as WSResponse);

    let delivered = 0;

    for (const ws of clients) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
        delivered++;
      }
    }

    // update metrics
    await this.metrics.eventPublished(delivered);

    // logging
    this.logger.debug({
      channel: params.channel,
      event: params.event,
      delivered,
      totalSubscribers: clients.size,
    });

    return {
      delivered: delivered > 0,
      subscribers: clients.size,
    };
  }

  listActiveSockets(): Map<string, WsClient> {
    return this.sockets;
  }

  listActiveChannels(): Map<string, Set<WsClient>> {
    return this.channels;
  }

  listSubscribers(channel: string): string[] {
    const clients = this.channels.get(channel);
    if (!clients) return [];
    return Array.from(clients).map((ws) => ws.socketId!);
  }

  private startSocketWatchdog() {
    this.watchdogTimer = setInterval(() => {
      void this.runSocketWatchdog();
    }, this.CHECK_INTERVAL);
  }

  private async runSocketWatchdog(): Promise<void> {
    const now = Date.now();

    for (const ws of this.sockets.values()) {
      if (!ws.socketId || !ws.hasSubscribed) continue;

      try {
        const last = await this.redis.get(`activity:${ws.socketId}`);

        if (!last || now - Number(last) > this.ACTIVITY_TIMEOUT) {
          ws.close(4000, 'ACTIVITY_TIMEOUT');
        }
      } catch (err) {
        this.logger.error('Watchdog error', err);
      }
    }
  }
}
