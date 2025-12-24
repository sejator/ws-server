import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { ChannelModule } from 'src/modules/ws/channel/channel.module';

@Module({
  imports: [ChannelModule],
  controllers: [EventsController],
  providers: [EventsService],
})
export class EventsModule {}
