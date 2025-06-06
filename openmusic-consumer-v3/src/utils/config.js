require('dotenv').config({
  path: require('path').resolve(__dirname, '../../.env'),
});

const config = {
  rabbitMq: {
    server: process.env.RABBITMQ_SERVER,
  },
  db: {
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    host: process.env.PGHOST,
    port: parseInt(process.env.PGPORT, 10),
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10),
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
  },
};

module.exports = config;
