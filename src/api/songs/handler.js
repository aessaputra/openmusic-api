class SongsHandler {
  constructor(service, validator, cacheService) {
    this._service = service;
    this._validator = validator;
    this._cacheService = cacheService;
  }

  async postSongHandler(request, h) {
    const {
      title, year, performer, genre, duration, albumId,
    } = request.payload;
    const songId = await this._service.addSong({
      title,
      year,
      performer,
      genre,
      duration,
      albumId,
    });

    await this._cacheService.delete('songs:all');

    const response = h.response({
      status: 'success',
      data: {
        songId,
      },
    });
    response.code(201);
    return response;
  }

  async getSongsHandler(request) {
    const { title, performer } = request.query;

    if (title || performer) {
      const songs = await this._service.getSongs({ title, performer });
      return {
        status: 'success',
        data: {
          songs,
        },
      };
    }

    try {
      const cachedSongs = await this._cacheService.get('songs:all');
      if (cachedSongs) {
        return {
          status: 'success',
          data: {
            songs: JSON.parse(cachedSongs),
          },
        };
      }
    } catch (error) {
      console.error(
        '[CacheService] Gagal mengambil cache untuk songs:all:',
        error,
      );
    }

    const songs = await this._service.getSongs({});
    await this._cacheService.set('songs:all', JSON.stringify(songs));

    return {
      status: 'success',
      data: {
        songs,
      },
    };
  }

  async getSongByIdHandler(request) {
    const { id } = request.params;
    const songData = await this._service.getSongById(id);

    const song = { ...songData };
    if (song.album_id !== undefined) {
      song.albumId = song.album_id;
      delete song.album_id;
    }

    return {
      status: 'success',
      data: {
        song,
      },
    };
  }

  async putSongByIdHandler(request) {
    const { id } = request.params;
    const {
      title, year, performer, genre, duration, albumId,
    } = request.payload;
    await this._service.editSongById(id, {
      title,
      year,
      performer,
      genre,
      duration,
      albumId,
    });

    await this._cacheService.delete('songs:all');

    return {
      status: 'success',
      message: 'Lagu berhasil diperbarui',
    };
  }

  async deleteSongByIdHandler(request) {
    const { id } = request.params;
    await this._service.deleteSongById(id);

    await this._cacheService.delete('songs:all');

    return {
      status: 'success',
      message: 'Lagu berhasil dihapus',
    };
  }
}

module.exports = SongsHandler;
