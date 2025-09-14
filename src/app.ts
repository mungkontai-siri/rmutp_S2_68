import { Hono } from "hono";
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";
import crypto from "crypto";

const prisma = new PrismaClient();
const app = new Hono();

// 🔐 เพิ่มฟังก์ชันเข้ารหัส/ถอดรหัสในไฟล์เดียว
const algorithm = 'aes-256-cbc';
const secretKey = crypto
  .createHash('sha256')
  .update("my-super-secret-key") // 👉 ปรับเป็น key ที่ปลอดภัย
  .digest('base64')
  .substr(0, 32);
const iv = Buffer.alloc(16, 0); // ใช้ IV แบบคงที่ (เพื่อความง่าย)

function encrypt(text: string): string {
  const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function decrypt(encryptedText: string): string {
  const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

app.get("/", (c) => c.text("Hello World Today!"));

// ✅ GET /profile (ถอดรหัส mobile, cardId)
app.get("/profile", async (c) => {
  const profiles = await prisma.profile.findMany();

  profiles.forEach(data => {
    delete data.password;
    try {
      data.mobile = decrypt(data.mobile);
      data.cardId = decrypt(data.cardId);
    } catch (e) {
      console.log("decrypt failed", e);
    }
  });

  return c.json({
    message: "get data completed",
    data: profiles
  }, 200);
});

// ✅ POST /profile (เข้ารหัสก่อนบันทึก)
app.post("/profile", async (c) => {
  const body = await c.req.json();

  // hash password
  const passwordHash = await bcrypt.hash(body.password, 13);
  body.password = passwordHash;

  // encrypt mobile & cardId
  body.mobile = encrypt(body.mobile);
  body.cardId = encrypt(body.cardId);

  body.status = false;

  const result = await prisma.profile.create({ data: body })
    .then(data => {
      delete data.password;
      data.mobile = decrypt(data.mobile);
      data.cardId = decrypt(data.cardId);
      return data;
    })
    .catch(err => {
      console.log("create profile failed", err);
      return "please recheck username, mobile or cardId";
    });

  return c.json({
    message: "create profile completed",
    data: result
  });
});

// ✅ GET /profile/:id (ถอดรหัสก่อนแสดง)
app.get("/profile/:id", async (c) => {
  const id = c.req.param('id');
  const profile = await prisma.profile.findFirstOrThrow({ where: { id } });

  delete profile.password;

  try {
    profile.mobile = decrypt(profile.mobile);
    profile.cardId = decrypt(profile.cardId);
  } catch (e) {
    console.log("decrypt failed", e);
  }

  return c.json({
    message: "get data completed",
    data: profile
  }, 200);
});

// ✅ POST /login
app.post("/login", async (c) => {
  const body = await c.req.json();

  const user = await prisma.profile.findUnique({
    select: { password: true },
    where: { username: body.username }
  });

  const isMatch = await bcrypt.compare(body.password, user?.password ?? "");

  return c.json({
    message: "login completed",
    data: isMatch
  });
});

export default app;
