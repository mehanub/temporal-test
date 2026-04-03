import { Controller, Post, Body, Get, Param, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto, OrderResponseDto } from './dto/create-order.dto';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async createOrder(@Body() orderData: CreateOrderDto): Promise<OrderResponseDto> {
    const { workflowId } = await this.orderService.createOrder(orderData);
    
    return {
      workflowId,
      message: 'Order processing started',
      statusUrl: `/api/orders/${workflowId}/status`,
    };
  }

  @Get(':workflowId/status')
  async getOrderStatus(@Param('workflowId') workflowId: string) {
    return this.orderService.getOrderStatus(workflowId);
  }

  @Delete(':workflowId')
  @HttpCode(HttpStatus.ACCEPTED)
  async cancelOrder(@Param('workflowId') workflowId: string) {
    await this.orderService.cancelOrder(workflowId);
    return { message: 'Order cancellation requested', workflowId };
  }
}