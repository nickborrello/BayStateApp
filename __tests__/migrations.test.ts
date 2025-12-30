import fs from 'fs';
import path from 'path';

describe('Database Schema Migrations', () => {
  it('should have a migration file for the initial schema', () => {
    const migrationsDir = path.join(process.cwd(), 'supabase/migrations');
    if (!fs.existsSync(migrationsDir)) {
      throw new Error('Migrations directory does not exist');
    }
    const files = fs.readdirSync(migrationsDir);
    const migrationFile = files.find(f => f.endsWith('.sql'));
    expect(migrationFile).toBeDefined();
  });
});
