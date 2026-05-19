import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

const databaseSsl =
  process.env.DATABASE_SSL === 'true' || process.env.DATABASE_SSL === '1'

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    databaseDriverOptions: databaseSsl
      ? { connection: { ssl: { rejectUnauthorized: false } } }
      : { connection: { ssl: false } },
    redisUrl: process.env.REDIS_URL,
    http: {
      storeCors: process.env.STORE_CORS || "http://localhost:8000,http://localhost:3000",
      adminCors: process.env.ADMIN_CORS || "http://localhost:5173,http://localhost:9000,http://localhost:7001",
      authCors: process.env.AUTH_CORS || "http://localhost:8000,http://localhost:3000,http://localhost:5173,http://localhost:9000,http://localhost:7001",
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    }
  },
  modules: {
    payment: {
       resolve: "@medusajs/payment",
    },
    fulfillment: {
      resolve: "@medusajs/medusa/fulfillment",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/fulfillment-manual",
            id: "manual",
          },
        ],
      },
    },
  },
})
