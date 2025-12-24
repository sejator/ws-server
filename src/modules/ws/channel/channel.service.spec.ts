import { Test, TestingModule } from '@nestjs/testing';
import { ChannelService } from './channel.service';
import { PrismaService } from 'src/config/prisma/prisma.service';
import { MetricsService } from 'src/modules/dashboard/metrics/metrics.service';
import { RedisService } from 'src/config/redis/redis.service';

describe('ChannelService', () => {
  let service: ChannelService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChannelService, PrismaService, MetricsService, RedisService],
    }).compile();

    service = module.get<ChannelService>(ChannelService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
