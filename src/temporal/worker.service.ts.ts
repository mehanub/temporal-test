import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Worker } from '@temporalio/worker';
import { Connection } from '@temporalio/client';
import * as activities from './activities';

@Injectable()
export class WorkerService implements OnModuleDestroy {
  private worker: Worker;
  private connection: Connection;
  private readonly logger = new Logger(WorkerService.name);

  constructor(private readonly configService: ConfigService) {}

  async startWorker(): Promise<void> {
    try {
      const address = this.configService.get('TEMPORAL_ADDRESS', 'localhost:7233');
      
      this.connection = await Connection.connect({
        address,
      });
      
      this.worker = await Worker.create({
        connection: this.connection,
        namespace: this.configService.get('TEMPORAL_NAMESPACE', 'default'),
        taskQueue: 'order-processing',
        workflowsPath: require.resolve('./workflows/order.workflow'),
        activities,
      });
      
      this.logger.log('Temporal worker started, listening for tasks...');
      await this.worker.run();
    } catch (error) {
      this.logger.error(`Failed to start worker: ${error.message}`);
      throw error;
    }
  }

  async shutdown() {
    await this.worker?.shutdown();
    await this.connection?.close();
    this.logger.log('Worker shutdown complete');
  }
}