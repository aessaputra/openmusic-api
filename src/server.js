require('dotenv').config();

const Hapi = require('@hapi/hapi');
const { Pool } = require('pg');
const Jwt = require('@hapi/jwt');

const ClientError = require('./exceptions/ClientError');

const albumsPlugin = require('./api/albums');
const AlbumsService = require('./services/postgres/AlbumsService');
const AlbumsValidator = require('./validator/albums');

const songsPlugin = require('./api/songs');
const SongsService = require('./services/postgres/SongsService');
const SongsValidator = require('./validator/songs');

const usersPlugin = require('./api/users');
const UsersService = require('./services/postgres/UsersService');
const UsersValidator = require('./validator/users');

const authenticationsPlugin = require('./api/authentications');
const AuthenticationsService = require('./services/postgres/AuthenticationsService');
const AuthenticationsValidator = require('./validator/authentications');
const TokenManager = require('./tokenize/TokenManager');

const playlistsPlugin = require('./api/playlists');
const PlaylistsService = require('./services/postgres/PlaylistsService');
const PlaylistsValidator = require('./validator/playlists');

const collaborationsPlugin = require('./api/collaborations');
const CollaborationsService = require('./services/postgres/CollaborationsService');
const CollaborationsValidator = require('./validator/collaborations');

const PlaylistActivitiesService = require('./services/postgres/PlaylistActivitiesService');

const init = async () => {
  const pool = new Pool();

  const albumsService = new AlbumsService(pool);
  const songsService = new SongsService(pool);
  const usersService = new UsersService(pool);
  const authenticationsService = new AuthenticationsService(pool);
  const collaborationsService = new CollaborationsService(pool);
  const playlistActivitiesService = new PlaylistActivitiesService(pool);

  const playlistsService = new PlaylistsService(
    pool,
    collaborationsService,
    playlistActivitiesService
  );

  const server = Hapi.server({
    port: process.env.PORT || 5000,
    host: process.env.HOST || 'localhost',
    routes: {
      cors: {
        origin: ['*'],
      },
    },
  });

  await server.register([
    {
      plugin: Jwt,
    },
  ]);

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

  await server.register([
    {
      plugin: albumsPlugin,
      options: { service: albumsService, validator: AlbumsValidator },
    },
    {
      plugin: songsPlugin,
      options: { service: songsService, validator: SongsValidator },
    },
    {
      plugin: usersPlugin,
      options: { service: usersService, validator: UsersValidator },
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
      plugin: playlistsPlugin,
      options: {
        playlistsService,
        songsService,
        validator: PlaylistsValidator,
        playlistActivitiesService,
      },
    },
    {
      plugin: collaborationsPlugin,
      options: {
        collaborationsService,
        playlistsService,
        usersService,
        validator: CollaborationsValidator,
      },
    },
  ]);

  server.ext('onPreResponse', (request, h) => {
    const { response } = request;

    if (response instanceof ClientError) {
      const newResponse = h.response({
        status: 'fail',
        message: response.message,
      });
      newResponse.code(response.statusCode);
      return newResponse;
    }

    if (response.isBoom) {
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
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

init();
