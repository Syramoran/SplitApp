export function validateEnv(config: Record<string, unknown>): Record<string, unknown> {
  const missing: string[] = [];

  if (!config.JWT_SECRET) missing.push('JWT_SECRET');
  if (!config.DATABASE_URL && !(config.DB_HOST && config.DB_NAME)) {
    missing.push('DATABASE_URL (o DB_HOST + DB_NAME)');
  }

  if (missing.length > 0) {
    throw new Error(
      `Faltan variables de entorno: ${missing.join(', ')}. Copiá .env.example a .env y completalo.`,
    );
  }
  return config;
}
