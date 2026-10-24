import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserSession } from '../../common/types';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async login(username: string, pass: string): Promise<{ access_token: string; user: UserSession }> {
    const adminPassword = this.configService.get<string>('operatorAdminPassword');

    // Operator Admin check
    if (username === 'admin' && pass === adminPassword) {
      const user: UserSession = {
        id: 'usr_admin',
        username: 'admin',
        role: 'ADMIN',
        team: 'Data Platform Core',
      };
      const token = this.jwtService.sign(user, {
        secret: this.configService.get<string>('jwt.secret'),
        expiresIn: '24h',
      });
      return { access_token: token, user };
    }

    // Demo Data Owner
    if (username === 'owner' && (pass === 'owner123' || pass === adminPassword)) {
      const user: UserSession = {
        id: 'usr_owner',
        username: 'owner',
        role: 'DATA_OWNER',
        team: 'Order Platform',
      };
      const token = this.jwtService.sign(user, {
        secret: this.configService.get<string>('jwt.secret'),
        expiresIn: '24h',
      });
      return { access_token: token, user };
    }

    // Demo Consumer Lead
    if (username === 'consumer' && (pass === 'consumer123' || pass === adminPassword)) {
      const user: UserSession = {
        id: 'usr_consumer',
        username: 'consumer',
        role: 'CONSUMER_LEAD',
        team: 'Analytics BI',
      };
      const token = this.jwtService.sign(user, {
        secret: this.configService.get<string>('jwt.secret'),
        expiresIn: '24h',
      });
      return { access_token: token, user };
    }

    throw new UnauthorizedException('Invalid credentials provided.');
  }

  getPublicAccessStatus() {
    const publicAccessEnabled = this.configService.get<boolean>('publicAccessEnabled');
    return {
      publicAccessEnabled,
      mode: publicAccessEnabled ? 'PUBLIC_READ_ONLY' : 'AUTHENTICATION_REQUIRED',
      description: publicAccessEnabled
        ? 'Public read-only inspection is enabled. Mutation and approval actions require operator sign-in.'
        : 'All endpoints require Bearer JWT or service API key.',
    };
  }
}
