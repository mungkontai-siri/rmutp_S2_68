import * as crypto from "crypto";
import * as dotenv from "dotenv";
dotenv.config();

// ใช้ AES-256-CBC ซึ่งต้องใช้ key 32 bytes และ iv 16 bytes
const algorithm = "aes-256-cbc";
const key = Buffer.from(process.env.SECURITY_KEY!, "hex");
const iv = Buffer.from(process.env.SECURITY_IV!, "hex");

export const encode = (text: string): string => {
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf-8"), cipher.final()]);
  return encrypted.toString("base64"); 
};

export const decode = (encrypted: string): string => {
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encrypted, "base64")),
    decipher.final()
  ]);
  return decrypted.toString("utf-8");
};

export default { encode, decode };