import { Controller, Post, Get, Delete, Body, Param, UseGuards, Request, Response, HttpCode, HttpStatus, SetMetadata, Headers } from '@nestjs/common';
import type { Response as ExpressResponse } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { OAuthService } from './oauth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { OAuthCallbackDto } from './dto/oauth-callback.dto';
import { IS_PUBLIC_KEY } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private oauthService: OAuthService,
  ) {}

  private getFingerprint(req: any): string | undefined {
    const userAgent = req.headers?.['user-agent'] || '';
    const ip = req.ip || req.connection?.remoteAddress || '';
    if (!userAgent && !ip) return undefined;
    return AuthService.computeFingerprint(userAgent, ip);
  }

  private setRefreshCookie(res: ExpressResponse, token: string) {
    res.cookie('refresh-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/auth',
    });
  }

  private clearRefreshCookie(res: ExpressResponse) {
    res.clearCookie('refresh-token', { path: '/api/auth' });
  }

  @Post('register')
  @SetMetadata(IS_PUBLIC_KEY, true)
  @Throttle({ auth: { limit: 5, ttl: 3_600_000 } })
  @ApiOperation({ summary: 'Register a new user' })
  async register(@Request() req: any, @Response({ passthrough: true }) res: ExpressResponse, @Body() dto: RegisterDto) {
    const result = await this.authService.register(dto, this.getFingerprint(req));
    this.setRefreshCookie(res, result.refreshToken);
    return result;
  }

  @Post('login')
  @SetMetadata(IS_PUBLIC_KEY, true)
  @HttpCode(HttpStatus.OK)
  @Throttle({ auth: { limit: 10, ttl: 900_000 } })
  @ApiOperation({ summary: 'Login with email and password' })
  async login(@Request() req: any, @Response({ passthrough: true }) res: ExpressResponse, @Body() dto: LoginDto) {
    const result = await this.authService.login(dto, this.getFingerprint(req));
    this.setRefreshCookie(res, result.refreshToken);
    return result;
  }

  @Post('refresh')
  @SetMetadata(IS_PUBLIC_KEY, true)
  @UseGuards(AuthGuard('jwt-refresh'))
  @HttpCode(HttpStatus.OK)
  @Throttle({ auth: { limit: 30, ttl: 900_000 } })
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(@Request() req: any, @Response({ passthrough: true }) res: ExpressResponse, @Body() dto: RefreshTokenDto) {
    const oldToken = req?.cookies?.['refresh-token'] ?? dto.refreshToken;
    const result = await this.authService.refresh(req.user.id, req.user.email, req.user.role, oldToken, this.getFingerprint(req));
    this.setRefreshCookie(res, result.refreshToken);
    return result;
  }

  @Post('logout')
  @SetMetadata(IS_PUBLIC_KEY, true)
  @HttpCode(HttpStatus.OK)
  @Throttle({ auth: { limit: 10, ttl: 900_000 } })
  @ApiOperation({ summary: 'Logout and invalidate refresh token' })
  async logout(@Request() req: any, @Response({ passthrough: true }) res: ExpressResponse, @Body() dto: RefreshTokenDto) {
    this.clearRefreshCookie(res);
    const token = req?.cookies?.['refresh-token'] ?? dto.refreshToken;
    return this.authService.logout(token);
  }

  @Post('oauth/google')
  @SetMetadata(IS_PUBLIC_KEY, true)
  @HttpCode(HttpStatus.OK)
  @Throttle({ auth: { limit: 10, ttl: 900_000 } })
  @ApiOperation({ summary: 'Login or register via Google OAuth' })
  async oauthGoogle(@Request() req: any, @Body() dto: OAuthCallbackDto) {
    return this.oauthService.handleGoogleCallback(dto.code, dto.redirectUri, this.getFingerprint(req));
  }

  @Post('oauth/linkedin')
  @SetMetadata(IS_PUBLIC_KEY, true)
  @HttpCode(HttpStatus.OK)
  @Throttle({ auth: { limit: 10, ttl: 900_000 } })
  @ApiOperation({ summary: 'Login or register via LinkedIn OAuth' })
  async oauthLinkedIn(@Request() req: any, @Body() dto: OAuthCallbackDto) {
    return this.oauthService.handleLinkedInCallback(dto.code, dto.redirectUri, this.getFingerprint(req));
  }

  @Get('oauth/accounts')
  @ApiOperation({ summary: 'List linked OAuth accounts' })
  async getOAuthAccounts(@CurrentUser() user: any) {
    return this.oauthService.getLinkedAccounts(user.id);
  }

  @Post('oauth/link/:provider')
  @HttpCode(HttpStatus.OK)
  @Throttle({ auth: { limit: 10, ttl: 900_000 } })
  @ApiOperation({ summary: 'Link an OAuth provider to your account' })
  async linkOAuth(@CurrentUser() user: any, @Param('provider') provider: string, @Body() dto: OAuthCallbackDto) {
    return this.oauthService.linkProvider(user.id, provider, dto.code, dto.redirectUri);
  }

  @Delete('oauth/unlink/:provider')
  @ApiOperation({ summary: 'Unlink an OAuth provider from your account' })
  async unlinkOAuth(@CurrentUser() user: any, @Param('provider') provider: string) {
    return this.oauthService.unlinkProvider(user.id, provider);
  }
}
