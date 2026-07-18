// ============================================================
// AutoApply AI — Local In-Memory Queue Provider
// ============================================================

import { Provider } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bullmq';
import { ApplierProcessor } from './queue.processor';

export const LocalQueueProvider: Provider = {
  provide: getQueueToken('applier'),
  useFactory: (processor: ApplierProcessor) => {
    return {
      add: async (name: string, data: any, options?: any) => {
        console.log(`[LocalQueue] Queued job '${name}' for recordId: ${data.recordId}`);
        
        // Execute asynchronously in-memory to simulate background workers
        setTimeout(async () => {
          try {
            await processor.process({
              data,
              id: `local-job-${Date.now()}`,
              name,
            } as any);
          } catch (error) {
            console.error('[LocalQueue] Error running job in memory:', error);
          }
        }, options?.delay || 1000);

        return { id: `local-job-${Date.now()}` };
      },
    };
  },
  inject: [ApplierProcessor],
};
