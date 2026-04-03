import { Module, OnModuleInit, OnModuleDestroy, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TemporalService } from './temporal.service';
import { WorkerService } from './worker.service';

@Module({
  providers: [TemporalService, WorkerService],
  exports: [TemporalService, WorkerService],
})
export class TemporalModule implements OnModuleInit, OnModuleDestroy {
  constructor(
    private readonly temporalService: TemporalService,
    private readonly workerService: WorkerService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    // Запускаем Worker в отдельном потоке, чтобы не блокировать основной
    if (this.configService.get('RUN_WORKER') !== 'false') {
      setTimeout(async () => {
        await this.workerService.startWorker();
      }, 5000);
    }
  }

  async onModuleDestroy() {
    await this.temporalService.shutdown();
    await this.workerService.shutdown();
  }
}