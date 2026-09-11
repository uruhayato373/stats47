declare module "cloudflare:workers" {
  export interface WorkerExecutionContext {
    waitUntil(promise: Promise<unknown>): void;
    passThroughOnException(): void;
    readonly exports: Record<string, unknown>;
    readonly cache?: {
      purge(options: { tags: string[] } | { purgeEverything: true }): Promise<{
        success: boolean;
        errors: Array<{ code: number; message: string }>;
      }>;
    };
  }

  export abstract class WorkerEntrypoint<Env = unknown> {
    protected readonly ctx: WorkerExecutionContext;
    protected readonly env: Env;
    abstract fetch(request: Request): Response | Promise<Response>;
  }
}
