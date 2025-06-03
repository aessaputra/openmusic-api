/* eslint-disable camelcase */

// exports.shorthands = undefined; // Hapus jika tidak digunakan

exports.up = (pgm) => {
  pgm.createTable('playlist_song_activities', {
    id: {
      type: 'VARCHAR(50)', // Atau 'SERIAL'
      primaryKey: true,
    },
    playlist_id: {
      type: 'VARCHAR(50)',
      notNull: true,
    },
    song_id: {
      type: 'VARCHAR(50)',
      notNull: true,
    },
    user_id: {
      type: 'VARCHAR(50)',
      notNull: true,
    },
    action: {
      type: 'VARCHAR(10)', // Cukup untuk 'add' atau 'delete'
      notNull: true,
    },
    time: {
      type: 'TEXT', // Konsisten dengan kolom timestamp Anda yang lain
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  // Menambahkan foreign key constraint untuk playlist_id ke tabel playlists
  pgm.addConstraint(
    'playlist_song_activities',
    'fk_playlist_song_activities.playlist_id_playlists.id',
    'FOREIGN KEY(playlist_id) REFERENCES playlists(id) ON DELETE CASCADE'
  );

  // Menambahkan foreign key constraint untuk song_id ke tabel songs
  // Untuk song_id, ON DELETE CASCADE mungkin berarti aktivitas juga hilang jika lagu dihapus.
  // Pertimbangkan apakah ini perilaku yang diinginkan. Alternatifnya bisa ON DELETE SET NULL (jika song_id boleh null)
  // atau ON DELETE RESTRICT. Untuk submission ini, CASCADE biasanya diterima.
  pgm.addConstraint(
    'playlist_song_activities',
    'fk_playlist_song_activities.song_id_songs.id',
    'FOREIGN KEY(song_id) REFERENCES songs(id) ON DELETE CASCADE'
  );

  // Menambahkan foreign key constraint untuk user_id ke tabel users
  pgm.addConstraint(
    'playlist_song_activities',
    'fk_playlist_song_activities.user_id_users.id',
    'FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE'
  );
};

exports.down = (pgm) => {
  // pgm.dropConstraint('playlist_song_activities', 'fk_playlist_song_activities.user_id_users.id');
  // pgm.dropConstraint('playlist_song_activities', 'fk_playlist_song_activities.song_id_songs.id');
  // pgm.dropConstraint('playlist_song_activities', 'fk_playlist_song_activities.playlist_id_playlists.id');
  pgm.dropTable('playlist_song_activities');
};
