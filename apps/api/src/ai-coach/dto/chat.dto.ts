import { IsString, IsOptional, IsArray, ValidateNested, MaxLength, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class ChatHistoryMessage {
  @ApiProperty({ enum: ['user', 'assistant'] })
  @IsIn(['user', 'assistant'])
  role: 'user' | 'assistant';

  @ApiProperty()
  @IsString()
  @MaxLength(5000)
  content: string;
}

export class ChatDto {
  @ApiProperty()
  @IsString()
  @MaxLength(2000)
  message: string;

  @ApiPropertyOptional({ type: [ChatHistoryMessage] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatHistoryMessage)
  history?: ChatHistoryMessage[];
}
