import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import AppDataSource from '../../config/data-source';

/**
 * Datos placeholder que reproducen el estado del prototipo v2.2:
 * Agos, Depto Palermo (Fede te pasa $8.500 / vos le pasás $3.900 a Tomi),
 * Bariloche 2026, Caro & Nico (a mano), meta Brasil 272k/800k, recurrentes.
 *
 * Uso: npm run seed  (idempotente: borra y recarga todo)
 */
async function seed(dataSource: DataSource): Promise<void> {
  const q = async <T = { id: string }>(sql: string, params: unknown[] = []): Promise<T[]> =>
    dataSource.query(sql, params) as Promise<T[]>;

  console.log('Limpiando datos existentes…');
  await q(`TRUNCATE reminders, goal_contributions, savings_goals, settlements,
           recurring_expenses, expense_splits, expenses, group_members, groups, users
           RESTART IDENTITY CASCADE`);

  console.log('Creando usuaria demo…');
  const passwordHash = await bcrypt.hash('password123', 10);
  const [agos] = await q(
    `INSERT INTO users (email, password_hash, name, use_case, avatar_color)
     VALUES ('agos@splitapp.test', $1, 'Agos', 'depto', 'lilac') RETURNING id`,
    [passwordHash],
  );

  console.log('Creando grupos y miembros…');
  const [depto] = await q(
    `INSERT INTO groups (name, type, color, created_by)
     VALUES ('Depto Palermo', 'convivencia', 'lilac', $1) RETURNING id`,
    [agos.id],
  );
  const [bariloche] = await q(
    `INSERT INTO groups (name, type, currency, color, created_by)
     VALUES ('Bariloche 2026', 'viaje', 'USD', 'blue', $1) RETURNING id`,
    [agos.id],
  );
  const [pareja] = await q(
    `INSERT INTO groups (name, type, default_split_type, color, created_by)
     VALUES ('Caro & Nico', 'pareja', 'percent', 'peach', $1) RETURNING id`,
    [agos.id],
  );

  const member = async (
    groupId: string,
    name: string,
    color: string,
    userId: string | null = null,
    percent: number | null = null,
  ): Promise<string> => {
    const [row] = await q(
      `INSERT INTO group_members (group_id, user_id, display_name, avatar_color, split_percent)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [groupId, userId, name, color, percent],
    );
    return row.id;
  };

  const agosDepto = await member(depto.id, 'Agos', 'lilac', agos.id);
  const tomi = await member(depto.id, 'Tomi', 'butter');
  const fede = await member(depto.id, 'Fede', 'blue');

  const agosBari = await member(bariloche.id, 'Agos', 'lilac', agos.id);
  const juli = await member(bariloche.id, 'Juli', 'mint');
  await member(bariloche.id, 'Caro', 'lilac');
  await member(bariloche.id, 'Santi', 'butter');

  const agosPareja = await member(pareja.id, 'Agos', 'lilac', agos.id, 60);
  const nico = await member(pareja.id, 'Nico', 'mint', null, 40);

  const categories = await q<{ id: number; name: string }>(`SELECT id, name FROM categories`);
  const cat = (name: string): number => {
    const found = categories.find((c) => c.name === name);
    if (!found) throw new Error(`Falta la categoría ${name} — ¿corriste las migraciones?`);
    return found.id;
  };

  console.log('Cargando gastos…');
  const expense = async (opts: {
    description: string;
    amount: number;
    category: string;
    groupId?: string;
    paidBy?: string;
    splitType?: string;
    date: string;
    recurring?: boolean;
    splits?: Array<[string, number, number | null]>; // [memberId, amount, weight]
  }): Promise<string> => {
    const [row] = await q(
      `INSERT INTO expenses (description, amount, category_id, group_id, paid_by, created_by,
                             split_type, is_recurring, date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [
        opts.description,
        opts.amount,
        cat(opts.category),
        opts.groupId ?? null,
        opts.paidBy ?? null,
        agos.id,
        opts.splitType ?? null,
        opts.recurring ?? false,
        opts.date,
      ],
    );
    for (const [memberId, amount, weight] of opts.splits ?? []) {
      await q(
        `INSERT INTO expense_splits (expense_id, member_id, amount, weight)
         VALUES ($1, $2, $3, $4)`,
        [row.id, memberId, amount, weight],
      );
    }
    return row.id;
  };

  // --- Depto Palermo: junio (cerrado) ---
  await expense({
    description: 'Alquiler junio', amount: 390000, category: 'Vivienda',
    groupId: depto.id, paidBy: tomi, splitType: 'equal', date: '2026-06-01', recurring: true,
    splits: [[agosDepto, 130000, 1], [tomi, 130000, 1], [fede, 130000, 1]],
  });
  await expense({
    description: 'Internet Fibertel', amount: 11700, category: 'Servicios',
    groupId: depto.id, paidBy: tomi, splitType: 'equal', date: '2026-06-03', recurring: true,
    splits: [[agosDepto, 3900, 1], [tomi, 3900, 1], [fede, 3900, 1]],
  });
  await expense({
    description: 'Ferretería', amount: 6200, category: 'Hogar',
    groupId: depto.id, paidBy: agosDepto, splitType: 'exact', date: '2026-06-28',
    splits: [[agosDepto, 5900, null], [fede, 300, null]],
  });

  // --- Depto Palermo: julio (pendiente) ---
  await expense({
    description: 'Alquiler julio', amount: 390000, category: 'Vivienda',
    groupId: depto.id, paidBy: tomi, splitType: 'equal', date: '2026-07-01', recurring: true,
    splits: [[agosDepto, 130000, 1], [tomi, 130000, 1], [fede, 130000, 1]],
  });
  await expense({
    description: 'Internet Fibertel', amount: 11700, category: 'Servicios',
    groupId: depto.id, paidBy: tomi, splitType: 'equal', date: '2026-07-03', recurring: true,
    splits: [[agosDepto, 3900, 1], [tomi, 3900, 1], [fede, 3900, 1]],
  });
  await expense({
    description: 'Súper Coto', amount: 24600, category: 'Súper',
    groupId: depto.id, paidBy: agosDepto, splitType: 'exact', date: '2026-07-09',
    splits: [[agosDepto, 16400, null], [fede, 8200, null]],
  });

  console.log('Registrando pagos de cierre…');
  const settlement = async (
    groupId: string, from: string, to: string, amount: number, method: string, when: string,
  ): Promise<void> => {
    await q(
      `INSERT INTO settlements (group_id, from_member_id, to_member_id, amount, method, confirmed_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [groupId, from, to, amount, method, when],
    );
  };
  // Junio quedó a mano; de julio ya se pagó el alquiler ("tu parte ya está saldada")
  await settlement(depto.id, agosDepto, tomi, 133900, 'transfer', '2026-06-29T12:00:00Z');
  await settlement(depto.id, fede, tomi, 133900, 'transfer', '2026-06-29T18:00:00Z');
  await settlement(depto.id, agosDepto, tomi, 130000, 'transfer', '2026-07-02T10:00:00Z');
  await settlement(depto.id, fede, tomi, 130000, 'transfer', '2026-07-02T14:00:00Z');

  // --- Bariloche ---
  await expense({
    description: 'Nafta', amount: 18000, category: 'Transporte',
    groupId: bariloche.id, paidBy: juli, splitType: 'equal', date: '2026-07-06',
    splits: [[agosBari, 4500, 1], [juli, 4500, 1]],
  });

  // --- Caro & Nico: 60/40, a mano ---
  await expense({
    description: 'Cena aniversario', amount: 30000, category: 'Comida',
    groupId: pareja.id, paidBy: agosPareja, splitType: 'percent', date: '2026-06-20',
    splits: [[agosPareja, 18000, 60], [nico, 12000, 40]],
  });
  await settlement(pareja.id, nico, agosPareja, 12000, 'cash', '2026-06-25T20:00:00Z');

  // --- Personales de Agos ---
  await expense({ description: 'Café La Noire', amount: 4800, category: 'Comida', date: '2026-07-08' });
  await expense({ description: 'Sube', amount: 12000, category: 'Transporte', date: '2026-07-05' });
  await expense({ description: 'Birras con amigas', amount: 15000, category: 'Salidas', date: '2026-07-04' });
  await expense({ description: 'Verdulería', amount: 9800, category: 'Súper', date: '2026-07-02' });
  await expense({ description: 'Súper Coto', amount: 21000, category: 'Súper', date: '2026-06-15' });
  await expense({ description: 'Cine', amount: 8000, category: 'Salidas', date: '2026-06-21' });
  await expense({ description: 'Café de especialidad', amount: 3500, category: 'Comida', date: '2026-06-10' });

  console.log('Creando plantillas recurrentes…');
  await q(
    `INSERT INTO recurring_expenses (group_id, created_by, description, amount, category_id,
                                     paid_by, split_type, day_of_month, active, last_run)
     VALUES ($1, $2, 'Alquiler', 390000, $3, $4, 'equal', 1, true, '2026-07-01'),
            ($1, $2, 'Internet Fibertel', 11700, $5, $4, 'equal', 3, true, '2026-07-03')`,
    [depto.id, agos.id, cat('Vivienda'), tomi, cat('Servicios')],
  );

  console.log('Creando metas de ahorro…');
  const [brasil] = await q(
    `INSERT INTO savings_goals (owner_id, name, icon, target_amount, target_date)
     VALUES ($1, 'Viaje a Brasil', 'plane', 800000, '2026-12-01') RETURNING id`,
    [agos.id],
  );
  const [mendoza] = await q(
    `INSERT INTO savings_goals (owner_id, group_id, name, icon, target_amount, target_date)
     VALUES ($1, $2, 'Mendoza · con Nico', 'heart', 600000, '2027-03-01') RETURNING id`,
    [agos.id, pareja.id],
  );
  await q(
    `INSERT INTO goal_contributions (goal_id, user_id, label, amount, date) VALUES
       ($1, $2, 'Arranque de la meta', 172000, '2026-06-15'),
       ($1, $2, 'Aporte tuyo', 60000, '2026-06-28'),
       ($1, $2, 'Aporte tuyo', 40000, '2026-07-05'),
       ($3, $2, 'Aporte tuyo', 208800, '2026-06-01'),
       ($3, NULL, 'Nico', 139200, '2026-06-05')`,
    [brasil.id, agos.id, mendoza.id],
  );

  console.log('✳ Seed listo. Entrá con agos@splitapp.test / password123');
}

AppDataSource.initialize()
  .then(async (dataSource) => {
    await seed(dataSource);
    await dataSource.destroy();
  })
  .catch((error) => {
    console.error('El seed falló:', error);
    process.exit(1);
  });
