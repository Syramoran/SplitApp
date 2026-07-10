import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { SplitType } from '../../groups/entities/group.entity';

export class SplitEntryDto {
  @ApiProperty()
  @IsUUID()
  memberId: string;

  @ApiPropertyOptional({ description: 'Partes o porcentaje, según splitType' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  weight?: number;

  @ApiPropertyOptional({ description: 'Monto exacto (splitType = exact)' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount?: number;
}

export class CreateExpenseDto {
  @ApiProperty({ example: 24600 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount: number;

  @ApiProperty({ example: 'Súper Coto' })
  @IsString()
  @MinLength(1)
  @MaxLength(140)
  description: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  categoryId?: number;

  @ApiPropertyOptional({ description: 'Omitir para gasto personal' })
  @IsOptional()
  @IsUUID()
  groupId?: string;

  @ApiPropertyOptional({ description: 'Miembro que pagó (obligatorio si es grupal)' })
  @IsOptional()
  @IsUUID()
  paidByMemberId?: string;

  @ApiPropertyOptional({ enum: ['equal', 'shares', 'percent', 'exact'] })
  @IsOptional()
  @IsIn(['equal', 'shares', 'percent', 'exact'])
  splitType?: SplitType;

  @ApiPropertyOptional({
    type: [SplitEntryDto],
    description: 'Omitir para dividir en partes iguales entre todos los miembros',
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SplitEntryDto)
  splits?: SplitEntryDto[];

  @ApiPropertyOptional({ example: '2026-07-09' })
  @IsOptional()
  @IsDateString()
  date?: string;
}
