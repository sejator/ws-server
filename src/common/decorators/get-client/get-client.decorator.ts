import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { ClientApp } from 'generated/prisma';

export const GetClient = createParamDecorator(
  (data: keyof ClientApp | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const client = request.client as ClientApp;
    return data ? client?.[data] : client;
  },
);
