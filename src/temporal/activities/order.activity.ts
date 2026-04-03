import { Context } from '@temporalio/activity';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { config } from 'dotenv';

config();

const httpService = new HttpService();

export interface ConfirmOrderInput {
  orderId: string;  // ← генерируется клиентом
  userId: string;
  productId: string;
  quantity: number;
  transactionId: string;
  reservationId: string;
}

export interface ConfirmOrderOutput {
  orderId: string;
  status: string;
  createdAt: string;
}

export async function confirmOrder(input: ConfirmOrderInput): Promise<ConfirmOrderOutput> {
  const ctx = Context.current();
  const serviceUrl = process.env.SERVICE3_URL || 'http://localhost:3003';
  
  ctx.log.info('Calling Service 3: Order Confirmation', { 
    orderId: input.orderId,
    productId: input.productId 
  });
  
  // Симуляция отказа для демонстрации Saga
  if (input.productId === 'FAIL_PRODUCT') {
    ctx.log.warn('Simulated product failure');
    throw new Error('Service 3 failed: Product out of stock');
  }
  
  try {
    const response = await firstValueFrom(
      httpService.post(`${serviceUrl}/api/orders/confirm`, input, {
        timeout: 10000,
      })
    );
    
    if (response.status !== 200) {
      throw new Error(`Service 3 returned ${response.status}`);
    }
    
    ctx.log.info('Order confirmed successfully', { orderId: input.orderId });
    
    return response.data;
  } catch (error) {
    ctx.log.error('Order confirmation failed', error);
    throw new Error(`Failed to confirm order: ${error.message}`);
  }
}

export async function cancelOrder(orderId: string): Promise<void> {
  const ctx = Context.current();
  const serviceUrl = process.env.SERVICE3_URL || 'http://localhost:3003';
  
  ctx.log.info('Compensating: Cancelling order', { orderId });
  
  try {
    await firstValueFrom(
      httpService.delete(`${serviceUrl}/api/orders/${orderId}`, {
        timeout: 10000,
      })
    );
    ctx.log.info('Order cancellation successful');
  } catch (error) {
    if (error.response?.status === 404) {
      ctx.log.warn('Order already cancelled');
      return;
    }
    ctx.log.error('Order cancellation failed', error);
    throw error;
  }
}