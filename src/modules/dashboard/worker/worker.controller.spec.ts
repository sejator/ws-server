import { Test, TestingModule } from '@nestjs/testing';
import { WorkerController } from './worker.controller';
import { WorkerService } from './worker.service';
import { ChannelService } from 'src/modules/ws/channel/channel.service';
import { SchedulerRegistry } from '@nestjs/schedule';
import { PrismaService } from 'src/config/prisma/prisma.service';
import { MetricsService } from '../metrics/metrics.service';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from 'src/config/redis/redis.service';

describe('WorkerController', () => {
  let controller: WorkerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkerController],
      providers: [
        WorkerService,
        ChannelService,
        SchedulerRegistry,
        PrismaService,
        MetricsService,
        JwtService,
        RedisService,
      ],
    }).compile();

    controller = module.get<WorkerController>(WorkerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
