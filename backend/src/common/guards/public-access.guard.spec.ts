import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { PublicAccessGuard } from './public-access.guard';

describe('PublicAccessGuard', () => {
  let guard: PublicAccessGuard;
  let reflector: Reflector;
  let configService: ConfigService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PublicAccessGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'serviceApiKey') return 'test-service-key';
              if (key === 'publicAccessEnabled') return false;
              if (key === 'jwt.secret') return 'test-jwt-secret';
              return null;
            }),
          },
        },
        {
          provide: JwtService,
          useValue: {
            verify: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<PublicAccessGuard>(PublicAccessGuard);
    reflector = module.get<Reflector>(Reflector);
    configService = module.get<ConfigService>(ConfigService);
    jwtService = module.get<JwtService>(JwtService);
  });

  const createMockContext = (req: any): ExecutionContext => ({
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => req,
    }),
  } as any);

  it('should allow access if @Public() metadata is set', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const context = createMockContext({ headers: {} });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access with valid x-api-key', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const req: any = { headers: { 'x-api-key': 'test-service-key' } };
    const context = createMockContext(req);

    expect(guard.canActivate(context)).toBe(true);
    expect(req.user).toBeDefined();
    expect(req.user.role).toBe('ADMIN');
  });

  it('should reject access with invalid x-api-key', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const req: any = { headers: { 'x-api-key': 'wrong-key' } };
    const context = createMockContext(req);

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should allow access with valid Bearer token', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    jest.spyOn(jwtService, 'verify').mockReturnValue({ id: 'usr-1', username: 'admin', role: 'ADMIN' });
    const req: any = { headers: { authorization: 'Bearer valid-jwt-token' } };
    const context = createMockContext(req);

    expect(guard.canActivate(context)).toBe(true);
    expect(req.user.username).toBe('admin');
  });

  it('should reject unauthenticated request when publicAccessEnabled is false', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    jest.spyOn(configService, 'get').mockImplementation((key: string) => {
      if (key === 'publicAccessEnabled') return false;
      return null;
    });
    const req: any = { headers: {}, method: 'GET', url: '/api/v1/contracts' };
    const context = createMockContext(req);

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should allow read-only inspection when publicAccessEnabled is true', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    jest.spyOn(configService, 'get').mockImplementation((key: string) => {
      if (key === 'publicAccessEnabled') return true;
      return null;
    });
    const req: any = { headers: {}, method: 'GET', url: '/api/v1/contracts' };
    const context = createMockContext(req);

    expect(guard.canActivate(context)).toBe(true);
    expect(req.user.role).toBe('PUBLIC_VIEWER');
  });

  it('should forbid approval actions in public unauthenticated mode even if publicAccessEnabled is true', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    jest.spyOn(configService, 'get').mockImplementation((key: string) => {
      if (key === 'publicAccessEnabled') return true;
      return null;
    });
    const req: any = { headers: {}, method: 'POST', url: '/api/v1/approvals/appr-123/decide' };
    const context = createMockContext(req);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
