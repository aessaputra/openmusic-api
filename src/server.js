// src/server.js
require('dotenv').config();

const Hapi = require('@hapi/hapi');
const { Pool } = require('pg');

// Impor error kustom
const ClientError = require('./exceptions/ClientError');

// --- Komponen Album ---
const albumsPlugin = require('./api/albums'); // Plugin Album
const AlbumsService = require('./services/postgres/AlbumsService');
const AlbumsValidator = require('./validator/albums');

// --- Komponen Lagu (Songs) ---
const songsPlugin = require('./api/songs'); // Plugin Lagu
const SongsService = require('./services/postgres/SongsService');
const SongsValidator = require('./validator/songs');

const init = async () => {
  const pool = new Pool();

  // Inisialisasi service
  const albumsService = new AlbumsService(pool);
  const songsService = new SongsService(pool); // Inisialisasi SongsService

  const server = Hapi.server({
    port: process.env.PORT || 5000,
    host: process.env.HOST || 'localhost',
    routes: {
      cors: {
        origin: ['*'],
      },
    },
  });

  // Registrasi plugin (sekarang ada dua plugin)
  await server.register([
    {
      plugin: albumsPlugin,
      options: {
        service: albumsService,
        validator: AlbumsValidator,
      },
    },
    { // Tambahkan plugin lagu
      plugin: songsPlugin,
      options: {
        service: songsService, // Kirim instance SongsService
        validator: SongsValidator, // Kirim SongsValidator
      },
    },
  ]);

  // Implementasi onPreResponse (tetap sama)
  server.ext('onPreResponse', (request, h) => {
    const { response } = request;

    if (response instanceof Error) {
      if (response instanceof ClientError) {
        const newResponse = h.response({
          status: 'fail',
          message: response.message,
        });
        newResponse.code(response.statusCode);
        return newResponse;
      }

      if (!response.isServer) {
        if (response.isBoom && response.output.statusCode === 404) {
          const newResponse = h.response({
            status: 'fail',
            message: 'Resource tidak ditemukan',
          });
          newResponse.code(404);
          return newResponse;
        }
        return h.continue;
      }

      console.error(response);
      const newResponse = h.response({
        status: 'error',
        message: 'Maaf, terjadi kegagalan pada server kami.',
      });
      newResponse.code(500);
      return newResponse;
    }
    return h.continue;
  });

  server.route({
    method: 'GET',
    path: '/',
    handler: () => ({
      message: 'Selamat datang di OpenMusic API v1!',
    }),
  });

  await server.start();
  console.log(`Server berjalan pada ${server.info.uri}`);
};

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

init();