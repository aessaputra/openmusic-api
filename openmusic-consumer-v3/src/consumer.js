require('dotenv').config({
  path: require('path').resolve(__dirname, '../.env'),
});

const amqp = require('amqplib');
const { Pool } = require('pg');
const config = require('./utils/config');
const PlaylistsService = require('./PlaylistsService');
const MailSender = require('./MailSender');
const NotFoundError = require('./exceptions/NotFoundError');

const initConsumer = async () => {
  let rabbitMqConnection;
  let dbPool;

  try {
    dbPool = new Pool({
      user: config.db.user,
      password: config.db.password,
      host: config.db.host,
      database: config.db.database,
      port: config.db.port,
    });
    await dbPool.query('SELECT 1');
    console.log('[Consumer] Koneksi Database berhasil.');

    const playlistsService = new PlaylistsService(dbPool);
    const mailSender = new MailSender();

    rabbitMqConnection = await amqp.connect(config.rabbitMq.server);
    const channel = await rabbitMqConnection.createChannel();
    console.log('[Consumer] Koneksi RabbitMQ berhasil.');

    const queue = 'export:playlists';
    await channel.assertQueue(queue, {
      durable: true,
    });

    console.log(`[Consumer] Menunggu pesan di antrean "${queue}"...`);

    channel.consume(
      queue,
      async (message) => {
        if (message === null) {
          console.warn(
            '[Consumer] Menerima pesan null, mungkin channel ditutup.'
          );
          return;
        }

        const messageContentString = message.content.toString();
        console.log(`[Consumer] Menerima pesan: ${messageContentString}`);
        let parsedMessage;

        try {
          parsedMessage = JSON.parse(messageContentString);
          const { playlistId, targetEmail } = parsedMessage;

          if (!playlistId || !targetEmail) {
            throw new Error(
              'Pesan tidak valid: playlistId atau targetEmail tidak ditemukan dalam pesan.'
            );
          }

          const playlistData = await playlistsService.getPlaylistWithSongs(
            playlistId
          );

          const exportJson = {
            playlist: {
              id: playlistData.id,
              name: playlistData.name,
              songs: playlistData.songs,
            },
          };

          const jsonContentString = JSON.stringify(exportJson, null, 2);

          await mailSender.sendEmail(
            targetEmail,
            playlistData.name,
            jsonContentString
          );

          channel.ack(message);
          console.log(
            `[Consumer] Pesan untuk playlist ${playlistId} berhasil diproses dan email dikirim.`
          );
        } catch (error) {
          console.error(
            `[Consumer] Gagal memproses pesan "${messageContentString}": ${error.message}`
          );
          if (error instanceof NotFoundError) {
            console.warn(
              `[Consumer] Playlist tidak ditemukan untuk pesan, pesan di-acknowledge.`
            );
          } else if (error.message.startsWith('Gagal mengirim email')) {
            console.warn(
              `[Consumer] Gagal mengirim email, pesan di-acknowledge untuk menghindari loop.`
            );
          } else {
            console.warn(
              `[Consumer] Terjadi error tidak terduga, pesan di-acknowledge.`
            );
          }
          channel.ack(message);
        }
      },
      { noAck: false }
    );
  } catch (error) {
    console.error(
      `[Consumer] Gagal memulai atau terjadi error kritis pada consumer: ${error.message}`
    );
    if (rabbitMqConnection) {
      try {
        await rabbitMqConnection.close();
      } catch (closeError) {
        console.error('[Consumer] Gagal menutup koneksi RabbitMQ:', closeError);
      }
    }
    if (dbPool) {
      try {
        await dbPool.end();
      } catch (dbCloseError) {
        console.error('[Consumer] Gagal menutup koneksi DB:', dbCloseError);
      }
    }
    process.exit(1);
  }
};

initConsumer();
