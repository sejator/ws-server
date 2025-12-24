import { Test, TestingModule } from '@nestjs/testing';
import { WorkerService } from './worker.service';
import { PrismaService } from 'src/config/prisma/prisma.service';
import { ChannelService } from 'src/modules/ws/channel/channel.service';
import { SchedulerRegistry } from '@nestjs/schedule';
import { MetricsService } from '../metrics/metrics.service';
import { RedisService } from 'src/config/redis/redis.service';

describe('WorkerService', () => {
  let service: WorkerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkerService,
        PrismaService,
        ChannelService,
        SchedulerRegistry,
        MetricsService,
        RedisService,
      ],
    }).compile();

    service = module.get<WorkerService>(WorkerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
