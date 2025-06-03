// src/api/songs/routes.js
const { SongPayloadSchema } = require('../../validator/songs/schema'); // Impor skema Joi untuk lagu

const routes = (handler) => [
  {
    method: 'POST',
    path: '/songs',
    handler: (request, h) => handler.postSongHandler(request, h),
    options: {
      validate: {
        payload: SongPayloadSchema, // Validasi payload menggunakan Joi
      },
    },
  },
  {
    method: 'GET',
    path: '/songs', // Mendapatkan semua lagu (atau yang difilter nanti)
    handler: (request, h) => handler.getSongsHandler(request, h),
  },
  {
    method: 'GET',
    path: '/songs/{id}', // Mendapatkan lagu berdasarkan ID
    handler: (request, h) => handler.getSongByIdHandler(request, h),
  },
  {
    method: 'PUT',
    path: '/songs/{id}', // Mengubah lagu berdasarkan ID
    handler: (request, h) => handler.putSongByIdHandler(request, h),
    options: {
      validate: {
        payload: SongPayloadSchema, // Validasi payload menggunakan Joi
      },
    },
  },
  {
    method: 'DELETE',
    path: '/songs/{id}', // Menghapus lagu berdasarkan ID
    handler: (request, h) => handler.deleteSongByIdHandler(request, h),
  },
];

module.exports = routes;