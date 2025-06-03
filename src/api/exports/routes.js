// src/api/exports/routes.js
const routes = (handler) => [
  {
    method: 'POST',
    path: '/export/playlists/{playlistId}',
    handler: (request, h) => handler.postExportPlaylistsHandler(request, h),
    options: {
      auth: 'openmusic_jwt', // Membutuhkan autentikasi
    },
  },
];

module.exports = routes;
