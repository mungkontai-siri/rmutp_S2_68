import * as crypto from "crypto";

// ใช้ AES-256-CBC ซึ่งต้องใช้ key 32 bytes และ iv 16 bytes
const algorithm = "aes-256-cbc";

const key = Buffer.from(process.env.SECURITY_KEY!, "hex"); // 64 hex chars = 32 bytes
const iv = Buffer.from(process.env.SECURITY_IV!, "hex");   // 32 hex chars = 16 bytes

export const encode = (text: string): string => {
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf-8"), cipher.final()]);
  return encrypted.toString("base64");
};

export const decode = (encrypted: string): string => {
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  const decrypted = Buffer.concat([decipher.update(encrypted, "base64"), decipher.final()]);
  return decrypted.toString("utf-8");
};

export default { encode, decode };