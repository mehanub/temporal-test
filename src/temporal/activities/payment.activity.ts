import { Context } from '@temporalio/activity';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { config } from 'dotenv';

config();

const httpService = new HttpService();

export interface ProcessPaymentInput {
  transactionId: string;  // ← генерируется клиентом
  userId: string;
  amount: number;
  orderId: string;
}

export interface ProcessPaymentOutput {
  transactionId: string;
  snapshot: {
    transactionId: string;
    amount: number;
    userId: string;
    status: string;
  };
}

export async function processPayment(input: ProcessPaymentInput): Promise<ProcessPaymentOutput> {
  const ctx = Context.current();
  const serviceUrl = process.env.SERVICE2_URL || 'http://localhost:3002';
  
  ctx.log.info('Calling Service 2: Payment Processing', { 
    transactionId: input.transactionId,
    amount: input.amount 
  });
  
  try {
    const response = await firstValueFrom(
      httpService.post(`${serviceUrl}/api/payments/charge`, input, {
        timeout: 10000,
      })
    );
    
    ctx.log.info('Payment processed successfully', { transactionId: input.transactionId });
    
    return response.data;
  } catch (error) {
    ctx.log.error('Payment processing failed', error);
    throw new Error(`Failed to process payment: ${error.message}`);
  }
}

export async function refundPayment(transactionId: string): Promise<void> {
  const ctx = Context.current();
  const serviceUrl = process.env.SERVICE2_URL || 'http://localhost:3002';
  
  ctx.log.info('Compensating: Refunding payment', { transactionId });
  
  try {
    await firstValueFrom(
      httpService.post(`${serviceUrl}/api/payments/refund`, { transactionId }, {
        timeout: 10000,
      })
    );
    ctx.log.info('Payment compensation successful');
  } catch (error) {
    if (error.response?.status === 404 || error.response?.status === 400) {
      ctx.log.warn('Transaction already refunded or not found');
      return;
    }
    ctx.log.error('Payment compensation failed', error);
    throw new Error(`Failed to refund payment: ${error.message}`);
  }
}