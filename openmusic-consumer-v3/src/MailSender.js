const nodemailer = require('nodemailer');
const config = require('./utils/config');

class MailSender {
  constructor() {
    this._transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 587,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.password,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  async sendEmail(targetEmail, playlistName, jsonContentString) {
    const mailOptions = {
      from: `OpenMusic API Export <${config.smtp.user}>`,
      to: targetEmail,
      subject: `Ekspor Playlist: ${playlistName}`,
      text: `Halo,\n\nTerlampir adalah data ekspor untuk playlist "${playlistName}" Anda dalam format JSON.\n\nTerima kasih,\nTim OpenMusic`,
      attachments: [
        {
          filename: `playlist_${playlistName.replace(/\s+/g, '_')}.json`,
          content: jsonContentString,
          contentType: 'application/json',
        },
      ],
    };

    try {
      const info = await this._transporter.sendMail(mailOptions);
      console.log(
        `[MailSender] Email ekspor untuk playlist "${playlistName}" berhasil dikirim ke ${targetEmail}. Message ID: ${info.messageId}`
      );
      return info;
    } catch (error) {
      console.error(
        `[MailSender] Gagal mengirim email untuk playlist "${playlistName}" ke ${targetEmail}: ${error.message}`
      );
      throw new Error(`Gagal mengirim email: ${error.message}`);
    }
  }
}

module.exports = MailSender;
