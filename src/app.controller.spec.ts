import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import type { Response } from 'express';
import { join } from 'path';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = module.get<AppController>(AppController);
  });

  it('should send index.html', () => {
    const sendFileMock = jest.fn();
    const res = {
      sendFile: sendFileMock,
    } as unknown as Response;

    appController.getIndex(res);

    expect(sendFileMock).toHaveBeenCalledWith(
      join(__dirname, '..', 'public', 'index.html'),
    );
  });
});
