const { Client } = require('minio');

class StorageService {
  constructor() {
    this._client = new Client({
      endPoint: process.env.MINIO_ENDPOINT,
      port: parseInt(process.env.MINIO_PORT, 10),
      useSSL: process.env.MINIO_USESSL === 'true',
      accessKey: process.env.MINIO_ACCESSKEY,
      secretKey: process.env.MINIO_SECRETKEY,
    });
    this._bucketName = process.env.MINIO_BUCKETNAME;

    this._client.bucketExists(this._bucketName, (err, exists) => {
      if (err) {
        console.error('Gagal memeriksa bucket:', err);
        return;
      }
      if (!exists) {
        this._client.makeBucket(this._bucketName, 'us-east-1', (makeErr) => {
          if (makeErr) {
            console.error('Gagal membuat bucket:', makeErr);
          } else {
            console.log(`Bucket ${this._bucketName} berhasil dibuat.`);
            const policy = JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Principal: { AWS: ['*'] },
                  Action: ['s3:GetObject'],
                  Resource: [`arn:aws:s3:::${this._bucketName}/*`],
                },
              ],
            });
            this._client.setBucketPolicy(
              this._bucketName,
              policy,
              (policyErr) => {
                if (policyErr) {
                  console.error('Gagal mengatur policy bucket:', policyErr);
                }
              }
            );
          }
        });
      }
    });
  }

  writeFile(fileStream, meta) {
    return new Promise((resolve, reject) => {
      const extension = meta.filename.split('.').pop();
      const filename = `${+new Date()}.${extension}`;

      this._client.putObject(
        this._bucketName,
        filename,
        fileStream,
        meta.headers['content-length'],
        meta.headers['content-type'],
        (err) => {
          if (err) {
            return reject(err);
          }
          const publicUrl = `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}/${this._bucketName}/${filename}`;
          resolve(publicUrl);
        }
      );
    });
  }

  deleteFile(filename) {
    return new Promise((resolve, reject) => {
      this._client.removeObject(this._bucketName, filename, (err) => {
        if (err) {
          if (err.code === 'NoSuchKey') {
            console.warn(
              `[StorageService] File ${filename} tidak ditemukan saat mencoba menghapus.`
            );
            return resolve();
          }
          return reject(err);
        }
        resolve();
      });
    });
  }
}

module.exports = StorageService;
