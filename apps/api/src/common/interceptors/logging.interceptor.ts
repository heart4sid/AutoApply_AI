// ============================================================
// AutoApply AI — Request Logging Interceptor
// Logs method, URL, status code, and response time.
// ============================================================

import {
  Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const elapsed = Date.now() - startTime;
          const statusCode = context.switchToHttp().getResponse().statusCode;
          this.logger.log(`${method} ${url} ${statusCode} ${elapsed}ms`);
        },
        error: (err) => {
          const elapsed = Date.now() - startTime;
          const status = err?.status || 500;
          this.logger.warn(`${method} ${url} ${status} ${elapsed}ms — ${err?.message}`);
        },
      }),
    );
  }
}
