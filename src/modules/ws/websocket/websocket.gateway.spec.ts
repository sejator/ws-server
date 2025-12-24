import { Test, TestingModule } from '@nestjs/testing';
import { WebsocketGateway } from './websocket.gateway';
import { ChannelService } from '../channel/channel.service';
import { PrismaService } from 'src/config/prisma/prisma.service';
import { MetricsService } from 'src/modules/dashboard/metrics/metrics.service';
import { RedisService } from 'src/config/redis/redis.service';

describe('WebsocketGateway', () => {
  let gateway: WebsocketGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebsocketGateway,
        ChannelService,
        PrismaService,
        MetricsService,
        RedisService,
      ],
    }).compile();

    gateway = module.get<WebsocketGateway>(WebsocketGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
