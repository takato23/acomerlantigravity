/**
 * Offline Manager
 * Handles queuing operations when offline
 */

import { OfflineQueue, QueuedOperation } from './types';
import { logger } from '@/services/logger';

export class OfflineManager {
  private internalQueue: OfflineQueue = {
    operations: [],
    retryCount: new Map(),
  };
  private maxRetries = 3;
  private storageKey = 'kcc_offline_queue';

  constructor() {
    this.loadQueue();
  }

  async queue(operation: Omit<QueuedOperation, 'id' | 'timestamp' | 'retries'>): Promise<void> {
    const queuedOp: QueuedOperation = {
      ...operation,
      id: this.generateId(),
      timestamp: new Date(),
      retries: 0,
    };

    this.internalQueue.operations.push(queuedOp);
    this.saveQueue();
  }

  public async remove(id: string): Promise<void> {
    this.internalQueue.operations = this.internalQueue.operations.filter(op => op.id !== id);
    this.internalQueue.retryCount.delete(id);
    this.saveQueue();
  }

  public async incrementRetry(id: string): Promise<boolean> {
    const retries = (this.internalQueue.retryCount.get(id) || 0) + 1;
    this.internalQueue.retryCount.set(id, retries);

    const operation = this.internalQueue.operations.find(op => op.id === id);
    if (operation) {
      operation.retries = retries;
    }

    this.saveQueue();

    // Return false if max retries exceeded
    return retries < this.maxRetries;
  }

  public getQueue(): OfflineQueue {
    return {
      operations: [...this.internalQueue.operations],
      retryCount: new Map(this.internalQueue.retryCount),
    };
  }

  public getQueueSize(): number {
    return this.internalQueue.operations.length;
  }

  public clearQueue(): void {
    this.internalQueue = {
      operations: [],
      retryCount: new Map(),
    };
    this.saveQueue();
  }

  private loadQueue(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.internalQueue.operations = parsed.operations.map((op: any) => ({
          ...op,
          timestamp: new Date(op.timestamp),
        }));
        this.internalQueue.retryCount = new Map(parsed.retryCount);
      }
    } catch (error: unknown) {
      logger.error('Failed to load offline queue:', 'OfflineManager', error);
    }
  }

  private saveQueue(): void {
    if (typeof window === 'undefined') return;

    try {
      const toStore = {
        operations: this.internalQueue.operations,
        retryCount: Array.from(this.internalQueue.retryCount.entries()),
      };
      localStorage.setItem(this.storageKey, JSON.stringify(toStore));
    } catch (error: unknown) {
      logger.error('Failed to save offline queue:', 'OfflineManager', error);
    }
  }

  private generateId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}