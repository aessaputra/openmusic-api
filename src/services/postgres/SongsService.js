// src/services/postgres/SongsService.js
const { nanoid } = require('nanoid');
// Pool tidak perlu diimpor di sini jika hanya untuk type hinting dan sudah di-pass via constructor
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');

class SongsService {
  constructor(pool) {
    this._pool = pool;
  }

  async addSong({ title, year, performer, genre, duration, albumId }) {
    const id = `song-${nanoid(16)}`;
    // Menggunakan DEFAULT dari DB untuk created_at dan updated_at (trigger)
    const query = {
      text: `INSERT INTO songs(id, title, year, performer, genre, duration, album_id)
             VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      values: [id, title, year, performer, genre, duration, albumId],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Lagu gagal ditambahkan');
    }
    return result.rows[0].id;
  }

  async getSongs(queryParams) { // Menerima queryParams sebagai objek
    const { title, performer } = queryParams || {}; // Destructure dengan default empty object

    let baseQuery = 'SELECT id, title, performer FROM songs';
    const conditions = [];
    const values = [];
    let paramIndex = 1;

    if (title) {
      conditions.push(`title ILIKE $${paramIndex}`); // ILIKE untuk case-insensitive
      values.push(`%${title}%`); // % untuk partial matching
      paramIndex += 1;
    }

    if (performer) {
      conditions.push(`performer ILIKE $${paramIndex}`);
      values.push(`%${performer}%`);
      paramIndex += 1;
    }

    if (conditions.length > 0) {
      baseQuery += ` WHERE ${conditions.join(' AND ')}`;
    }

    const result = await this._pool.query({
      text: baseQuery,
      values,
    });
    return result.rows;
  }

  async getSongById(id) {
    const query = {
      text: 'SELECT id, title, year, performer, genre, duration, album_id FROM songs WHERE id = $1',
      values: [id],
    };
    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Lagu tidak ditemukan');
    }
    // Pemetaan album_id ke albumId dilakukan di handler
    return result.rows[0];
  }

  async editSongById(id, { title, year, performer, genre, duration, albumId }) {
    // Trigger DB akan menangani updated_at
    const query = {
      text: `UPDATE songs SET title = $1, year = $2, performer = $3, genre = $4, duration = $5, album_id = $6
             WHERE id = $8 RETURNING id`, // Perhatikan index $7 hilang, harusnya $6, updated_at=$7, id=$8
                                          // Jika updated_at dihandle trigger, maka cukup sampai album_id=$6, WHERE id=$7
      values: [title, year, performer, genre, duration, albumId, id], // Sesuaikan jumlah values
    };

    // Koreksi untuk editSongById jika updated_at dihandle trigger:
    const correctedEditQuery = {
        text: `UPDATE songs SET title = $1, year = $2, performer = $3, genre = $4, duration = $5, album_id = $6
               WHERE id = $7 RETURNING id`,
        values: [title, year, performer, genre, duration, albumId, id],
      };


    const result = await this._pool.query(correctedEditQuery);

    if (!result.rowCount) {
      throw new NotFoundError('Gagal memperbarui lagu. Id tidak ditemukan');
    }
  }

  async deleteSongById(id) {
    const query = {
      text: 'DELETE FROM songs WHERE id = $1 RETURNING id',
      values: [id],
    };
    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Lagu gagal dihapus. Id tidak ditemukan');
    }
  }
}

module.exports = SongsService;