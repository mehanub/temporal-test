export interface OrderWorkflowResponse {
  workflowId: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  result?: any;
  error?: string;
}