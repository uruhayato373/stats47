declare module "cloudflare:workers" {
  export interface WorkerExecutionContext {
    waitUntil(promise: Promise<unknown>): void;
    passThroughOnException(): void;
    readonly exports: Record<string, unknown>;
  }

  export abstract class WorkerEntrypoint<Env = unknown> {
    protected readonly ctx: WorkerExecutionContext;
    protected readonly env: Env;
    abstract fetch(request: Request): Response | Promise<Response>;
  }
}
