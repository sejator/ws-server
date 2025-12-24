import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ClientService } from './client.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { GetUser } from 'src/common/decorators/get-user/get-user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller()
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Post()
  create(
    @GetUser('sub') userId: number,
    @Body() createClientDto: CreateClientDto,
  ) {
    return this.clientService.create(userId, createClientDto);
  }

  @Get()
  findAll(@GetUser('sub') userId: number) {
    return this.clientService.findAll(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clientService.findOne(+id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateClientDto: UpdateClientDto) {
    return this.clientService.update(+id, updateClientDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.clientService.remove(+id);
  }
}
