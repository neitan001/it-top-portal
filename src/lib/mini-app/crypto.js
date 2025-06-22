const crypto = require('crypto');

const SECRET_KEY = process.env.MINI_APP_CRYPTO_SECRET_KEY;

if (SECRET_KEY.length !== 32) {
    throw new Error("CRYPTO_SECRET_KEY must be exactly 32 bytes long");
}

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

function encryptPassword(text) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(SECRET_KEY), iv);
    const encrypted = Buffer.concat([
        cipher.update(text, 'utf8'),
        cipher.final()
    ]);
    return Buffer.concat([iv, encrypted]).toString('base64');
}

function decryptPassword(encryptedText) {
    const buffer = Buffer.from(encryptedText, 'base64');
    const iv = buffer.subarray(0, IV_LENGTH);
    const encrypted = buffer.subarray(IV_LENGTH);
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(SECRET_KEY), iv);
    const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
    ]);
    return decrypted.toString('utf8');
}

module.exports = { encryptPassword, decryptPassword };