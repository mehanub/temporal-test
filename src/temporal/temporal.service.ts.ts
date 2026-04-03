import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, Connection } from '@temporalio/client';

@Injectable()
export class TemporalService implements OnModuleInit {
  private client: Client;
  private connection: Connection;
  private readonly logger = new Logger(TemporalService.name);

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    await this.connect();
  }

  private async connect() {
    const address = this.configService.get('TEMPORAL_ADDRESS', 'localhost:7233');
    
    this.connection = await Connection.connect({
      address,
    });
    
    this.client = new Client({
      connection: this.connection,
      namespace: this.configService.get('TEMPORAL_NAMESPACE', 'default'),
    });
    
    this.logger.log(`Connected to Temporal at ${address}`);
  }

  getClient(): Client {
    if (!this.client) {
      throw new Error('Temporal client not initialized');
    }
    return this.client;
  }

  async shutdown() {
    await this.connection?.close();
    this.logger.log('Temporal connection closed');
  }
}