const Joi = require('joi');

const currentYear = new Date().getFullYear();

const SongPayloadSchema = Joi.object({
  title: Joi.string().required(),
  year: Joi.number().integer().min(1900).max(currentYear).required(),
  performer: Joi.string().required(),
  genre: Joi.string().required(),
  duration: Joi.number().integer().min(1).optional().allow(null),
  albumId: Joi.string().optional().allow(null),
});

module.exports = { SongPayloadSchema };