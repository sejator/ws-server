import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ClientModule } from './modules/dashboard/client/client.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ApiModule } from './modules/api/api.module';
import { PrismaModule } from './config/prisma/prisma.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { WebsocketModule } from './modules/ws/websocket/websocket.module';
import { ChannelModule } from './modules/ws/channel/channel.module';
import { RedisModule } from './config/redis/redis.module';

@Module({
  imports: [
    WebsocketModule,
    ClientModule,
    ChannelModule,
    PrismaModule,
    ApiModule,
    DashboardModule,
    ScheduleModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),
    RedisModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
