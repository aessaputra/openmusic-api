const PlaylistsHandler = require('./handler');
const routes = require('./routes');

module.exports = {
  name: 'playlists',
  version: '1.0.0',
  register: async (
    server,
    {
      playlistsService, songsService, validator, playlistActivitiesService,
    },
  ) => {
    const playlistsHandler = new PlaylistsHandler(
      playlistsService,
      songsService,
      validator,
      playlistActivitiesService,
    );
    server.route(routes(playlistsHandler));
  },
};
