import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePostDto {
  @ApiProperty({ example: 'Hello, community!' })
  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  content: string;
}
