import { IsString, IsOptional, IsUrl, IsInt, Min, MaxLength } from 'class-validator';

export class CreateRecordingDto {
  @IsString()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  url: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  duration?: number;

  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  thumbnailUrl?: string;
}
