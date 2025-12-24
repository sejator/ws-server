import { Injectable } from '@nestjs/common';
import { CronJob } from 'cron';
import { SchedulerRegistry } from '@nestjs/schedule';
import type { WebhookDelivery } from 'generated/prisma';
import { PrismaService } from 'src/config/prisma/prisma.service';
import { ChannelService } from 'src/modules/ws/channel/channel.service';

@Injectable()
export class WorkerService {
  private readonly jobName = 'retryFailedWebsocketsJob';
  private workerEnabled = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly channels: ChannelService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  enableWorker() {
    this.workerEnabled = true;
    if (this.schedulerRegistry.doesExist('cron', this.jobName)) return;

    // Run every 30 seconds
    const job = new CronJob('*/30 * * * * *', async () => {
      if (!this.workerEnabled) return;
      await this.retryFailedWebsockets();
    });

    this.schedulerRegistry.addCronJob(this.jobName, job);
    job.start();
  }

  async disableWorker() {
    this.workerEnabled = false;

    if (!this.schedulerRegistry.doesExist('cron', this.jobName)) return;

    const job = this.schedulerRegistry.getCronJob(this.jobName);
    await job.stop();
    this.schedulerRegistry.deleteCronJob(this.jobName);
  }

  async retryFailedWebsockets() {
    const deliveries = await this.prisma.webhookDelivery.findMany({
      where: {
        type: 'WEBSOCKET',
        status: 'FAILED',
        attempts: { lt: 3 },
        nextRetry: { lte: new Date() },
      },
      include: { channel: true },
      take: 50,
    });

    for (const delivery of deliveries) {
      try {
        if (!delivery.channel) continue;

        const result = await this.channels.publishToChannel({
          event: delivery.event,
          channel: delivery.channel?.name,
          payload: delivery.payload,
        });

        if (result.delivered) {
          await this.prisma.webhookDelivery.update({
            where: { id: delivery.id },
            data: {
              status: 'SUCCESS',
              deliveredAt: new Date(),
              lastError: null,
            },
          });
        } else {
          await this.handleFailure(delivery, 'NO_ACTIVE_SUBSCRIBERS');
        }
      } catch (err) {
        const error = err instanceof Error ? err.message : 'UNKNOWN_ERROR';
        await this.handleFailure(delivery, error);
      }
    }
  }

  private async handleFailure(delivery: WebhookDelivery, error: string) {
    const attempts = delivery.attempts + 1;
    await this.prisma.webhookDelivery.update({
      where: { id: delivery.id },
      data: {
        attempts,
        status: attempts >= 3 ? 'DEAD' : 'FAILED',
        lastError: error,
        nextRetry:
          attempts >= 3 ? null : new Date(Date.now() + 60_000 * attempts),
      },
    });
  }
}
