import { Module } from '@nestjs/common';
import { EventsModule } from './events/events.module';
import { RouterModule } from '@nestjs/core';

@Module({
  imports: [
    EventsModule,
    RouterModule.register([
      {
        path: 'api',
        children: [{ path: 'events', module: EventsModule }],
      },
    ]),
  ],
  providers: [],
  exports: [],
})
export class ApiModule {}
