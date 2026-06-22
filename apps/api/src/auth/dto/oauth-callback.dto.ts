import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class OAuthCallbackDto {
  @ApiProperty({ example: '4/0AX4XfWh...' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'http://localhost:3000/auth/callback/google' })
  @IsString()
  redirectUri: string;
}
