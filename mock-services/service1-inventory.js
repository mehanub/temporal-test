const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Хранилище: ключ = reservationId (генерируется клиентом)
const reservations = new Map();

// Бронирование (reservationId приходит от клиента)
app.post('/api/inventory/reserve', (req, res) => {
  const { reservationId, userId, productId, quantity, orderId } = req.body;
  
  console.log(`[Inventory] Reserve request with ID: ${reservationId}`);
  
  // Проверка: существует ли уже такая резервация?
  if (reservations.has(reservationId)) {
    const existing = reservations.get(reservationId);
    console.log(`[Inventory] Idempotent: returning existing reservation`);
    return res.status(200).json({
      reservationId: existing.reservationId,
      snapshot: {
        productId: existing.productId,
        quantity: existing.quantity,
        userId: existing.userId,
        status: existing.status
      }
    });
  }
  
  // Создаём новую резервацию
  const reservation = {
    reservationId,
    userId,
    productId,
    quantity,
    orderId,
    status: 'reserved',
    createdAt: new Date().toISOString()
  };
  
  reservations.set(reservationId, reservation);
  
  console.log(`[Inventory] Created: ${reservationId}`);
  
  res.status(201).json({
    reservationId,
    snapshot: {
      productId,
      quantity,
      userId,
      status: 'reserved'
    }
  });
});

// Отмена бронирования
app.delete('/api/inventory/reserve/:reservationId', (req, res) => {
  const { reservationId } = req.params;
  
  console.log(`[Inventory] Cancel: ${reservationId}`);
  
  const reservation = reservations.get(reservationId);
  
  if (!reservation) {
    return res.status(404).json({ error: 'Reservation not found' });
  }
  
  if (reservation.status === 'cancelled') {
    return res.status(204).send();
  }
  
  reservation.status = 'cancelled';
  reservation.cancelledAt = new Date().toISOString();
  
  console.log(`[Inventory] Cancelled: ${reservationId}`);
  res.status(204).send();
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`✅ Inventory Service: http://localhost:${PORT}`);
  console.log(`   POST   /api/inventory/reserve (client generates reservationId)`);
  console.log(`   DELETE /api/inventory/reserve/:reservationId`);
});