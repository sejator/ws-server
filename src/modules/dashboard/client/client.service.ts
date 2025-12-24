import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { PrismaService } from 'src/config/prisma/prisma.service';
import { generateClientSecret } from 'src/common/utils/hash.util';

@Injectable()
export class ClientService {
  constructor(private prisma: PrismaService) {}

  create(userId: number, createClientDto: CreateClientDto) {
    const { key, secret } = generateClientSecret();

    return this.prisma.clientApp.create({
      data: {
        ...createClientDto,
        userId,
        key,
        secret,
      },
    });
  }

  findAll(userId: number) {
    return this.prisma.clientApp.findMany({
      where: { userId },
    });
  }

  async findOne(id: number) {
    const client = await this.prisma.clientApp.findUnique({
      where: { id },
    });
    if (!client) {
      throw new NotFoundException('Client not found');
    }
    return client;
  }

  async update(id: number, updateClientDto: UpdateClientDto) {
    const client = await this.prisma.clientApp.findUnique({
      where: { id },
    });
    if (!client) {
      throw new NotFoundException('Client not found');
    }
    return this.prisma.clientApp.update({
      where: { id: client.id },
      data: updateClientDto,
    });
  }

  async remove(id: number) {
    const client = await this.prisma.clientApp.findUnique({
      where: { id },
    });
    if (!client) {
      throw new NotFoundException('Client not found');
    }
    await this.prisma.clientApp.delete({
      where: { id: client.id },
    });
  }
}
