const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Хранилище: ключ = transactionId (генерируется клиентом)
const transactions = new Map();

// Списание денег
app.post('/api/payments/charge', (req, res) => {
  const { transactionId, userId, amount, orderId } = req.body;
  
  console.log(`[Payment] Charge request with ID: ${transactionId}, amount: ${amount}`);
  
  // Проверка: существует ли уже такая транзакция?
  if (transactions.has(transactionId)) {
    const existing = transactions.get(transactionId);
    console.log(`[Payment] Idempotent: returning existing transaction`);
    return res.status(200).json({
      transactionId: existing.transactionId,
      snapshot: {
        transactionId: existing.transactionId,
        amount: existing.amount,
        userId: existing.userId,
        status: existing.status
      }
    });
  }
  
  // Создаём новую транзакцию
  const transaction = {
    transactionId,
    userId,
    amount,
    orderId,
    status: 'charged',
    createdAt: new Date().toISOString()
  };
  
  transactions.set(transactionId, transaction);
  
  console.log(`[Payment] Charged: ${transactionId}, amount: ${amount}`);
  
  res.status(200).json({
    transactionId,
    snapshot: {
      transactionId,
      amount,
      userId,
      status: 'charged'
    }
  });
});

// Возврат денег
app.post('/api/payments/refund', (req, res) => {
  const { transactionId } = req.body;
  
  console.log(`[Payment] Refund: ${transactionId}`);
  
  const transaction = transactions.get(transactionId);
  
  if (!transaction) {
    return res.status(404).json({ error: 'Transaction not found' });
  }
  
  if (transaction.status === 'refunded') {
    return res.status(200).json({ message: 'Already refunded' });
  }
  
  transaction.status = 'refunded';
  transaction.refundedAt = new Date().toISOString();
  
  console.log(`[Payment] Refunded: ${transactionId}`);
  res.status(200).json({ message: 'Refunded successfully' });
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`✅ Payment Service: http://localhost:${PORT}`);
  console.log(`   POST   /api/payments/charge (client generates transactionId)`);
  console.log(`   POST   /api/payments/refund`);
});