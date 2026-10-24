import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from '../decorators';

@Injectable()
export class PublicAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const xApiKey = request.headers['x-api-key'];
    const authHeader =
      request.headers['authorization'] || request.headers['Authorization'];
    const configuredServiceKey =
      this.configService.get<string>('serviceApiKey');

    // 1. Check Service-to-Service API Key
    if (xApiKey && typeof xApiKey === 'string') {
      if (
        configuredServiceKey &&
        xApiKey.trim() === configuredServiceKey.trim()
      ) {
        request.user = {
          id: 'svc-account',
          username: 'service-account',
          role: 'ADMIN',
        };
        return true;
      }
      throw new UnauthorizedException(
        'Invalid service-to-service API key provided.',
      );
    }

    // 2. Check Bearer JWT Authorization Header
    if (
      authHeader &&
      typeof authHeader === 'string' &&
      authHeader.startsWith('Bearer ')
    ) {
      const token = authHeader.substring(7).trim();
      try {
        const decoded = this.jwtService.verify(token, {
          secret: this.configService.get<string>('jwt.secret'),
        });
        request.user = decoded;
        return true;
      } catch (err: any) {
        throw new UnauthorizedException(
          `Invalid or expired Bearer token: ${err.message}`,
        );
      }
    }

    // 3. Evaluate PUBLIC_ACCESS_ENABLE feature flag
    const publicAccessEnabled =
      this.configService.get<boolean>('publicAccessEnabled');

    if (publicAccessEnabled) {
      const method = (request.method || '').toUpperCase();
      const path = (request.path || request.url || '').toLowerCase();

      // Destructive, approval, publishing, and audit inspection endpoints are strictly protected
      const isApprovalAction =
        path.includes('/approve') ||
        path.includes('/reject') ||
        path.includes('/decide');
      const isPublishAction = path.includes('/publish');
      const isAuditRoute = path.includes('/audit');
      const isMutation =
        method === 'POST' ||
        method === 'PUT' ||
        method === 'PATCH' ||
        method === 'DELETE';

      // Exception: allow demo scenario trigger/reset when public access is on for interactive evaluation
      const isDemoSandbox = path.includes('/demo');

      if (isApprovalAction || isPublishAction || isAuditRoute || (isMutation && !isDemoSandbox)) {
        throw new ForbiddenException(
          'Operator authentication required. Public access is permitted for read-only inspection; contract changes, approvals, and audit records require authenticated sign-in.',
        );
      }

      // Safe read or demo sandbox allowed with public viewer context
      request.user = {
        id: 'public-viewer',
        username: 'guest-viewer',
        role: 'PUBLIC_VIEWER',
      };
      return true;
    }

    // When public access is disabled, reject unauthenticated calls
    throw new UnauthorizedException(
      'Authentication required. Public access is disabled (PUBLIC_ACCESS_ENABLE=false). Please provide a valid Bearer token or service API key.',
    );
  }
}
