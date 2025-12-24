import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { ResponseInterceptor } from 'src/common/interceptors/response/response.interceptor';
import { HttpExceptionFilter } from 'src/common/filters/http-exception/http-exception.filter';
import { WsAdapter } from '@nestjs/platform-ws';
import { AppModule } from 'src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalInterceptors(new ResponseInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    app.useWebSocketAdapter(new WsAdapter(app));

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/ (GET) return index.html', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Content-Type', /html/);
  });
});
