/* eslint-disable camelcase */

// exports.shorthands = undefined; // Hapus jika tidak digunakan

exports.up = (pgm) => {
  pgm.createTable('playlists', {
    id: {
      type: 'VARCHAR(50)',
      primaryKey: true,
    },
    name: {
      type: 'TEXT',
      notNull: true,
    },
    owner: {
      type: 'VARCHAR(50)',
      notNull: true,
    },
    created_at: {
      type: 'TEXT', // Konsisten dengan migrasi Anda sebelumnya
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    updated_at: {
      type: 'TEXT', // Konsisten dengan migrasi Anda sebelumnya
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  // Menambahkan foreign key constraint untuk kolom owner ke tabel users
  pgm.addConstraint(
    'playlists', // Nama tabel yang akan ditambahkan constraint
    'fk_playlists.owner_users.id', // Nama constraint (bisa disesuaikan)
    'FOREIGN KEY(owner) REFERENCES users(id) ON DELETE CASCADE' // Definisi constraint
    // ON DELETE CASCADE berarti jika user dihapus, playlist miliknya juga akan terhapus.
    // Anda bisa memilih aksi lain seperti ON DELETE SET NULL atau ON DELETE RESTRICT
    // tergantung kebutuhan aplikasi Anda. CASCADE adalah pilihan umum untuk kepemilikan.
  );
};

exports.down = (pgm) => {
  // Tidak perlu menghapus constraint secara eksplisit sebelum drop table,
  // karena drop table akan menghapus constraint yang terkait dengannya.
  // Namun, jika Anda ingin lebih eksplisit atau hanya menghapus constraint:
  // pgm.dropConstraint('playlists', 'fk_playlists.owner_users.id');
  pgm.dropTable('playlists');
};
