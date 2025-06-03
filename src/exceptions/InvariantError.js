// src/exceptions/InvariantError.js
const ClientError = require('./ClientError');

class InvariantError extends ClientError {
  constructor(message) {
    super(message, 400); // Biasanya error 400 Bad Request
    this.name = 'InvariantError';
  }
}

module.exports = InvariantError;