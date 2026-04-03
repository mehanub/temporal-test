import { proxyActivities } from '@temporalio/workflow';
import type * as inventoryActivities from '../activities/inventory.activity';
import type * as paymentActivities from '../activities/payment.activity';
import type * as orderActivities from '../activities/order.activity';

type CompensationFunction = () => Promise<void>;

export interface OrderWorkflowInput {
  userId: string;
  productId: string;
  quantity: number;
  price: number;
  orderId?: string;  // опционально, может быть сгенерирован
}

export interface OrderWorkflowOutput {
  success: boolean;
  orderId: string;
  totalAmount: number;
  transactionId: string;
  reservationId: string;
  confirmedAt?: string;
}

const {
  reserveInventory,
  cancelReservation,
} = proxyActivities<typeof inventoryActivities>({
  startToCloseTimeout: '30 seconds',
  retry: {
    maximumAttempts: 3,
    initialInterval: '1 second',
    backoffCoefficient: 2,
  },
});

const {
  processPayment,
  refundPayment,
} = proxyActivities<typeof paymentActivities>({
  startToCloseTimeout: '30 seconds',
  retry: {
    maximumAttempts: 3,
    initialInterval: '1 second',
    backoffCoefficient: 2,
  },
});

const {
  confirmOrder,
  cancelOrder,
} = proxyActivities<typeof orderActivities>({
  startToCloseTimeout: '30 seconds',
  retry: {
    maximumAttempts: 2,
    initialInterval: '1 second',
  },
});

export async function orderWorkflow(input: OrderWorkflowInput): Promise<OrderWorkflowOutput> {
  // ГЕНЕРАЦИЯ ID НА КЛИЕНТЕ (в workflow)
  const workflowId = input.orderId || `order_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const reservationId = `res_${workflowId}`;
  const transactionId = `txn_${workflowId}`;
  
  console.log(`[Workflow ${workflowId}] Generated IDs:`, {
    orderId: workflowId,
    reservationId,
    transactionId
  });
  
  const compensations: CompensationFunction[] = [];
  
  try {
    // ШАГ 1: Бронирование инвентаря
    compensations.push(async () => {
      console.log(`[Workflow ${workflowId}] Compensating: cancelling reservation ${reservationId}`);
      await cancelReservation(reservationId);
    });
    
    await reserveInventory({
      reservationId,  // ← сгенерирован в workflow
      userId: input.userId,
      productId: input.productId,
      quantity: input.quantity,
      orderId: workflowId,
    });
    
    // ШАГ 2: Обработка платежа
    compensations.push(async () => {
      console.log(`[Workflow ${workflowId}] Compensating: refunding payment ${transactionId}`);
      await refundPayment(transactionId);
    });
    
    await processPayment({
      transactionId,  // ← сгенерирован в workflow
      userId: input.userId,
      amount: input.price * input.quantity,
      orderId: workflowId,
    });
    
    // ШАГ 3: Подтверждение заказа
    const orderResult = await confirmOrder({
      orderId: workflowId,  // ← сгенерирован в workflow
      userId: input.userId,
      productId: input.productId,
      quantity: input.quantity,
      transactionId,
      reservationId,
    });
    
    console.log(`[Workflow ${workflowId}] Completed successfully`);
    
    return {
      success: true,
      orderId: workflowId,
      totalAmount: input.price * input.quantity,
      transactionId,
      reservationId,
      confirmedAt: orderResult.createdAt,
    };
    
  } catch (error) {
    console.error(`[Workflow ${workflowId}] Failed: ${error.message}, starting compensation...`);
    
    // Выполняем компенсации в обратном порядке
    for (let i = compensations.length - 1; i >= 0; i--) {
      try {
        await compensations[i]();
      } catch (compError) {
        console.error(`[Workflow ${workflowId}] Compensation ${i} failed:`, compError);
      }
    }
    
    throw error;
  }
}