// src/api/albums/routes.js
const { AlbumPayloadSchema } = require('../../validator/albums/schema'); // Impor skema Joi

const routes = (handler) => [
  {
    method: 'POST',
    path: '/albums',
    handler: (request, h) => handler.postAlbumHandler(request, h), // Menggunakan arrow function
    options: {
      validate: {
        payload: AlbumPayloadSchema, // Validasi payload menggunakan Joi
      },
    },
  },
  {
    method: 'GET',
    path: '/albums/{id}',
    handler: (request, h) => handler.getAlbumByIdHandler(request, h),
  },
  {
    method: 'PUT',
    path: '/albums/{id}',
    handler: (request, h) => handler.putAlbumByIdHandler(request, h),
    options: {
      validate: {
        payload: AlbumPayloadSchema, // Validasi payload menggunakan Joi
      },
    },
  },
  {
    method: 'DELETE',
    path: '/albums/{id}',
    handler: (request, h) => handler.deleteAlbumByIdHandler(request, h),
  },
];

module.exports = routes;