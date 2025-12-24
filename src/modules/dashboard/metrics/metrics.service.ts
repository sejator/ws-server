import { Injectable } from '@nestjs/common';
import { RedisService } from 'src/config/redis/redis.service';

@Injectable()
export class MetricsService {
  constructor(private readonly redis: RedisService) {}

  private key(name: string) {
    return `metrics:${name}`;
  }

  async socketConnected(socketId?: string) {
    if (!socketId) return;

    await this.redis.sadd(this.key('active_sockets'), socketId);
  }

  async socketDisconnected(socketId?: string) {
    if (!socketId) return;

    await this.redis.srem(this.key('active_sockets'), socketId);
  }

  async channelSubscribed(channel?: string) {
    if (!channel) return;

    const client = this.redis;

    await Promise.all([
      client.incr(this.key('total_subscriptions')),
      client.sadd(this.key('active_channels'), channel),
    ]);
  }

  async channelUnsubscribed(channel?: string) {
    if (!channel) return;

    await this.redis.srem(this.key('active_channels'), channel);
  }

  async eventPublished(delivered: number) {
    const client = this.redis;

    await Promise.all([
      client.incr(this.key('total_publishes')),
      client.incrBy(this.key('delivered_events'), delivered),
    ]);
  }

  async snapshot() {
    const client = this.redis;

    const [
      activeSockets,
      activeChannels,
      totalSubscriptions,
      totalPublishes,
      deliveredEvents,
    ] = await Promise.all([
      client.scard(this.key('active_sockets')),
      client.scard(this.key('active_channels')),
      client.get(this.key('total_subscriptions')),
      client.get(this.key('total_publishes')),
      client.get(this.key('delivered_events')),
    ]);

    return {
      activeSockets,
      activeChannels,
      totalSubscriptions: Number(totalSubscriptions ?? 0),
      totalPublishes: Number(totalPublishes ?? 0),
      deliveredEvents: Number(deliveredEvents ?? 0),
    };
  }
}
