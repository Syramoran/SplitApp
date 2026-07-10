import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateReminderDto {
  @ApiProperty()
  @IsUUID()
  groupId: string;

  @ApiProperty({ description: 'Miembro con saldo pendiente que recibe el recordatorio' })
  @IsUUID()
  toMemberId: string;
}
