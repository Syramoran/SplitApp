import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1752000000000 implements MigrationInterface {
  name = 'InitialSchema1752000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // gen_random_uuid() es nativo desde PostgreSQL 13
    await queryRunner.query(`
      CREATE TABLE users (
        id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email             VARCHAR(255) UNIQUE NOT NULL,
        password_hash     VARCHAR(255) NOT NULL,
        name              VARCHAR(255) NOT NULL,
        use_case          VARCHAR(20),
        currency          CHAR(3) NOT NULL DEFAULT 'ARS',
        theme             VARCHAR(255) NOT NULL DEFAULT 'light',
        reminders_enabled BOOLEAN NOT NULL DEFAULT true,
        avatar_color      VARCHAR(255) NOT NULL DEFAULT 'lilac',
        created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE categories (
        id       SMALLSERIAL PRIMARY KEY,
        name     VARCHAR(255) NOT NULL UNIQUE,
        icon     VARCHAR(255) NOT NULL,
        color    VARCHAR(255) NOT NULL,
        is_fixed BOOLEAN NOT NULL DEFAULT false
      )
    `);

    await queryRunner.query(`
      CREATE TABLE groups (
        id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name               VARCHAR(255) NOT NULL,
        type               VARCHAR(15) NOT NULL,
        currency           CHAR(3) NOT NULL DEFAULT 'ARS',
        default_split_type VARCHAR(10) NOT NULL DEFAULT 'equal',
        color              VARCHAR(255) NOT NULL DEFAULT 'lilac',
        created_by         UUID NOT NULL REFERENCES users(id),
        created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE group_members (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        group_id      UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
        user_id       UUID REFERENCES users(id),
        display_name  VARCHAR(255) NOT NULL,
        avatar_color  VARCHAR(255) NOT NULL,
        split_percent NUMERIC(5,2),
        created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE (group_id, user_id)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE expenses (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        description  VARCHAR(140) NOT NULL,
        amount       NUMERIC(14,2) NOT NULL CHECK (amount > 0),
        currency     CHAR(3) NOT NULL DEFAULT 'ARS',
        category_id  SMALLINT REFERENCES categories(id),
        group_id     UUID REFERENCES groups(id) ON DELETE CASCADE,
        paid_by      UUID REFERENCES group_members(id),
        created_by   UUID NOT NULL REFERENCES users(id),
        split_type   VARCHAR(10),
        is_recurring BOOLEAN NOT NULL DEFAULT false,
        date         DATE NOT NULL DEFAULT CURRENT_DATE,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX idx_expenses_group ON expenses(group_id, date DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_expenses_user ON expenses(created_by, date DESC)`,
    );

    await queryRunner.query(`
      CREATE TABLE expense_splits (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
        member_id  UUID NOT NULL REFERENCES group_members(id) ON DELETE CASCADE,
        amount     NUMERIC(14,2) NOT NULL,
        weight     NUMERIC(9,2),
        UNIQUE (expense_id, member_id)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE recurring_expenses (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        group_id     UUID REFERENCES groups(id) ON DELETE CASCADE,
        created_by   UUID NOT NULL REFERENCES users(id),
        description  VARCHAR(140) NOT NULL,
        amount       NUMERIC(14,2) NOT NULL,
        category_id  SMALLINT REFERENCES categories(id),
        paid_by      UUID REFERENCES group_members(id),
        split_type   VARCHAR(10) NOT NULL DEFAULT 'equal',
        day_of_month SMALLINT NOT NULL DEFAULT 1,
        active       BOOLEAN NOT NULL DEFAULT true,
        last_run     DATE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE settlements (
        id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        group_id       UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
        from_member_id UUID NOT NULL REFERENCES group_members(id),
        to_member_id   UUID NOT NULL REFERENCES group_members(id),
        amount         NUMERIC(14,2) NOT NULL CHECK (amount > 0),
        method         VARCHAR(10) NOT NULL DEFAULT 'transfer',
        confirmed_at   TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE savings_goals (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        owner_id      UUID NOT NULL REFERENCES users(id),
        group_id      UUID REFERENCES groups(id),
        name          VARCHAR(255) NOT NULL,
        icon          VARCHAR(255) NOT NULL DEFAULT 'plane',
        target_amount NUMERIC(14,2) NOT NULL,
        target_date   DATE,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE goal_contributions (
        id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        goal_id UUID NOT NULL REFERENCES savings_goals(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id),
        label   VARCHAR(80),
        amount  NUMERIC(14,2) NOT NULL CHECK (amount > 0),
        note    VARCHAR(140),
        date    DATE NOT NULL DEFAULT CURRENT_DATE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE reminders (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        group_id     UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
        to_member_id UUID NOT NULL REFERENCES group_members(id) ON DELETE CASCADE,
        amount       NUMERIC(14,2) NOT NULL,
        sent_by      UUID NOT NULL REFERENCES users(id),
        sent_at      TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    // Catálogo de categorías con los íconos y colores pastel del prototipo
    await queryRunner.query(`
      INSERT INTO categories (name, icon, color, is_fixed) VALUES
        ('Súper',      'cart',  'butter', false),
        ('Comida',     'pizza', 'peach',  false),
        ('Hogar',      'sofa',  'mint',   false),
        ('Transporte', 'car',   'blue',   false),
        ('Salidas',    'music', 'lilac',  false),
        ('Vivienda',   'home',  'lilac',  true),
        ('Servicios',  'wifi',  'blue',   true)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS reminders`);
    await queryRunner.query(`DROP TABLE IF EXISTS goal_contributions`);
    await queryRunner.query(`DROP TABLE IF EXISTS savings_goals`);
    await queryRunner.query(`DROP TABLE IF EXISTS settlements`);
    await queryRunner.query(`DROP TABLE IF EXISTS recurring_expenses`);
    await queryRunner.query(`DROP TABLE IF EXISTS expense_splits`);
    await queryRunner.query(`DROP TABLE IF EXISTS expenses`);
    await queryRunner.query(`DROP TABLE IF EXISTS group_members`);
    await queryRunner.query(`DROP TABLE IF EXISTS groups`);
    await queryRunner.query(`DROP TABLE IF EXISTS categories`);
    await queryRunner.query(`DROP TABLE IF EXISTS users`);
  }
}
