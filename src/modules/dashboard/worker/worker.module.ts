import { Module } from '@nestjs/common';
import { WorkerService } from './worker.service';
import { WorkerController } from './worker.controller';
import { ChannelModule } from 'src/modules/ws/channel/channel.module';

@Module({
  imports: [ChannelModule],
  providers: [WorkerService],
  controllers: [WorkerController],
})
export class WorkerModule {}
