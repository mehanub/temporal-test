import { Worker } from '@temporalio/worker';
import { Connection } from '@temporalio/client';
import * as activities from './activities';
import * as dotenv from 'dotenv';

dotenv.config();

async function runWorker() {
  const address = process.env.TEMPORAL_ADDRESS || 'localhost:7233';
  const namespace = process.env.TEMPORAL_NAMESPACE || 'default';
  
  const connection = await Connection.connect({
    address,
  });
  
  const worker = await Worker.create({
    connection,
    namespace,
    workflowsPath: require.resolve('./workflows/order.workflow'),
    activities,
    taskQueue: 'order-processing',
    maxConcurrentWorkflowTaskExecutions: 10,
    maxConcurrentActivityTaskExecutions: 20,
  });
  
  console.log(`Worker started on queue 'order-processing'`);
  console.log(`Connected to Temporal at ${address}`);
  
  await worker.run();
}

runWorker().catch((err) => {
  console.error('Worker failed to start:', err);
  process.exit(1);
});