import { IsObject, IsString, Matches } from 'class-validator';

export class CreateEventDto {
  @IsString()
  channel: string;

  @IsString()
  @Matches(/^(?!ws:)(?!ws_internal:)[a-zA-Z0-9_]+(\.[a-zA-Z0-9_]+)*$/, {
    message:
      'event boleh satu kata atau multi kata dengan titik (.), dan tidak boleh diawali ws: atau ws_internal: (valid orders atau orders.created)',
  })
  event: string;

  @IsObject()
  data: Record<string, any>;
}
