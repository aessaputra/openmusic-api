const amqp = require('amqplib');
const config = require('../../utils/config');

const ProducerService = {
  sendMessage: async (queue, message) => {
    let connection;
    try {
      connection = await amqp.connect(config.rabbitMq.server);
      const channel = await connection.createChannel();

      await channel.assertQueue(queue, {
        durable: true,
      });

      channel.sendToQueue(queue, Buffer.from(message), {
        persistent: true,
      });

      console.log(
        `[ProducerService] Pesan berhasil dikirim ke antrean ${queue}: ${message}`,
      );

      setTimeout(() => {
        if (connection) {
          connection.close();
        }
      }, 500);
    } catch (error) {
      console.error(
        `[ProducerService] Gagal mengirim pesan ke antrean ${queue}: ${error.message}`,
      );
    }
  },
};

module.exports = ProducerService;
