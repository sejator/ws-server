import type { ClientApp, Prisma } from 'generated/prisma';
import type { WebSocket } from 'ws';

export type ChannelType = 'PUBLIC' | 'PRIVATE' | 'PRESENCE';

export enum ChannelPrefix {
  PUBLIC = 'public',
  PRIVATE = 'private',
  PRESENCE = 'presence',
}

export interface WSRequest {
  event: 'ws:ping' | 'ws:subscribe' | 'ws:unsubscribe';
  channel?: string;
  data?: {
    auth?: string;
    [key: string]: any;
  };
}

export interface WSResponse {
  event:
    | 'ws:pong'
    | 'ws_internal:connect_success'
    | 'ws_internal:disconnect_success'
    | 'ws_internal:subscribe_success'
    | 'ws_internal:subscribe_error'
    | 'ws_internal:unsubscribe_success'
    | 'ws_internal:auth_failed'
    | 'ws_internal:error';
  channel?: string;
  data?: Record<string, any> | null;
  message?: string;
}

export interface PublishChannel {
  channel: string;
  event: string;
  payload: Prisma.JsonValue | null;
}

export interface WsClient extends WebSocket {
  socketId?: string;
  app?: ClientApp;
  lastActivityAt?: number;
  hasSubscribed?: boolean;
}
