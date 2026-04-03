import { Injectable, Logger } from '@nestjs/common';
import { TemporalService } from '../temporal/temporal.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(private readonly temporalService: TemporalService) {}

  async createOrder(orderData: CreateOrderDto): Promise<{ workflowId: string }> {
    // Генерируем ID заказа (можно передать свой)
    const workflowId = `order_${orderData.userId}_${Date.now()}`;
    
    const client = this.temporalService.getClient();
    
    this.logger.log(`Starting order workflow: ${workflowId}`, orderData);
    
    // Запускаем workflow, ID уже сгенерирован
    await client.workflow.start('orderWorkflow', {
      taskQueue: 'order-processing',
      workflowId,  // ← передаём наш ID
      args: [{
        ...orderData,
        orderId: workflowId,  // ← опционально, можно переопределить
      }],
      workflowExecutionTimeout: '5 minutes',
    });
    
    this.logger.log(`Order workflow started: ${workflowId}`);
    
    return { workflowId };
  }

  async getOrderStatus(workflowId: string): Promise<any> {
    const client = this.temporalService.getClient();
    const handle = client.workflow.getHandle(workflowId);
    
    try {
      const description = await handle.describe();
      const result = description.status?.name === 'COMPLETED' 
        ? await handle.result() 
        : null;
      
      return {
        workflowId,
        status: description.status.name,
        result,
        startTime: description.execution?.startTime,
        closeTime: description.execution?.closeTime,
      };
    } catch (error) {
      this.logger.error(`Failed to get workflow status: ${error.message}`);
      throw new NotFoundException(`Workflow ${workflowId} not found`);
    }
  }
}