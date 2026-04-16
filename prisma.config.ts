import { defineConfig } from 'prisma/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Prisma v7 config — connection URLs live here, not in schema.prisma
export default defineConfig({
  earlyAccess: true,
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL!,
  },
  migrate: {
    async adapter() {
      const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
      return new PrismaPg(pool);
    },
  },
});
