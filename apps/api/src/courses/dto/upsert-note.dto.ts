import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpsertNoteDto {
  @ApiProperty({ description: 'Note content for the lesson' })
  @IsString()
  @IsNotEmpty()
  content: string;
}
