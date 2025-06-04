const fs = require('fs');
const path = require('path');

class StorageService {
  constructor(folder) {
    this._folder = folder;

    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }
  }

  writeFile(fileStream, meta) {
    return new Promise((resolve, reject) => {
      const filename = +new Date() + meta.filename;
      const filePath = path.resolve(this._folder, filename);
      const writeStream = fs.createWriteStream(filePath);

      writeStream.on('finish', () => resolve(filename));
      writeStream.on('error', (error) => reject(error));
      fileStream.pipe(writeStream);
    });
  }

  deleteFile(filename) {
    return new Promise((resolve, reject) => {
      const filePath = path.resolve(this._folder, filename);
      fs.unlink(filePath, (error) => {
        if (error) {
          if (error.code === 'ENOENT') {
            console.warn(
              `[StorageService] File ${filename} tidak ditemukan saat mencoba menghapus.`
            );
            return resolve();
          }
          return reject(error);
        }
        resolve();
      });
    });
  }
}

module.exports = StorageService;
