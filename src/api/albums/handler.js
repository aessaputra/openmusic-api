// src/api/albums/handler.js
// const autoBind = require('auto-bind'); // Jika Anda memilih menggunakan auto-bind

class AlbumsHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;

    // Jika tidak menggunakan arrow function untuk handler di routes,
    // atau tidak menggunakan auto-bind, Anda perlu bind 'this' secara manual:
    // this.postAlbumHandler = this.postAlbumHandler.bind(this);
    // this.getAlbumByIdHandler = this.getAlbumByIdHandler.bind(this);
    // this.putAlbumByIdHandler = this.putAlbumByIdHandler.bind(this);
    // this.deleteAlbumByIdHandler = this.deleteAlbumByIdHandler.bind(this);

    // Jika menggunakan auto-bind (install dulu: npm install auto-bind@4)
    // autoBind(this);
  }

  async postAlbumHandler(request, h) {
    // Validasi payload ada di konfigurasi route Hapi,
    // namun jika ingin validasi manual di sini juga bisa:
    // this._validator.validateAlbumPayload(request.payload);
    const { name, year } = request.payload;
    const albumId = await this._service.addAlbum({ name, year });

    const response = h.response({
      status: 'success',
      data: {
        albumId,
      },
    });
    response.code(201);
    return response;
  }

  async getAlbumByIdHandler(request, h) {
    const { id } = request.params;
    const album = await this._service.getAlbumById(id);
    return {
      status: 'success',
      data: {
        album,
      },
    };
  }

  async putAlbumByIdHandler(request, h) {
    // Validasi payload ada di konfigurasi route Hapi
    // this._validator.validateAlbumPayload(request.payload);
    const { id } = request.params;
    const { name, year } = request.payload;
    await this._service.editAlbumById(id, { name, year });

    return {
      status: 'success',
      message: 'Album berhasil diperbarui',
    };
  }

  async deleteAlbumByIdHandler(request, h) {
    const { id } = request.params;
    await this._service.deleteAlbumById(id);
    return {
      status: 'success',
      message: 'Album berhasil dihapus',
    };
  }
}

module.exports = AlbumsHandler;