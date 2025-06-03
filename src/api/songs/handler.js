class SongsHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;
  }

  async postSongHandler(request, h) {
    const { title, year, performer, genre, duration, albumId } = request.payload;
    const songId = await this._service.addSong({ title, year, performer, genre, duration, albumId });

    const response = h.response({
      status: 'success',
      data: {
        songId,
      },
    });
    response.code(201);
    return response;
  }

  async getSongsHandler(request, h) {
    const { title, performer } = request.query;

    const songs = await this._service.getSongs({ title, performer });
    return {
      status: 'success',
      data: {
        songs,
      },
    };
  }

  async getSongByIdHandler(request, h) {
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

  async putSongByIdHandler(request, h) {
    const { id } = request.params;
    const { title, year, performer, genre, duration, albumId } = request.payload;
    await this._service.editSongById(id, { title, year, performer, genre, duration, albumId });

    return {
      status: 'success',
      message: 'Lagu berhasil diperbarui',
    };
  }

  async deleteSongByIdHandler(request, h) {
    const { id } = request.params;
    await this._service.deleteSongById(id);
    return {
      status: 'success',
      message: 'Lagu berhasil dihapus',
    };
  }
}

module.exports = SongsHandler;