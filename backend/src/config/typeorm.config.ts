import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export function buildTypeOrmOptions(config: ConfigService): TypeOrmModuleOptions {
  const url = config.get<string>('DATABASE_URL');
  const ssl = config.get<string>('DB_SSL') === 'true' ? { rejectUnauthorized: false } : false;

  const base: TypeOrmModuleOptions = {
    type: 'postgres',
    autoLoadEntities: true,
    // El schema vive en migraciones versionadas, nunca en sync automático
    synchronize: false,
    ssl,
  };

  if (url) return { ...base, url };

  return {
    ...base,
    host: config.get<string>('DB_HOST', 'localhost'),
    port: config.get<number>('DB_PORT', 5432),
    username: config.get<string>('DB_USER', 'postgres'),
    password: config.get<string>('DB_PASSWORD', 'postgres'),
    database: config.get<string>('DB_NAME', 'splitapp'),
  };
}
