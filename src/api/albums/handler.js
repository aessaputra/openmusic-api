const InvariantError = require('../../exceptions/InvariantError');

class AlbumsHandler {
  constructor(albumsService, storageService, cacheService, validator) {
    this._albumsService = albumsService;
    this._storageService = storageService;
    this._cacheService = cacheService;
    this._validator = validator;
  }

  async postAlbumHandler(request, h) {
    this._validator.validateAlbumPayload(request.payload);
    const { name, year } = request.payload;
    const albumId = await this._albumsService.addAlbum({ name, year });

    const response = h.response({
      status: 'success',
      data: {
        albumId,
      },
    });
    response.code(201);
    return response;
  }

  async getAlbumByIdHandler(request) {
    const { id } = request.params;
    const albumData = await this._albumsService.getAlbumById(id);

    let coverUrl = albumData.cover_url;
    if (coverUrl && !coverUrl.startsWith('http')) {
      coverUrl = `http://${process.env.HOST || 'localhost'}:${
        process.env.PORT || 5000
      }/uploads/covers/${coverUrl}`;
    }

    const albumResponse = {
      id: albumData.id,
      name: albumData.name,
      year: albumData.year,
      coverUrl: coverUrl || null,
      songs: albumData.songs,
    };

    return {
      status: 'success',
      data: {
        album: albumResponse,
      },
    };
  }

  async putAlbumByIdHandler(request) {
    this._validator.validateAlbumPayload(request.payload);
    const { id } = request.params;
    const { name, year } = request.payload;
    await this._albumsService.editAlbumById(id, { name, year });

    return {
      status: 'success',
      message: 'Album berhasil diperbarui',
    };
  }

  async deleteAlbumByIdHandler(request) {
    const { id } = request.params;
    await this._albumsService.deleteAlbumById(id);
    return {
      status: 'success',
      message: 'Album berhasil dihapus',
    };
  }

  async postAlbumCoverHandler(request, h) {
    const { id: albumId } = request.params;
    const { cover } = request.payload;

    if (!cover || !cover.hapi || !cover.hapi.headers['content-type']) {
      throw new InvariantError('Payload sampul tidak valid');
    }
    if (!cover.hapi.headers['content-type'].startsWith('image/')) {
      throw new InvariantError('Berkas yang diunggah harus berupa gambar');
    }

    await this._albumsService.getAlbumById(albumId);

    const oldCoverFilename = await this._albumsService.getAlbumCoverFilename(
      albumId
    );
    if (oldCoverFilename) {
      try {
        await this._storageService.deleteFile(oldCoverFilename);
      } catch (error) {
        console.error(
          `[AlbumsHandler] Gagal menghapus cover lama ${oldCoverFilename}: ${error.message}`
        );
      }
    }

    const filename = await this._storageService.writeFile(cover, cover.hapi);
    const coverUrl = `http://${process.env.HOST || 'localhost'}:${
      process.env.PORT || 5000
    }/uploads/covers/${filename}`;

    await this._albumsService.addAlbumCover(albumId, coverUrl);

    return h
      .response({
        status: 'success',
        message: 'Sampul berhasil diunggah',
      })
      .code(201);
  }

  async postUserLikeAlbumHandler(request, h) {
    const { id: albumId } = request.params;
    const { id: userId } = request.auth.credentials;

    await this._albumsService.getAlbumById(albumId);

    const alreadyLiked = await this._albumsService.checkUserLikeExists(
      userId,
      albumId
    );
    if (alreadyLiked) {
      throw new InvariantError('Album sudah disukai');
    }

    await this._albumsService.addUserLikeToAlbum(userId, albumId);

    await this._cacheService.delete(`album_likes:${albumId}`);

    return h
      .response({
        status: 'success',
        message: 'Album berhasil disukai',
      })
      .code(201);
  }

  async deleteUserLikeAlbumHandler(request, h) {
    const { id: albumId } = request.params;
    const { id: userId } = request.auth.credentials;

    await this._albumsService.removeUserLikeFromAlbum(userId, albumId);

    await this._cacheService.delete(`album_likes:${albumId}`);

    return h
      .response({
        status: 'success',
        message: 'Suka pada album berhasil dibatalkan',
      })
      .code(200);
  }

  async getAlbumLikesHandler(request, h) {
    const { id: albumId } = request.params;
    const cacheKey = `album_likes:${albumId}`;

    try {
      const cachedLikes = await this._cacheService.get(cacheKey);
      if (cachedLikes !== null) {
        const response = h.response({
          status: 'success',
          data: {
            likes: parseInt(cachedLikes, 10),
          },
        });
        response.header('X-Data-Source', 'cache');
        return response;
      }
    } catch (error) {
      console.warn(
        `[AlbumsHandler] Gagal membaca cache untuk ${cacheKey}: ${error.message}. Melanjutkan ke DB.`
      );
    }

    await this._albumsService.getAlbumById(albumId);
    const likesCount = await this._albumsService.getAlbumLikesCount(albumId);

    await this._cacheService.set(cacheKey, likesCount.toString(), 1800);

    return h
      .response({
        status: 'success',
        data: {
          likes: likesCount,
        },
      })
      .code(200);
  }
}

module.exports = AlbumsHandler;
