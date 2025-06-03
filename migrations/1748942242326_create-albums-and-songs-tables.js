/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // Membuat tabel 'albums'
  pgm.createTable('albums', {
    id: {
      type: 'VARCHAR(50)', // Sesuai dengan nanoid, bisa juga CHAR(21) jika panjang tetap
      primaryKey: true,
    },
    name: {
      type: 'TEXT', // Menggunakan TEXT untuk fleksibilitas, bisa juga VARCHAR(255)
      notNull: true,
    },
    year: {
      type: 'INTEGER',
      notNull: true,
    },
    // Anda bisa menambahkan kolom created_at dan updated_at jika diperlukan
    created_at: {
      type: 'TEXT', // Atau TIMESTAMP
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    updated_at: {
      type: 'TEXT',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  // Membuat tabel 'songs'
  pgm.createTable('songs', {
    id: {
      type: 'VARCHAR(50)',
      primaryKey: true,
    },
    title: {
      type: 'TEXT',
      notNull: true,
    },
    year: {
      type: 'INTEGER',
      notNull: true,
    },
    performer: {
      type: 'TEXT',
      notNull: true,
    },
    genre: {
      type: 'TEXT',
      notNull: true,
    },
    duration: {
      type: 'INTEGER',
      notNull: false, // Opsional, jadi bisa NULL
    },
    album_id: { // Menggunakan snake_case untuk konsistensi kolom database
      type: 'VARCHAR(50)',
      notNull: false, // Opsional, jadi bisa NULL
      references: '"albums"(id)', // Referensi ke tabel albums kolom id
      onDelete: 'SET NULL', // Jika album dihapus, album_id di lagu menjadi NULL
      // Opsi lain: 'CASCADE' (jika lagu harus ikut terhapus), 'RESTRICT' (mencegah penghapusan album jika ada lagu terkait)
    },
    created_at: {
      type: 'TEXT',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    updated_at: {
      type: 'TEXT',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  // Membuat indeks pada songs.album_id untuk performa query yang lebih baik (opsional tapi direkomendasikan)
  pgm.createIndex('songs', 'album_id');
};

exports.down = (pgm) => {
  // Menghapus tabel 'songs' terlebih dahulu karena ada foreign key ke 'albums'
  pgm.dropTable('songs');
  // Menghapus tabel 'albums'
  pgm.dropTable('albums');
};