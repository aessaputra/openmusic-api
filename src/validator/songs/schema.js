// src/validator/songs/schema.js
const Joi = require('joi');

const currentYear = new Date().getFullYear();

// Skema untuk payload lagu
const SongPayloadSchema = Joi.object({
  title: Joi.string().required(),
  year: Joi.number().integer().min(1900).max(currentYear).required(),
  performer: Joi.string().required(),
  genre: Joi.string().required(),
  duration: Joi.number().integer().min(1).optional().allow(null), // Durasi dalam detik, opsional
  albumId: Joi.string().optional().allow(null), // ID album, string, opsional
});

module.exports = { SongPayloadSchema };