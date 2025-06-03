// src/exceptions/ClientError.js
class ClientError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ClientError'; // Atau bisa juga menggunakan nama class spesifik
  }
}

module.exports = ClientError;