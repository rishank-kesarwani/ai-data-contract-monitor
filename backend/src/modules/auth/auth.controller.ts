import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CurrentUser, Public } from '../../common/decorators';
import { UserSession } from '../../common/types';

import { IsNotEmpty, IsString } from 'class-validator';

class LoginDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Log in as operator, data owner, or consumer lead' })
  async login(@Body() body: LoginDto) {
    return this.authService.login(body.username, body.password);
  }

  @Public()
  @Get('status')
  @ApiOperation({ summary: 'Get current PUBLIC_ACCESS_ENABLE feature flag status' })
  getPublicStatus() {
    return this.authService.getPublicAccessStatus();
  }

  @Get('me')
  @ApiOperation({ summary: 'Get profile of current authenticated user or public session' })
  getProfile(@CurrentUser() user: UserSession) {
    return {
      authenticated: user?.role !== 'PUBLIC_VIEWER',
      user: user || { id: 'public-viewer', role: 'PUBLIC_VIEWER', username: 'Guest' },
    };
  }
}
