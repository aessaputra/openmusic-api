const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const InvariantError = require('../../exceptions/InvariantError'); //
const NotFoundError = require('../../exceptions/NotFoundError'); //
const AuthorizationError = require('../../exceptions/AuthorizationError'); // Anda perlu membuat file ini di src/exceptions/AuthorizationError.js

class PlaylistsService {
  constructor(pool, collaborationsService = null) {
    // collaborationsService bersifat opsional untuk Kriteria Opsional 1
    this._pool = pool;
    this._collaborationsService = collaborationsService; // Untuk Kriteria Opsional 1
  }

  async addPlaylist({ name, owner }) {
    const id = `playlist-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO playlists(id, name, owner) VALUES($1, $2, $3) RETURNING id', //
      values: [id, name, owner],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Playlist gagal ditambahkan');
    }
    return result.rows[0].id;
  }

  async getPlaylists(owner) {
    // Untuk Kriteria Opsional 1 (Kolaborasi), query ini perlu dimodifikasi
    // agar juga mengambil playlist dimana user adalah kolaborator.
    // Untuk sekarang, kita buat versi dasar yang hanya mengambil playlist milik owner.
    const query = {
      text: `SELECT p.id, p.name, u.username
             FROM playlists p
             LEFT JOIN users u ON u.id = p.owner
             WHERE p.owner = $1`, // Query dasar
      // Jika Kriteria Opsional 1 (Kolaborasi) diimplementasikan, query akan lebih kompleks:
      // text: `SELECT DISTINCT p.id, p.name, u.username
      //        FROM playlists p
      //        LEFT JOIN users u ON u.id = p.owner
      //        LEFT JOIN collaborations c ON c.playlist_id = p.id
      //        WHERE p.owner = $1 OR c.user_id = $1`,
      values: [owner],
    };
    const result = await this._pool.query(query);
    return result.rows;
  }

  async getPlaylistById(id) {
    // Metode ini akan digunakan untuk GET /playlists/{id}/songs
    // dan juga untuk verifikasi kepemilikan pada operasi lain.
    // Akan mengambil detail playlist dan lagu-lagunya.
    const playlistQuery = {
      text: `SELECT p.id, p.name, u.username
             FROM playlists p
             LEFT JOIN users u ON u.id = p.owner
             WHERE p.id = $1`,
      values: [id],
    };
    const playlistResult = await this._pool.query(playlistQuery);

    if (!playlistResult.rows.length) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }

    const songsQuery = {
      text: `SELECT s.id, s.title, s.performer
             FROM songs s
             JOIN playlist_songs ps ON s.id = ps.song_id
             WHERE ps.playlist_id = $1`, //
      values: [id],
    };
    const songsResult = await this._pool.query(songsQuery);

    const playlist = playlistResult.rows[0];
    playlist.songs = songsResult.rows;

    return playlist;
  }

  async deletePlaylistById(id, owner) {
    await this.verifyPlaylistOwner(id, owner);
    const query = {
      text: 'DELETE FROM playlists WHERE id = $1 RETURNING id', //
      values: [id],
    };
    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Playlist gagal dihapus. Id tidak ditemukan');
    }
  }

  async addSongToPlaylist(playlistId, songId, userId) {
    // Verifikasi apakah lagu ada (opsional, tergantung SongsService)
    // Untuk ini, kita asumsikan SongsService memiliki metode getSongById
    // const songsService = new SongsService(this._pool); // Atau di-inject jika perlu
    // await songsService.getSongById(songId); // Ini akan melempar NotFoundError jika lagu tidak ada

    await this.verifyPlaylistAccess(playlistId, userId); // Memeriksa kepemilikan atau kolaborasi

    const id = `playlistsong-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO playlist_songs(id, playlist_id, song_id) VALUES($1, $2, $3) RETURNING id', //
      values: [id, playlistId, songId],
    };
    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('Lagu gagal ditambahkan ke playlist');
    }
    // Untuk Kriteria Opsional 2 (Activities), tambahkan pencatatan di sini
  }

  async deleteSongFromPlaylist(playlistId, songId, userId) {
    await this.verifyPlaylistAccess(playlistId, userId); // Memeriksa kepemilikan atau kolaborasi

    const query = {
      text: 'DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2 RETURNING id', //
      values: [playlistId, songId],
    };
    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError(
        'Lagu gagal dihapus dari playlist. Mungkin lagu tidak ada di playlist ini.'
      );
    }
    // Untuk Kriteria Opsional 2 (Activities), tambahkan pencatatan di sini
  }

  async verifyPlaylistOwner(id, owner) {
    const query = {
      text: 'SELECT owner FROM playlists WHERE id = $1', //
      values: [id],
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
    // Metode ini akan memeriksa apakah user adalah owner atau kolaborator
    try {
      await this.verifyPlaylistOwner(playlistId, userId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error; // Playlistnya memang tidak ada
      }
      // Jika bukan owner, cek apakah dia kolaborator (jika Kriteria Opsional 1 diimplementasikan)
      if (this._collaborationsService) {
        const collaboration =
          await this._collaborationsService.verifyCollaborator(
            playlistId,
            userId
          );
        if (!collaboration) {
          throw new AuthorizationError(
            'Anda tidak berhak mengakses resource ini'
          );
        }
      } else {
        // Jika tidak ada collaborationsService (belum implementasi fitur kolaborasi)
        throw new AuthorizationError(
          'Anda tidak berhak mengakses resource ini'
        );
      }
    }
  }
}

module.exports = PlaylistsService;
