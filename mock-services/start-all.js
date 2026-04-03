const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting mock services...\n');

const services = [
  { name: 'Inventory', file: 'service1-inventory.js', port: 3001 },
  { name: 'Payment',   file: 'service2-payment.js', port: 3002 },
  { name: 'Order',     file: 'service3-order.js', port: 3003 }
];

services.forEach(service => {
  spawn('node', [path.join(__dirname, service.file)], {
    stdio: 'inherit',
    env: { ...process.env, PORT: service.port }
  });
});

console.log('\n✅ All services started!');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📍 Inventory: http://localhost:3001');
console.log('📍 Payment:   http://localhost:3002');
console.log('📍 Order:     http://localhost:3003');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('\n💡 Test:');
console.log('   Success: productId = "PROD-001"');
console.log('   Failure: productId = "FAIL_PRODUCT" (triggers Saga)');
console.log('\n⚠️  Press Ctrl+C to stop\n');