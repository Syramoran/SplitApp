import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateGoalDto {
  @ApiProperty({ example: 'Viaje a Brasil' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name: string;

  @ApiProperty({ example: 800000 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  targetAmount: number;

  @ApiPropertyOptional({ example: '2026-12-01' })
  @IsOptional()
  @IsDateString()
  targetDate?: string;

  @ApiPropertyOptional({ example: 'plane' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  icon?: string;

  @ApiPropertyOptional({ description: 'Meta compartida con un grupo' })
  @IsOptional()
  @IsUUID()
  groupId?: string;
}
