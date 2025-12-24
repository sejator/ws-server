import { Test, TestingModule } from '@nestjs/testing';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { PrismaService } from 'src/config/prisma/prisma.service';
import { ChannelService } from 'src/modules/ws/channel/channel.service';
import { MetricsService } from 'src/modules/dashboard/metrics/metrics.service';
import { RedisService } from 'src/config/redis/redis.service';

describe('EventsController', () => {
  let controller: EventsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [
        EventsService,
        PrismaService,
        ChannelService,
        MetricsService,
        RedisService,
      ],
    }).compile();

    controller = module.get<EventsController>(EventsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
