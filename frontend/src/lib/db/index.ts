import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Create postgres connection
const connectionString = process.env.DATABASE_URL || '';

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(connectionString, { prepare: false });

// Create drizzle instance
export const db = drizzle(client);
