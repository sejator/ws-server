import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server } from 'ws';
import { parse } from 'url';
import { strRandom } from 'src/common/utils/hash.util';
import { WSResponse, WsClient } from 'src/types/websocket.type';
import { IncomingMessage } from 'http';
import { ChannelService } from '../channel/channel.service';

@WebSocketGateway({
  transport: 'ws',
  path: '/ws',
  cors: true,
})
export class WebsocketGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(private readonly channelService: ChannelService) {}

  async handleConnection(ws: WsClient, req: IncomingMessage) {
    if (!req.url) {
      ws.close(4000, 'INVALID_REQUEST');
      return;
    }
    const { query } = parse(req.url, true);

    if (!query.key) {
      ws.send(
        JSON.stringify({
          event: 'ws_internal:auth_failed',
          message: 'APP_KEY_REQUIRED',
        } as WSResponse),
      );
      ws.close(4001, 'APP_KEY_REQUIRED');
      return;
    }

    const app = await this.channelService.authenticateApp(query.key as string);
    if (!app) {
      ws.send(
        JSON.stringify({
          event: 'ws_internal:auth_failed',
          message: 'INVALID_APP_KEY',
        } as WSResponse),
      );
      ws.close(4003, 'INVALID_APP_KEY');
      return;
    }

    ws.app = app;
    ws.socketId = strRandom(20);
    ws.lastActivityAt = Date.now();

    ws.on('message', (msg: Buffer) => {
      void this.channelService.handleMessage(ws, msg);
    });

    ws.on('close', () => void this.channelService.disconnect(ws));
    ws.on('error', () => void this.channelService.disconnect(ws));

    // Daftarkan socket ke channel service, setelah semua validasi OK
    void this.channelService.registerSocket(ws);
  }
}
