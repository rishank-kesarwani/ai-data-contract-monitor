import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    let message = 'Internal server error';
    let error = 'Internal Server Error';

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null
    ) {
      const respObj = exceptionResponse as any;
      message = respObj.message || message;
      error = respObj.error || error;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const correlationId =
      request.correlationId ||
      (request.headers['x-correlation-id'] as string) ||
      'unknown-corr-id';

    // Log 5xx internal server errors as error with stack trace; log 4xx client errors as warn without stack trace
    if (status >= 500) {
      this.logger.error(
        `[${correlationId}] ${request.method} ${request.url} Status: ${status} - Error: ${JSON.stringify(
          message,
        )}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(
        `[${correlationId}] ${request.method} ${request.url} Status: ${status} - ${JSON.stringify(
          message,
        )}`,
      );
    }

    response.status(status).json({
      statusCode: status,
      error,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      correlationId,
    });
  }
}
