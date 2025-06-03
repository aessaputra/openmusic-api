// src/services/postgres/AlbumsService.js
const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');

class AlbumsService {
  constructor(pool) {
    this._pool = pool;
  }

  async addAlbum({ name, year }) {
    const id = `album-${nanoid(16)}`;
    // Menggunakan DEFAULT CURRENT_TIMESTAMP dari DB untuk created_at dan updated_at
    const query = {
      text: 'INSERT INTO albums(id, name, year) VALUES($1, $2, $3) RETURNING id',
      values: [id, name, year],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Album gagal ditambahkan');
    }
    return result.rows[0].id;
  }

  async getAlbumById(id) {
    // Query pertama: mendapatkan detail album
    const albumQuery = {
      text: 'SELECT id, name, year FROM albums WHERE id = $1',
      // Jika Anda ingin menampilkan created_at dan updated_at album juga, tambahkan di sini
      // text: 'SELECT id, name, year, created_at, updated_at FROM albums WHERE id = $1',
      values: [id],
    };
    const albumResult = await this._pool.query(albumQuery);

    if (!albumResult.rowCount) {
      throw new NotFoundError('Album tidak ditemukan');
    }

    const album = albumResult.rows[0];

    // Query kedua: mendapatkan lagu-lagu yang ada di album tersebut
    // Hanya kolom id, title, dan performer yang dibutuhkan untuk lagu
    const songsQuery = {
      text: 'SELECT id, title, performer FROM songs WHERE album_id = $1',
      values: [id],
    };
    const songsResult = await this._pool.query(songsQuery);

    // Gabungkan hasil album dengan lagu-lagunya
    // album.songs = songsResult.rows.map(song => ({ // Jika ada mapping lebih lanjut
    //   id: song.id,
    //   title: song.title,
    //   performer: song.performer,
    // }));
    album.songs = songsResult.rows; // Langsung assign array lagu

    return album;
  }

  async editAlbumById(id, { name, year }) {
    // Menggunakan trigger DB untuk updated_at
    const query = {
      text: 'UPDATE albums SET name = $1, year = $2 WHERE id = $3 RETURNING id',
      values: [name, year, id],
    };
    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Gagal memperbarui album. Id tidak ditemukan');
    }
  }

  async deleteAlbumById(id) {
    const query = {
      text: 'DELETE FROM albums WHERE id = $1 RETURNING id',
      values: [id],
    };
    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Album gagal dihapus. Id tidak ditemukan');
    }
  }
}

module.exports = AlbumsService;