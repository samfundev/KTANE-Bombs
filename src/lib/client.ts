import { config } from 'dotenv';
import findConfig from 'find-config';
import { PrismaClient } from './generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

config({ path: findConfig('.env') });

const adapter = new PrismaPg({
	connectionString: process.env.DATABASE_URL
});
const client = new PrismaClient({ adapter });

export default client;
