import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { WorkerModule } from './worker/worker.module';
import { MetricsModule } from './metrics/metrics.module';
import { RouterModule } from '@nestjs/core';
import { ClientModule } from './client/client.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    AuthModule,
    MetricsModule,
    UsersModule,
    WorkerModule,
    RouterModule.register([
      {
        path: '/',
        children: [
          { path: 'auth', module: AuthModule },
          { path: 'metrics', module: MetricsModule },
          { path: 'clients', module: ClientModule },
          { path: 'users', module: UsersModule },
          { path: 'workers', module: WorkerModule },
        ],
      },
    ]),
  ],
  providers: [],
  exports: [],
})
export class DashboardModule {}
