import { Context } from '@temporalio/activity';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { config } from 'dotenv';

config();

const httpService = new HttpService();

export interface ReserveInventoryInput {
  reservationId: string;  // ← генерируется клиентом
  userId: string;
  productId: string;
  quantity: number;
  orderId: string;
}

export interface ReserveInventoryOutput {
  reservationId: string;
  snapshot: {
    productId: string;
    quantity: number;
    userId: string;
    status: string;
  };
}

export async function reserveInventory(input: ReserveInventoryInput): Promise<ReserveInventoryOutput> {
  const ctx = Context.current();
  const serviceUrl = process.env.SERVICE1_URL || 'http://localhost:3001';
  
  ctx.log.info('Calling Service 1: Inventory Reservation', { 
    reservationId: input.reservationId,
    productId: input.productId 
  });
  
  try {
    const response = await firstValueFrom(
      httpService.post(`${serviceUrl}/api/inventory/reserve`, input, {
        timeout: 10000,
      })
    );
    
    if (response.status !== 200 && response.status !== 201) {
      throw new Error(`Service 1 returned ${response.status}`);
    }
    
    ctx.log.info('Inventory reserved successfully', { reservationId: input.reservationId });
    
    return response.data;
  } catch (error) {
    ctx.log.error('Inventory reservation failed', error);
    throw new Error(`Failed to reserve inventory: ${error.message}`);
  }
}

export async function cancelReservation(reservationId: string): Promise<void> {
  const ctx = Context.current();
  const serviceUrl = process.env.SERVICE1_URL || 'http://localhost:3001';
  
  ctx.log.info('Compensating: Cancelling inventory reservation', { reservationId });
  
  try {
    await firstValueFrom(
      httpService.delete(`${serviceUrl}/api/inventory/reserve/${reservationId}`, {
        timeout: 10000,
      })
    );
    ctx.log.info('Inventory compensation successful');
  } catch (error) {
    if (error.response?.status === 404) {
      ctx.log.warn('Reservation already cancelled or not found');
      return;
    }
    ctx.log.error('Inventory compensation failed', error);
    throw new Error(`Failed to cancel reservation: ${error.message}`);
  }
}