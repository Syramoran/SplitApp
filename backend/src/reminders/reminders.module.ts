import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettlementsModule } from '../settlements/settlements.module';
import { Reminder } from './entities/reminder.entity';
import { RemindersController } from './reminders.controller';
import { RemindersService } from './reminders.service';

@Module({
  imports: [TypeOrmModule.forFeature([Reminder]), SettlementsModule],
  controllers: [RemindersController],
  providers: [RemindersService],
})
export class RemindersModule {}
