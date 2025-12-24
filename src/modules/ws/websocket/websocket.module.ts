import { Module } from '@nestjs/common';
import { WebsocketGateway } from './websocket.gateway';
import { ChannelModule } from '../channel/channel.module';

@Module({
  imports: [ChannelModule],
  providers: [WebsocketGateway],
})
export class WebsocketModule {}
