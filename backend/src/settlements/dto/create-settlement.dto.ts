import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNumber, IsOptional, IsPositive, IsUUID } from 'class-validator';
import { SettlementMethod } from '../entities/settlement.entity';

export class CreateSettlementDto {
  @ApiProperty()
  @IsUUID()
  groupId: string;

  @ApiProperty({ description: 'Miembro que paga' })
  @IsUUID()
  fromMemberId: string;

  @ApiProperty({ description: 'Miembro que recibe' })
  @IsUUID()
  toMemberId: string;

  @ApiProperty({ example: 8500 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount: number;

  @ApiPropertyOptional({ enum: ['transfer', 'cash', 'other'], default: 'transfer' })
  @IsOptional()
  @IsIn(['transfer', 'cash', 'other'])
  method?: SettlementMethod;
}
