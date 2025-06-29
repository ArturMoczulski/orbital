// Type declarations for external modules

// Bull
declare module "bull" {
  export interface Job<T = any> {
    id: string;
    data: T;
    name: string;
    opts: any;
    progress: number;
    delay: number;
    timestamp: number;
    stacktrace: string[];
    returnvalue: any;
    failedReason: string;
    attemptsMade: number;
    finishedOn?: number;
    processedOn?: number;

    update(data: T): Promise<void>;
    remove(): Promise<void>;
    retry(): Promise<void>;
    discard(): Promise<void>;
    finished(): Promise<any>;
    moveToCompleted(returnValue: any, ignoreLock?: boolean): Promise<any>;
    moveToFailed(errorInfo: Error, ignoreLock?: boolean): Promise<any>;
  }

  export interface Queue<T = any> {
    name: string;
    add(name: string, data: T, opts?: any): Promise<Job<T>>;
    addBulk(
      jobs: Array<{ name: string; data: T; opts?: any }>
    ): Promise<Job<T>[]>;
    process(concurrency: number, handler: (job: Job<T>) => Promise<any>): void;
    process(
      name: string,
      concurrency: number,
      handler: (job: Job<T>) => Promise<any>
    ): void;
    getJob(jobId: string): Promise<Job<T> | null>;
    getJobs(
      types: string[],
      start?: number,
      end?: number,
      asc?: boolean
    ): Promise<Job<T>[]>;
    getWaiting(start?: number, end?: number): Promise<Job<T>[]>;
    getActive(start?: number, end?: number): Promise<Job<T>[]>;
    getDelayed(start?: number, end?: number): Promise<Job<T>[]>;
    getCompleted(start?: number, end?: number): Promise<Job<T>[]>;
    getFailed(start?: number, end?: number): Promise<Job<T>[]>;
    getWaitingCount(): Promise<number>;
    getActiveCount(): Promise<number>;
    getCompletedCount(): Promise<number>;
    getFailedCount(): Promise<number>;
    getDelayedCount(): Promise<number>;
    clean(grace: number, type: string, limit?: number): Promise<number>;
    empty(): Promise<void>;
    pause(): Promise<void>;
    resume(): Promise<void>;
    close(): Promise<void>;
    getWorkers(): Promise<any[]>;
  }
}

// Prometheus
declare module "prom-client" {
  export interface LabelValues {
    [key: string]: string | number;
  }

  export class Counter {
    constructor(config: any);
    inc(labels?: LabelValues, value?: number): void;
    reset(): void;
  }

  export class Gauge {
    constructor(config: any);
    set(labels: LabelValues, value: number): void;
    inc(labels?: LabelValues, value?: number): void;
    dec(labels?: LabelValues, value?: number): void;
    reset(): void;
  }
}

// NestJS Schedule
declare module "@nestjs/schedule" {
  export class SchedulerRegistry {
    addInterval(name: string, interval: ReturnType<typeof setInterval>): void;
    getIntervals(): string[];
    getInterval(name: string): ReturnType<typeof setInterval>;
    deleteInterval(name: string): void;
    doesExist(name: string): boolean;
  }
}
