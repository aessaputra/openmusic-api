// src/api/songs/index.js
const SongsHandler = require('./handler');
const routes = require('./routes');

module.exports = {
  name: 'songs', // Nama plugin
  version: '1.0.0', // Versi plugin
  register: async (server, { service, validator }) => {
    const songsHandler = new SongsHandler(service, validator);
    server.route(routes(songsHandler));
  },
};