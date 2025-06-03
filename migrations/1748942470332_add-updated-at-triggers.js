/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    CREATE OR REPLACE FUNCTION trigger_set_timestamp()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  pgm.sql(`
    CREATE TRIGGER set_timestamp_albums
    BEFORE UPDATE ON albums
    FOR EACH ROW
    EXECUTE PROCEDURE trigger_set_timestamp();
  `);

  pgm.sql(`
    CREATE TRIGGER set_timestamp_songs
    BEFORE UPDATE ON songs
    FOR EACH ROW
    EXECUTE PROCEDURE trigger_set_timestamp();
  `);
};

exports.down = (pgm) => {
  pgm.sql('DROP TRIGGER IF EXISTS set_timestamp_songs ON songs;');

  pgm.sql('DROP TRIGGER IF EXISTS set_timestamp_albums ON albums;');

  pgm.sql('DROP FUNCTION IF EXISTS trigger_set_timestamp();');
};