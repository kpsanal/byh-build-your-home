const sqlite3 = require('sqlite3').verbose();

let postgresPool;
let postgresSchema;

class Database {
  constructor() {
    this.usePostgres = Boolean(process.env.DATABASE_URL || process.env.DB_HOST);
    this.db = null;
    this.schemaPromise = null;

    if (this.usePostgres) {
      if (!postgresPool) {
        const { Pool, types } = require('pg');
        types.setTypeParser(20, Number);
        types.setTypeParser(1700, Number);
        postgresPool = new Pool({
          connectionString: process.env.DATABASE_URL,
          host: process.env.DB_HOST,
          port: Number(process.env.DB_PORT || 5432),
          database: process.env.DB_NAME,
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          max: Number(process.env.DB_POOL_MAX || 10),
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 5000
        });
        postgresPool.on('error', (error) => {
          console.error('Unexpected PostgreSQL pool error:', error);
        });
      }

      this.pool = postgresPool;
    }
  }

  initialize() {
    if (this.usePostgres) {
      if (!postgresSchema) {
        postgresSchema = this.createPostgresTables().catch((error) => {
          postgresSchema = null;
          throw error;
        });
      }
      return postgresSchema;
    }

    if (this.schemaPromise) {
      return this.schemaPromise;
    }

    if (!this.db) {
      const dbPath = process.env.DATABASE_PATH || './data/expenses.db';
      this.db = new sqlite3.Database(dbPath);
      this.db.run('PRAGMA foreign_keys = ON');
    }

    this.schemaPromise = this.createSqliteTables().catch((error) => {
      this.schemaPromise = null;
      throw error;
    });
    return this.schemaPromise;
  }

  async createPostgresTables() {
    const statements = [
      `CREATE TABLE IF NOT EXISTS users (
        id BIGSERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS projects (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES users(id),
        name TEXT NOT NULL,
        description TEXT,
        location TEXT,
        start_date DATE,
        end_date DATE,
        budget NUMERIC(14,2),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (id, user_id)
      )`,
      `CREATE TABLE IF NOT EXISTS categories (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES users(id),
        name TEXT NOT NULL,
        color TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (id, user_id)
      )`,
      `CREATE TABLE IF NOT EXISTS expenses (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES users(id),
        project_id BIGINT,
        category_id BIGINT,
        amount NUMERIC(14,2) NOT NULL,
        description TEXT,
        vendor TEXT,
        date DATE NOT NULL,
        invoice_number TEXT,
        payment_method TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (project_id, user_id) REFERENCES projects(id, user_id),
        FOREIGN KEY (category_id, user_id) REFERENCES categories(id, user_id)
      )`,
      `CREATE TABLE IF NOT EXISTS invoices (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES users(id),
        project_id BIGINT,
        invoice_number TEXT UNIQUE NOT NULL,
        vendor TEXT NOT NULL,
        amount NUMERIC(14,2) NOT NULL,
        date DATE NOT NULL,
        due_date DATE,
        status TEXT DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (project_id, user_id) REFERENCES projects(id, user_id)
      )`,
      `CREATE TABLE IF NOT EXISTS materials (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES users(id),
        project_id BIGINT NOT NULL,
        name TEXT NOT NULL,
        quantity NUMERIC(14,3) NOT NULL,
        unit TEXT NOT NULL,
        unit_cost NUMERIC(14,2) NOT NULL DEFAULT 0,
        vendor TEXT,
        status TEXT NOT NULL DEFAULT 'planned',
        needed_by DATE,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id, user_id) REFERENCES projects(id, user_id)
      )`,
      `CREATE TABLE IF NOT EXISTS schedule_tasks (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES users(id),
        project_id BIGINT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        start_date DATE,
        due_date DATE NOT NULL,
        status TEXT NOT NULL DEFAULT 'not_started',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id, user_id) REFERENCES projects(id, user_id)
      )`,
      'CREATE INDEX IF NOT EXISTS projects_user_created_idx ON projects(user_id, created_at DESC)',
      'CREATE INDEX IF NOT EXISTS categories_user_name_idx ON categories(user_id, name)',
      'CREATE INDEX IF NOT EXISTS expenses_user_date_idx ON expenses(user_id, date DESC)',
      'CREATE INDEX IF NOT EXISTS expenses_user_project_date_idx ON expenses(user_id, project_id, date DESC)',
      'CREATE INDEX IF NOT EXISTS materials_user_project_needed_idx ON materials(user_id, project_id, needed_by)',
      'CREATE INDEX IF NOT EXISTS schedule_user_project_due_idx ON schedule_tasks(user_id, project_id, due_date)'
    ];

    for (const statement of statements) {
      await this.pool.query(statement);
    }

    console.log('Connected to PostgreSQL');
  }

  async createSqliteTables() {
    const statements = [
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        location TEXT,
        start_date DATE,
        end_date DATE,
        budget DECIMAL(14,2),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE (id, user_id)
      )`,
      `CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        color TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE (id, user_id)
      )`,
      `CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        project_id INTEGER,
        category_id INTEGER,
        amount DECIMAL(14,2) NOT NULL,
        description TEXT,
        vendor TEXT,
        date DATE NOT NULL,
        invoice_number TEXT,
        payment_method TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (project_id) REFERENCES projects(id),
        FOREIGN KEY (category_id) REFERENCES categories(id)
      )`,
      `CREATE TABLE IF NOT EXISTS invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        project_id INTEGER,
        invoice_number TEXT UNIQUE NOT NULL,
        vendor TEXT NOT NULL,
        amount DECIMAL(14,2) NOT NULL,
        date DATE NOT NULL,
        due_date DATE,
        status TEXT DEFAULT 'pending',
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (project_id) REFERENCES projects(id)
      )`,
      `CREATE TABLE IF NOT EXISTS materials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        project_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        quantity NUMERIC NOT NULL,
        unit TEXT NOT NULL,
        unit_cost NUMERIC NOT NULL DEFAULT 0,
        vendor TEXT,
        status TEXT NOT NULL DEFAULT 'planned',
        needed_by DATE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id)
      )`,
      `CREATE TABLE IF NOT EXISTS schedule_tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        project_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        start_date DATE,
        due_date DATE NOT NULL,
        status TEXT NOT NULL DEFAULT 'not_started',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id)
      )`,
      'CREATE INDEX IF NOT EXISTS projects_user_created_idx ON projects(user_id, created_at DESC)',
      'CREATE INDEX IF NOT EXISTS categories_user_name_idx ON categories(user_id, name)',
      'CREATE INDEX IF NOT EXISTS expenses_user_date_idx ON expenses(user_id, date DESC)',
      'CREATE INDEX IF NOT EXISTS expenses_user_project_date_idx ON expenses(user_id, project_id, date DESC)',
      'CREATE INDEX IF NOT EXISTS materials_user_project_needed_idx ON materials(user_id, project_id, needed_by)',
      'CREATE INDEX IF NOT EXISTS schedule_user_project_due_idx ON schedule_tasks(user_id, project_id, due_date)'
    ];

    for (const statement of statements) {
      await new Promise((resolve, reject) => {
        this.db.run(statement, (error) => error ? reject(error) : resolve());
      });
    }
  }

  async run(sql, params = []) {
    await this.initialize();

    if (this.usePostgres) {
      let query = this.preparePostgresQuery(sql);
      if (/^\s*INSERT\s/i.test(query) && !/\sRETURNING\s/i.test(query)) {
        query += ' RETURNING id';
      }
      const result = await this.pool.query(query, params);
      return { id: result.rows[0]?.id, changes: result.rowCount };
    }

    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(error) {
        if (error) reject(error);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  }

  async get(sql, params = []) {
    await this.initialize();

    if (this.usePostgres) {
      const result = await this.pool.query(this.preparePostgresQuery(sql), params);
      return result.rows[0];
    }

    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (error, row) => {
        if (error) reject(error);
        else resolve(row);
      });
    });
  }

  async all(sql, params = []) {
    await this.initialize();

    if (this.usePostgres) {
      const result = await this.pool.query(this.preparePostgresQuery(sql), params);
      return result.rows;
    }

    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (error, rows) => {
        if (error) reject(error);
        else resolve(rows);
      });
    });
  }

  preparePostgresQuery(sql) {
    let parameterIndex = 0;
    return sql.replace(/\?/g, () => `$${++parameterIndex}`);
  }
}

module.exports = Database;
