import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { buildTypeOrmOptions } from './config/typeorm.config';
import { validateEnv } from './config/env.validation';
import { ExpensesModule } from './expenses/expenses.module';
import { GoalsModule } from './goals/goals.module';
import { GroupsModule } from './groups/groups.module';
import { InsightsModule } from './insights/insights.module';
import { RemindersModule } from './reminders/reminders.module';
import { SettlementsModule } from './settlements/settlements.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => buildTypeOrmOptions(config),
    }),
    // Rate limit global generoso; auth tiene límites propios más estrictos
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    ScheduleModule.forRoot(),
    AuthModule,
    UsersModule,
    GroupsModule,
    ExpensesModule,
    SettlementsModule,
    GoalsModule,
    RemindersModule,
    InsightsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
