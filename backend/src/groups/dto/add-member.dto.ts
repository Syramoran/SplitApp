import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class AddMemberDto {
  @ApiProperty({ example: 'Fede', description: 'Solo el nombre — no necesita cuenta' })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name: string;
}
