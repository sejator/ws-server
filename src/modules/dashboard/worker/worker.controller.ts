import { Controller, Post, UseGuards } from '@nestjs/common';
import { WorkerService } from './worker.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller()
export class WorkerController {
  constructor(private readonly workerService: WorkerService) {}

  @Post('enable')
  enable() {
    this.workerService.enableWorker();
    return { status: 'enabled' };
  }

  @Post('disable')
  async disable() {
    await this.workerService.disableWorker();
    return { status: 'disabled' };
  }
}
