/* eslint-disable camelcase */

// exports.shorthands = undefined; // Hapus jika tidak digunakan

exports.up = (pgm) => {
  pgm.createTable('playlist_songs', {
    id: {
      type: 'VARCHAR(50)', // Atau 'SERIAL' jika Anda lebih suka auto-increment integer
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
    // Anda bisa menambahkan kolom created_at jika ingin melacak kapan lagu ditambahkan ke playlist
    // created_at: {
    //   type: 'TEXT',
    //   notNull: true,
    //   default: pgm.func('current_timestamp'),
    // },
  });

  // Menambahkan foreign key constraint untuk playlist_id ke tabel playlists
  pgm.addConstraint(
    'playlist_songs',
    'fk_playlist_songs.playlist_id_playlists.id',
    'FOREIGN KEY(playlist_id) REFERENCES playlists(id) ON DELETE CASCADE'
  );

  // Menambahkan foreign key constraint untuk song_id ke tabel songs
  pgm.addConstraint(
    'playlist_songs',
    'fk_playlist_songs.song_id_songs.id',
    'FOREIGN KEY(song_id) REFERENCES songs(id) ON DELETE CASCADE'
  );

  // Menambahkan constraint UNIQUE untuk kombinasi playlist_id dan song_id
  // Ini untuk memastikan bahwa satu lagu tidak bisa ditambahkan berulang kali ke playlist yang sama.
  pgm.addConstraint(
    'playlist_songs',
    'unique_playlist_id_and_song_id',
    'UNIQUE(playlist_id, song_id)'
  );
};

exports.down = (pgm) => {
  // Tidak perlu menghapus constraint secara eksplisit sebelum drop table,
  // namun jika ingin, urutannya adalah drop constraint dulu baru drop table.
  // pgm.dropConstraint('playlist_songs', 'unique_playlist_id_and_song_id');
  // pgm.dropConstraint('playlist_songs', 'fk_playlist_songs.song_id_songs.id');
  // pgm.dropConstraint('playlist_songs', 'fk_playlist_songs.playlist_id_playlists.id');
  pgm.dropTable('playlist_songs');
};
