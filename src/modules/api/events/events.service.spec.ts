import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service';
import { PrismaService } from 'src/config/prisma/prisma.service';
import { ChannelService } from 'src/modules/ws/channel/channel.service';
import { MetricsService } from 'src/modules/dashboard/metrics/metrics.service';
import { RedisService } from 'src/config/redis/redis.service';

describe('EventsService', () => {
  let service: EventsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        PrismaService,
        ChannelService,
        MetricsService,
        RedisService,
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
