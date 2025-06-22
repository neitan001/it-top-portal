import { PrismaClient } from '../../../prisma/generated/mini-app';

if (!process.env.DATABASE_URL_MINI_APP) {
  throw new Error('DATABASE_URL_MINI_APP не задан!');
}

const globalForMiniApp = global;

export const prismaMiniApp =
  globalForMiniApp.prismaMiniApp || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForMiniApp.prismaMiniApp = prismaMiniApp;
}