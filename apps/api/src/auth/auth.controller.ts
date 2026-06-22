import { Controller, Post, Get, Delete, Body, Param, UseGuards, Request, HttpCode, HttpStatus, SetMetadata } from '@nestjs/common';
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

  @Post('register')
  @SetMetadata(IS_PUBLIC_KEY, true)
  @Throttle({ auth: { limit: 5, ttl: 3_600_000 } })
  @ApiOperation({ summary: 'Register a new user' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @SetMetadata(IS_PUBLIC_KEY, true)
  @HttpCode(HttpStatus.OK)
  @Throttle({ auth: { limit: 10, ttl: 900_000 } })
  @ApiOperation({ summary: 'Login with email and password' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @SetMetadata(IS_PUBLIC_KEY, true)
  @UseGuards(AuthGuard('jwt-refresh'))
  @HttpCode(HttpStatus.OK)
  @Throttle({ auth: { limit: 30, ttl: 900_000 } })
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(@Request() req: any, @Body() dto: RefreshTokenDto) {
    return this.authService.refresh(req.user.id, req.user.email, req.user.role, dto.refreshToken);
  }

  @Post('logout')
  @SetMetadata(IS_PUBLIC_KEY, true)
  @HttpCode(HttpStatus.OK)
  @Throttle({ auth: { limit: 10, ttl: 900_000 } })
  @ApiOperation({ summary: 'Logout and invalidate refresh token' })
  async logout(@Body() dto: RefreshTokenDto) {
    return this.authService.logout(dto.refreshToken);
  }

  @Post('oauth/google')
  @SetMetadata(IS_PUBLIC_KEY, true)
  @HttpCode(HttpStatus.OK)
  @Throttle({ auth: { limit: 10, ttl: 900_000 } })
  @ApiOperation({ summary: 'Login or register via Google OAuth' })
  async oauthGoogle(@Body() dto: OAuthCallbackDto) {
    return this.oauthService.handleGoogleCallback(dto.code, dto.redirectUri);
  }

  @Post('oauth/linkedin')
  @SetMetadata(IS_PUBLIC_KEY, true)
  @HttpCode(HttpStatus.OK)
  @Throttle({ auth: { limit: 10, ttl: 900_000 } })
  @ApiOperation({ summary: 'Login or register via LinkedIn OAuth' })
  async oauthLinkedIn(@Body() dto: OAuthCallbackDto) {
    return this.oauthService.handleLinkedInCallback(dto.code, dto.redirectUri);
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
