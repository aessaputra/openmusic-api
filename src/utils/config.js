require('dotenv').config();

const config = {
  app: {
    host: process.env.HOST,
    port: process.env.PORT,
    uploadsPath: process.env.UPLOADS_PATH || 'src/public/uploads/covers',
  },
  rabbitMq: {
    server: process.env.RBITMQ_SERVER,
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
  },
  redis: {
    host: process.env.REDIS_SERVER.startsWith('redis://')
      ? new URL(process.env.REDIS_SERVER).hostname
      : process.env.REDIS_SERVER,
  },
};

module.exports = config;
