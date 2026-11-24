import { defineConfig } from 'drizzle-kit';

// Migrations are named "timestamp + description" (convention, section 5.6):
// npm run db:generate -- --name <description>
export default defineConfig({
  dialect: 'sqlite',
  schema: './shared/src/db/schema.ts',
  out: './backend/drizzle',
  migrations: { prefix: 'timestamp' },
});
