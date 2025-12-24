import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from 'src/config/prisma/prisma.service';
import { verifyHmacSignature } from 'src/common/utils/signature.util';
import { RedisService } from 'src/config/redis/redis.service';
import { normalizeTimestamp } from 'src/common/utils/app.util';

@Injectable()
export class SignatureGuard implements CanActivate {
  private readonly MAX_TIME_DIFF = 300;

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const appKey = request.params.key;
    const signature = request.headers['x-signature'] as string;
    const rawTimestamp = request.headers['x-timestamp'] as string;

    if (!signature || !rawTimestamp) {
      throw new UnauthorizedException('UNAUTHORIZED');
    }

    const timestamp = normalizeTimestamp(rawTimestamp);

    if (!Number.isFinite(timestamp)) {
      throw new BadRequestException('INVALID_REQUEST');
    }

    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > this.MAX_TIME_DIFF) {
      throw new ForbiddenException('REQUEST_EXPIRED');
    }

    const replayKey = `signature:${appKey}:${signature}`;
    const locked = await this.redis.set(replayKey, '1', this.MAX_TIME_DIFF);

    if (!locked) {
      throw new ConflictException('REPLAY_DETECTED');
    }

    const client = await this.prisma.clientApp.findUnique({
      where: { key: appKey },
    });

    if (!client || !client.isActive) {
      throw new UnauthorizedException('UNAUTHORIZED');
    }

    const isValid = verifyHmacSignature(
      client.key,
      String(timestamp),
      signature,
      client.secret,
    );

    if (!isValid) {
      throw new UnauthorizedException('UNAUTHORIZED');
    }

    request['client'] = client;
    return true;
  }
}
