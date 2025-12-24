import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;
  private readonly logger = new Logger(RedisService.name);
  private readonly prefix: string;

  constructor() {
    this.prefix = process.env.REDIS_PREFIX || 'websocket';
  }

  onModuleInit() {
    this.client = new Redis({
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT),
      password: process.env.REDIS_PASSWORD || undefined,
      db: Number(process.env.REDIS_DB) || 0,
    });

    this.client.on('connect', () => {
      this.logger.log('Redis connected');
    });

    this.client.on('error', (err) => {
      this.logger.error('Redis error', err);
    });
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  private withPrefix(key: string): string {
    if (!this.prefix) return key;
    return `${this.prefix}:${key}`;
  }

  getClient(): Redis {
    return this.client;
  }

  async get(key: string) {
    return this.client.get(this.withPrefix(key));
  }

  async set(key: string, value: string, ttl?: number) {
    const redisKey = this.withPrefix(key);

    if (ttl) {
      return await this.client.set(redisKey, value, 'EX', ttl);
    } else {
      return await this.client.set(redisKey, value);
    }
  }

  async del(key: string) {
    await this.client.del(this.withPrefix(key));
  }

  async incr(key: string) {
    return this.client.incr(this.withPrefix(key));
  }

  async incrBy(key: string, value: number) {
    return this.client.incrby(this.withPrefix(key), value);
  }

  async exists(key: string) {
    return this.client.exists(this.withPrefix(key));
  }

  async sadd(key: string, member: string) {
    return this.client.sadd(this.withPrefix(key), member);
  }

  async srem(key: string, member: string) {
    return this.client.srem(this.withPrefix(key), member);
  }

  async scard(key: string) {
    return this.client.scard(this.withPrefix(key));
  }

  async decr(key: string) {
    return this.client.decr(this.withPrefix(key));
  }
}
