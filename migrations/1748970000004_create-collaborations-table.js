/* eslint-disable camelcase */

// exports.shorthands = undefined; // Hapus jika tidak digunakan

exports.up = (pgm) => {
  pgm.createTable('collaborations', {
    id: {
      type: 'VARCHAR(50)', // Atau 'SERIAL'
      primaryKey: true,
    },
    playlist_id: {
      type: 'VARCHAR(50)',
      notNull: true,
    },
    user_id: {
      type: 'VARCHAR(50)',
      notNull: true,
    },
    // created_at bisa ditambahkan jika ingin melacak kapan kolaborasi dibuat
    // created_at: {
    //   type: 'TEXT',
    //   notNull: true,
    //   default: pgm.func('current_timestamp'),
    // },
  });

  // Menambahkan foreign key constraint untuk playlist_id ke tabel playlists
  pgm.addConstraint(
    'collaborations',
    'fk_collaborations.playlist_id_playlists.id',
    'FOREIGN KEY(playlist_id) REFERENCES playlists(id) ON DELETE CASCADE'
  );

  // Menambahkan foreign key constraint untuk user_id ke tabel users
  pgm.addConstraint(
    'collaborations',
    'fk_collaborations.user_id_users.id',
    'FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE'
  );

  // Menambahkan constraint UNIQUE untuk kombinasi playlist_id dan user_id
  // Ini untuk memastikan bahwa satu user tidak bisa dikolaborasikan berulang kali ke playlist yang sama.
  pgm.addConstraint(
    'collaborations',
    'unique_playlist_id_and_user_id',
    'UNIQUE(playlist_id, user_id)'
  );
};

exports.down = (pgm) => {
  // pgm.dropConstraint('collaborations', 'unique_playlist_id_and_user_id');
  // pgm.dropConstraint('collaborations', 'fk_collaborations.user_id_users.id');
  // pgm.dropConstraint('collaborations', 'fk_collaborations.playlist_id_playlists.id');
  pgm.dropTable('collaborations');
};
