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
    const cacheKey = `album:${id}`;

    try {
      const cachedAlbum = await this._cacheService.get(cacheKey);
      if (cachedAlbum) {
        return {
          status: 'success',
          data: {
            album: JSON.parse(cachedAlbum),
          },
        };
      }
    } catch (error) {
      console.error(
        `[CacheService] Gagal mengambil cache untuk ${cacheKey}:`,
        error,
      );
    }

    const album = await this._albumsService.getAlbumById(id);
    await this._cacheService.set(cacheKey, JSON.stringify(album));

    return {
      status: 'success',
      data: {
        album,
      },
    };
  }

  async putAlbumByIdHandler(request) {
    this._validator.validateAlbumPayload(request.payload);
    const { id } = request.params;
    const { name, year } = request.payload;
    await this._albumsService.editAlbumById(id, { name, year });

    await this._cacheService.delete(`album:${id}`);

    return {
      status: 'success',
      message: 'Album berhasil diperbarui',
    };
  }

  async deleteAlbumByIdHandler(request) {
    const { id } = request.params;
    await this._albumsService.deleteAlbumById(id);

    await this._cacheService.delete(`album:${id}`);
    await this._cacheService.delete(`album_likes:${id}`);

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

    const oldCoverUrl = await this._albumsService.getAlbumCoverUrl(albumId);
    if (oldCoverUrl) {
      try {
        const oldFilename = oldCoverUrl.substring(
          oldCoverUrl.lastIndexOf('/') + 1,
        );
        await this._storageService.deleteFile(oldFilename);
      } catch (error) {
        console.error(
          `[AlbumsHandler] Gagal menghapus cover lama: ${error.message}`,
        );
      }
    }

    const coverUrl = await this._storageService.writeFile(cover, cover.hapi);
    await this._albumsService.addAlbumCover(albumId, coverUrl);
    await this._cacheService.delete(`album:${albumId}`);

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
      albumId,
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
        `[AlbumsHandler] Gagal membaca cache untuk ${cacheKey}: ${error.message}. Melanjutkan ke DB.`,
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
