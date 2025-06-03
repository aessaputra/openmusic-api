// src/api/exports/handler.js
class ExportsHandler {
  constructor(producerService, playlistsService, validator) {
    this._producerService = producerService;
    this._playlistsService = playlistsService;
    this._validator = validator;
  }

  async postExportPlaylistsHandler(request, h) {
    this._validator.validateExportPlaylistsPayload(request.payload);
    const { playlistId } = request.params;
    const { targetEmail } = request.payload;
    const { id: credentialId } = request.auth.credentials; // User ID dari token JWT

    // Verifikasi kepemilikan playlist
    // PlaylistsService perlu metode untuk memverifikasi pemilik tanpa mengambil seluruh detail playlist jika memungkinkan,
    // atau kita bisa menggunakan verifyPlaylistOwner yang sudah ada.
    await this._playlistsService.verifyPlaylistOwner(playlistId, credentialId);

    const message = {
      playlistId,
      targetEmail,
    };

    // Kirim pesan ke RabbitMQ
    // Nama antrean bisa didefinisikan di config atau konstanta
    const queueName = 'export:playlists';
    await this._producerService.sendMessage(queueName, JSON.stringify(message));

    const response = h.response({
      status: 'success',
      message: 'Permintaan Anda sedang kami proses',
    });
    response.code(201);
    return response;
  }
}

module.exports = ExportsHandler;
