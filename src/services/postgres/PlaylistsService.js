const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const AuthorizationError = require('../../exceptions/AuthorizationError');

class PlaylistsService {
  constructor(
    pool,
    collaborationsService = null,
    playlistActivitiesService = null,
  ) {
    this._pool = pool;
    this._collaborationsService = collaborationsService;
    this._playlistActivitiesService = playlistActivitiesService;
  }

  async addPlaylist({ name, owner }) {
    const id = `playlist-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO playlists(id, name, owner) VALUES($1, $2, $3) RETURNING id',
      values: [id, name, owner],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Playlist gagal ditambahkan');
    }
    return result.rows[0].id;
  }

  async getPlaylists(userId) {
    const query = {
      text: `
        SELECT DISTINCT p.id, p.name, u.username
        FROM playlists p
        LEFT JOIN users u ON u.id = p.owner
        LEFT JOIN collaborations c ON c.playlist_id = p.id
        WHERE p.owner = $1 OR c.user_id = $1
      `,
      values: [userId],
    };
    const result = await this._pool.query(query);
    return result.rows;
  }

  async getPlaylistById(playlistId) {
    const playlistQuery = {
      text: `SELECT p.id, p.name, u.username
             FROM playlists p
             LEFT JOIN users u ON u.id = p.owner
             WHERE p.id = $1`,
      values: [playlistId],
    };
    const playlistResult = await this._pool.query(playlistQuery);

    if (!playlistResult.rows.length) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }

    const songsQuery = {
      text: `SELECT s.id, s.title, s.performer
             FROM songs s
             JOIN playlist_songs ps ON s.id = ps.song_id
             WHERE ps.playlist_id = $1`,
      values: [playlistId],
    };
    const songsResult = await this._pool.query(songsQuery);

    const playlist = playlistResult.rows[0];
    playlist.songs = songsResult.rows;

    return playlist;
  }

  async deletePlaylistById(playlistId, owner) {
    await this.verifyPlaylistOwner(playlistId, owner);
    const query = {
      text: 'DELETE FROM playlists WHERE id = $1 RETURNING id',
      values: [playlistId],
    };
    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Playlist gagal dihapus. Id tidak ditemukan');
    }
  }

  async addSongToPlaylist(playlistId, songId, userId) {
    await this.verifyPlaylistAccess(playlistId, userId);

    const id = `playlistsong-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO playlist_songs(id, playlist_id, song_id) VALUES($1, $2, $3) RETURNING id',
      values: [id, playlistId, songId],
    };
    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('Lagu gagal ditambahkan ke playlist');
    }

    if (this._playlistActivitiesService) {
      await this._playlistActivitiesService.addActivity(
        playlistId,
        songId,
        userId,
        'add',
      );
    }
  }

  async deleteSongFromPlaylist(playlistId, songId, userId) {
    await this.verifyPlaylistAccess(playlistId, userId);

    const query = {
      text: 'DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2 RETURNING id',
      values: [playlistId, songId],
    };
    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError(
        'Lagu gagal dihapus dari playlist. Mungkin lagu tidak ada di playlist ini.',
      );
    }

    if (this._playlistActivitiesService) {
      await this._playlistActivitiesService.addActivity(
        playlistId,
        songId,
        userId,
        'delete',
      );
    }
  }

  async verifyPlaylistOwner(playlistId, owner) {
    const query = {
      text: 'SELECT owner FROM playlists WHERE id = $1',
      values: [playlistId],
    };
    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }
    const playlist = result.rows[0];
    if (playlist.owner !== owner) {
      throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
    }
  }

  async verifyPlaylistAccess(playlistId, userId) {
    try {
      await this.verifyPlaylistOwner(playlistId, userId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      if (this._collaborationsService) {
        const collaboration = await this._collaborationsService.verifyCollaborator(
          playlistId,
          userId,
        );
        if (!collaboration) {
          throw new AuthorizationError(
            'Anda tidak berhak mengakses resource ini',
          );
        }
      } else {
        throw new AuthorizationError(
          'Anda tidak berhak mengakses resource ini',
        );
      }
    }
  }
}

module.exports = PlaylistsService;
