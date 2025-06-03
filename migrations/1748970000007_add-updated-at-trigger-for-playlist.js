/* eslint-disable camelcase */

exports.up = (pgm) => {
  pgm.sql(`
    CREATE TRIGGER set_timestamp_playlists
    BEFORE UPDATE ON playlists
    FOR EACH ROW
    EXECUTE PROCEDURE trigger_set_timestamp();
  `);
};

exports.down = (pgm) => {
  pgm.sql('DROP TRIGGER IF EXISTS set_timestamp_playlists ON playlists;');
};
