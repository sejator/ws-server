import { Injectable } from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { PrismaService } from 'src/config/prisma/prisma.service';
import { ChannelService } from 'src/modules/ws/channel/channel.service';
import { ClientApp } from 'generated/prisma';

@Injectable()
export class EventsService {
  constructor(
    private readonly channels: ChannelService,
    private readonly prisma: PrismaService,
  ) {}

  async broadcast(app: ClientApp, body: CreateEventDto) {
    const channel = await this.prisma.channel.findUnique({
      where: {
        clientAppId_name: {
          clientAppId: app.id,
          name: body.channel,
        },
      },
    });

    const delivery = await this.prisma.webhookDelivery.create({
      data: {
        channelId: channel?.id ?? null,
        event: body.event,
        payload: body.data,
        type: 'WEBSOCKET',
        status: 'PENDING',
      },
    });

    const result = await this.channels.publishToChannel({
      event: body.event,
      channel: body.channel,
      payload: body.data,
    });

    const delivered = result.delivered;

    await this.prisma.webhookDelivery.update({
      where: { id: delivery.id },
      data: {
        status: delivered ? 'SUCCESS' : 'FAILED',
        deliveredAt: delivered ? new Date() : null,
        lastError: delivered ? null : 'NO_ACTIVE_SUBSCRIBERS',
        attempts: delivered ? 1 : 1,
        nextRetry: delivered ? null : new Date(Date.now() + 30_000), // retry 30 seconds later
      },
    });

    const message = result.delivered
      ? 'Event berhasil dikirim ke subscriber yang aktif'
      : 'Tidak ada subscriber aktif pada channel ini';

    return {
      event_id: delivery.id,
      channel: body.channel,
      event: body.event,
      delivered: result.delivered,
      subscribers: result.subscribers,
      message: message,
    };
  }
}
