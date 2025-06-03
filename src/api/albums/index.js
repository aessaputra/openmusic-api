// src/api/albums/index.js
const AlbumsHandler = require('./handler');
const routes = require('./routes');

module.exports = {
  name: 'albums', // Nama plugin
  version: '1.0.0', // Versi plugin
  register: async (server, { service, validator }) => {
    const albumsHandler = new AlbumsHandler(service, validator);
    server.route(routes(albumsHandler));
  },
};