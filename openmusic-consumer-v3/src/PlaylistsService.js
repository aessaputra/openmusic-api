const NotFoundError = require('./exceptions/NotFoundError');

class PlaylistsService {
  constructor(poolInstance) {
    this._pool = poolInstance;
  }

  async getPlaylistWithSongs(playlistId) {
    const playlistQuery = {
      text: `SELECT p.id, p.name
             FROM playlists p
             WHERE p.id = $1`,
      values: [playlistId],
    };
    const playlistResult = await this._pool.query(playlistQuery);

    if (!playlistResult.rows.length) {
      throw new NotFoundError(
        `Playlist dengan ID ${playlistId} tidak ditemukan.`
      );
    }

    const playlist = playlistResult.rows[0];

    const songsQuery = {
      text: `SELECT s.id, s.title, s.performer
             FROM songs s
             INNER JOIN playlist_songs ps ON s.id = ps.song_id
             WHERE ps.playlist_id = $1`,
      values: [playlistId],
    };
    const songsResult = await this._pool.query(songsQuery);

    playlist.songs = songsResult.rows;

    return playlist;
  }
}

module.exports = PlaylistsService;
