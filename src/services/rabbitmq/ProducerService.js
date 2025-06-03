// src/services/rabbitmq/ProducerService.js
const amqp = require('amqplib');
const config = require('../../utils/config'); // Ambil konfigurasi RabbitMQ dari config.js

const ProducerService = {
  sendMessage: async (queue, message) => {
    try {
      const connection = await amqp.connect(config.rabbitMq.server); //
      const channel = await connection.createChannel();

      await channel.assertQueue(queue, {
        durable: true, // Antrean akan tetap ada meskipun RabbitMQ di-restart
      });

      channel.sendToQueue(queue, Buffer.from(message), {
        persistent: true, // Pesan akan tetap ada meskipun RabbitMQ di-restart (jika antrean durable)
      });

      console.log(
        `[ProducerService] Pesan berhasil dikirim ke antrean ${queue}: ${message}`
      );

      // Tutup koneksi setelah beberapa saat untuk memastikan pesan terkirim
      setTimeout(() => {
        connection.close();
      }, 500);
    } catch (error) {
      console.error(
        `[ProducerService] Gagal mengirim pesan ke antrean ${queue}: ${error.message}`
      );
      // Anda bisa melempar error ini agar ditangani lebih lanjut jika diperlukan
      // throw new Error(`Gagal mengirim pesan ke RabbitMQ: ${error.message}`);
      // Namun, untuk API ekspor, mungkin lebih baik log error dan biarkan API utama
      // tetap mengembalikan respons bahwa permintaan sedang diproses,
      // karena kegagalan koneksi ke RabbitMQ adalah masalah infrastruktur.
      // Atau, bisa juga API mengembalikan error 500 jika koneksi ke RabbitMQ gagal.
      // Untuk submisi, biasanya diharapkan API utama tetap memberi tahu bahwa "sedang diproses"
      // dan consumer yang akan menangani jika ada masalah lebih lanjut.
    }
  },
};

module.exports = ProducerService;
