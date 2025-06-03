const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');

class SongsService {
  constructor(pool) {
    this._pool = pool;
  }

  async addSong({ title, year, performer, genre, duration, albumId }) {
    const id = `song-${nanoid(16)}`;
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

  async getSongs(queryParams) {
    const { title, performer } = queryParams || {};

    let baseQuery = 'SELECT id, title, performer FROM songs';
    const conditions = [];
    const values = [];
    let paramIndex = 1;

    if (title) {
      conditions.push(`title ILIKE $${paramIndex}`);
      values.push(`%${title}%`);
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
    return result.rows[0];
  }

  async editSongById(id, { title, year, performer, genre, duration, albumId }) {
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