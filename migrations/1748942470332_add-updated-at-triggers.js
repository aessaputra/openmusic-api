// migrations/[timestamp]-add-timestamp-triggers.js
/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // 1. Membuat fungsi untuk trigger updated_at
  pgm.sql(`
    CREATE OR REPLACE FUNCTION trigger_set_timestamp()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP; -- Menggunakan CURRENT_TIMESTAMP atau NOW()
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  // 2. Membuat trigger untuk tabel 'albums'
  // Pastikan tabel 'albums' sudah ada sebelum menjalankan migrasi ini
  pgm.sql(`
    CREATE TRIGGER set_timestamp_albums
    BEFORE UPDATE ON albums
    FOR EACH ROW
    EXECUTE PROCEDURE trigger_set_timestamp();
  `);

  // 3. Membuat trigger untuk tabel 'songs'
  // Pastikan tabel 'songs' sudah ada sebelum menjalankan migrasi ini
  pgm.sql(`
    CREATE TRIGGER set_timestamp_songs
    BEFORE UPDATE ON songs
    FOR EACH ROW
    EXECUTE PROCEDURE trigger_set_timestamp();
  `);
};

exports.down = (pgm) => {
  // 1. Hapus trigger dari tabel 'songs'
  pgm.sql('DROP TRIGGER IF EXISTS set_timestamp_songs ON songs;');

  // 2. Hapus trigger dari tabel 'albums'
  pgm.sql('DROP TRIGGER IF EXISTS set_timestamp_albums ON albums;');

  // 3. Hapus fungsi trigger
  pgm.sql('DROP FUNCTION IF EXISTS trigger_set_timestamp();');
};