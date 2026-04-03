const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Хранилище: ключ = orderId (генерируется клиентом)
const orders = new Map();

// Подтверждение заказа
app.post('/api/orders/confirm', (req, res) => {
  const { orderId, userId, productId, quantity, transactionId, reservationId } = req.body;
  
  console.log(`[Order] Confirm request with ID: ${orderId}, product: ${productId}`);
  
  // Симуляция отказа для тестирования Saga
  if (productId === 'FAIL_PRODUCT') {
    console.log(`[Order] ❌ FAILURE: product out of stock`);
    return res.status(503).json({ error: 'Product out of stock (simulated)' });
  }
  
  // Проверка: существует ли уже такой заказ?
  if (orders.has(orderId)) {
    const existing = orders.get(orderId);
    console.log(`[Order] Idempotent: returning existing order`);
    return res.status(200).json({
      orderId: existing.orderId,
      status: existing.status,
      createdAt: existing.confirmedAt
    });
  }
  
  // Создаём новый заказ
  const order = {
    orderId,
    userId,
    productId,
    quantity,
    transactionId,
    reservationId,
    status: 'confirmed',
    confirmedAt: new Date().toISOString()
  };
  
  orders.set(orderId, order);
  
  console.log(`[Order] ✅ Confirmed: ${orderId}`);
  
  res.status(200).json({
    orderId,
    status: 'confirmed',
    createdAt: order.confirmedAt
  });
});

// Отмена заказа
app.delete('/api/orders/:orderId', (req, res) => {
  const { orderId } = req.params;
  
  console.log(`[Order] Cancel: ${orderId}`);
  
  const order = orders.get(orderId);
  
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  if (order.status === 'cancelled') {
    return res.status(204).send();
  }
  
  order.status = 'cancelled';
  order.cancelledAt = new Date().toISOString();
  
  console.log(`[Order] Cancelled: ${orderId}`);
  res.status(204).send();
});

const PORT = 3003;
app.listen(PORT, () => {
  console.log(`✅ Order Service: http://localhost:${PORT}`);
  console.log(`   POST   /api/orders/confirm (client generates orderId)`);
  console.log(`   DELETE /api/orders/:orderId`);
});