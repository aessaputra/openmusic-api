# Gunakan base image Node.js versi 18
FROM node:18-alpine

# Set direktori kerja di dalam container
WORKDIR /usr/src/app

# Salin package.json dan pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# Instal pnpm dan dependensi proyek
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# TAMBAHKAN BARIS INI untuk menginstal psql client
RUN apk add postgresql-client

# Salin seluruh source code proyek
COPY . .

# Salin script healthcheck
COPY wait-for-postgres.sh .

# Buka port yang digunakan oleh aplikasi
EXPOSE 5000

# Perintah ini sekarang akan berfungsi karena psql sudah ada
CMD sh -c './wait-for-postgres.sh && pnpm run migrate:up && pnpm run start'