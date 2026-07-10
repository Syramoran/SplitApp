import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { GroupType, SplitType } from '../entities/group.entity';

export class CreateGroupDto {
  @ApiProperty({ example: 'Depto Palermo' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name: string;

  @ApiProperty({ enum: ['convivencia', 'pareja', 'viaje', 'evento'] })
  @IsIn(['convivencia', 'pareja', 'viaje', 'evento'])
  type: GroupType;

  @ApiProperty({
    description: 'Nombres de los participantes (sin cuenta). El creador se agrega solo.',
    example: ['Tomi', 'Fede'],
  })
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @MaxLength(80, { each: true })
  members: string[];

  @ApiPropertyOptional({ example: 'ARS', description: 'Moneda principal (grupos de viaje)' })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @ApiPropertyOptional({ enum: ['equal', 'shares', 'percent', 'exact'], default: 'equal' })
  @IsOptional()
  @IsIn(['equal', 'shares', 'percent', 'exact'])
  defaultSplitType?: SplitType;

  @ApiPropertyOptional({
    description: 'Pareja: porcentaje del creador en la división proporcional (ej. 60)',
    example: 60,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(99)
  myPercent?: number;
}
