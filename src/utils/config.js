// src/utils/config.js
require('dotenv').config(); // Pastikan dotenv di-load

const config = {
  app: {
    host: process.env.HOST,
    port: process.env.PORT,
    // Tambahkan variabel lain yang relevan untuk aplikasi jika ada
  },
  // Konfigurasi yang sudah ada mungkin ada di sini (misalnya database, S3 jika sudah)
  // ...

  // BARU: Konfigurasi RabbitMQ
  rabbitMq: {
    server: process.env.RABBITMQ_SERVER,
  },

  // BARU: Konfigurasi SMTP (Nodemailer)
  smtp: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
  },

  // BARU: Konfigurasi Redis (akan digunakan di Kriteria 4)
  redis: {
    host: process.env.REDIS_SERVER,
  },
};

module.exports = config;
