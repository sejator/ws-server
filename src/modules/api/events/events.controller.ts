import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { SignatureGuard } from 'src/common/guards/signature/signature.guard';
import type { ClientApp } from 'generated/prisma';
import { GetClient } from 'src/common/decorators/get-client/get-client.decorator';

@UseGuards(SignatureGuard)
@Controller()
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post(':key')
  async broadcast(
    @GetClient() client: ClientApp,
    @Body() body: CreateEventDto,
  ) {
    return await this.eventsService.broadcast(client, body);
  }
}
