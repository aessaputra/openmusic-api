require('dotenv').config();

const Hapi = require('@hapi/hapi');
const { Pool } = require('pg');
const Jwt = require('@hapi/jwt');

// Exceptions
const ClientError = require('./exceptions/ClientError'); //

// Albums
const albumsPlugin = require('./api/albums'); //
const AlbumsService = require('./services/postgres/AlbumsService'); //
const AlbumsValidator = require('./validator/albums'); //

// Songs
const songsPlugin = require('./api/songs'); //
const SongsService = require('./services/postgres/SongsService'); //
const SongsValidator = require('./validator/songs'); //

// Users
const usersPlugin = require('./api/users'); // Asumsikan file ini sudah dibuat
const UsersService = require('./services/postgres/UsersService'); // Asumsikan file ini sudah dibuat
const UsersValidator = require('./validator/users'); // Asumsikan file ini sudah dibuat

// Authentications
const authenticationsPlugin = require('./api/authentications'); // Asumsikan file ini sudah dibuat
const AuthenticationsService = require('./services/postgres/AuthenticationsService'); // Asumsikan file ini sudah dibuat
const AuthenticationsValidator = require('./validator/authentications'); // Asumsikan file ini sudah dibuat
const TokenManager = require('./tokenize/TokenManager'); // Asumsikan file ini sudah dibuat

// Playlists - BARU
const playlistsPlugin = require('./api/playlists'); // Asumsikan file ini sudah dibuat
const PlaylistsService = require('./services/postgres/PlaylistsService'); // Asumsikan file ini sudah dibuat
const PlaylistsValidator = require('./validator/playlists'); // Asumsikan file ini sudah dibuat

// Collaborations - BARU (untuk Kriteria Opsional, bisa dikomentari jika belum)
// const collaborationsPlugin = require('./api/collaborations');
// const CollaborationsService = require('./services/postgres/CollaborationsService');
// const CollaborationsValidator = require('./validator/collaborations');

const init = async () => {
  const pool = new Pool(); // Pastikan konfigurasi Pool sudah sesuai

  // Inisialisasi services
  const albumsService = new AlbumsService(pool);
  const songsService = new SongsService(pool);
  const usersService = new UsersService(pool);
  const authenticationsService = new AuthenticationsService(pool);
  // const collaborationsService = new CollaborationsService(pool); // Untuk Kriteria Opsional
  // Saat menginisialisasi PlaylistsService, Anda mungkin perlu menyertakan collaborationsService jika fitur kolaborasi aktif
  // const playlistsService = new PlaylistsService(pool, collaborationsService);
  const playlistsService = new PlaylistsService(pool); // Versi dasar tanpa kolaborasi dulu

  const server = Hapi.server({
    port: process.env.PORT || 5000,
    host: process.env.HOST || 'localhost',
    routes: {
      cors: {
        origin: ['*'],
      },
    },
  });

  // Registrasi plugin eksternal
  await server.register([
    {
      plugin: Jwt,
    },
  ]);

  // Mendefinisikan strategi autentikasi jwt
  server.auth.strategy('openmusic_jwt', 'jwt', {
    keys: process.env.ACCESS_TOKEN_KEY,
    verify: {
      aud: false,
      iss: false,
      sub: false,
      maxAgeSec: process.env.ACCESS_TOKEN_AGE || 3600,
    },
    validate: (artifacts) => ({
      isValid: true,
      credentials: {
        id: artifacts.decoded.payload.userId,
      },
    }),
  });

  // Registrasi plugin internal
  await server.register([
    {
      plugin: albumsPlugin,
      options: {
        service: albumsService,
        validator: AlbumsValidator,
      },
    },
    {
      plugin: songsPlugin,
      options: {
        service: songsService,
        validator: SongsValidator,
      },
    },
    {
      plugin: usersPlugin,
      options: {
        service: usersService,
        validator: UsersValidator,
      },
    },
    {
      plugin: authenticationsPlugin,
      options: {
        authenticationsService,
        usersService,
        tokenManager: TokenManager,
        validator: AuthenticationsValidator,
      },
    },
    {
      // BARU
      plugin: playlistsPlugin,
      options: {
        playlistsService,
        songsService, // Diperlukan oleh PlaylistsHandler untuk validasi songId
        validator: PlaylistsValidator,
        // collaborationsService, // Tambahkan jika Kriteria Opsional Kolaborasi diaktifkan
      },
    },
    // { // BARU - Untuk Kriteria Opsional Kolaborasi
    //   plugin: collaborationsPlugin,
    //   options: {
    //     collaborationsService,
    //     playlistsService, // Diperlukan untuk memverifikasi owner playlist
    //     usersService, // Diperlukan untuk memverifikasi user yg akan dikolaborasikan
    //     validator: CollaborationsValidator,
    //   },
    // },
  ]);

  server.ext('onPreResponse', (request, h) => {
    //
    const { response } = request;

    if (response instanceof ClientError) {
      //
      const newResponse = h.response({
        status: 'fail',
        message: response.message,
      });
      newResponse.code(response.statusCode);
      return newResponse;
    }

    if (response.isBoom) {
      //
      const newResponse = h.response({
        status: 'fail',
        message: response.message,
      });
      newResponse.code(response.output.statusCode);
      return newResponse;
    }

    if (
      response instanceof Error &&
      !response.isBoom &&
      !(response instanceof ClientError)
    ) {
      //
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
      message: 'Selamat datang di OpenMusic API v2!',
    }),
  });

  await server.start();
  console.log(`Server berjalan pada ${server.info.uri}`);
};

process.on('unhandledRejection', (err) => {
  //
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  //
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

init();
