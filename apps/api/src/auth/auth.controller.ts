import { Controller, Post, Body, UseGuards, Request, HttpCode, HttpStatus, SetMetadata } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { IS_PUBLIC_KEY } from './guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

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
}
