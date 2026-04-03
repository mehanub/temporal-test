import { IsString, IsUUID, IsInt, Min, IsPositive } from 'class-validator';

export class CreateOrderDto {
  @IsUUID()
  userId: string;

  @IsString()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsPositive()
  price: number;
}

export class OrderResponseDto {
  workflowId: string;
  message: string;
  statusUrl: string;
}

export class OrderStatusDto {
  workflowId: string;
  status: string;
  result?: any;
  error?: string;
  startTime?: Date;
  closeTime?: Date;
}