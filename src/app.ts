import { Hono } from "hono";
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";
import crypto from "crypto"; // ใช้โมดูล crypto แทน md5-typescript

const prisma = new PrismaClient();
const app = new Hono();

// ฟังก์ชันเข้ารหัสแบบ one-way hash ด้วย SHA-256
const hashData = (data) => crypto.createHash('sha256').update(data).digest('hex');

app.get("/", (c) => c.text("Hello World Today!"));

// --- GET All Profiles ---
app.get("/profile", async (c) => {
  const profiles = await prisma.profile.findMany({
    select: {
      id: true,
      username: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return c.json({
    message: "get data completed",
    data: profiles
  }, 200);
});

// --- Create New Profile ---
app.post("/profile", async (c) => {
  try {
    const body = await c.req.json();
    if (!body.username || !body.password || !body.mobile || !body.cardId) {
      return c.json({ message: "Missing required fields" }, 400);
    }
    
    // เข้ารหัสข้อมูลที่ละเอียดอ่อนก่อนบันทึก
    const passwordHash = await bcrypt.hash(body.password, 13);
    const mobileHash = hashData(body.mobile); // ใช้ SHA-256 แทน MD5
    const cardIdHash = hashData(body.cardId); // ใช้ SHA-256 แทน MD5

    const result = await prisma.profile.create({
      data: {
        ...body,
        password: passwordHash,
        mobile: mobileHash,
        cardId: cardIdHash,
        status: false,
      },
      select: {
        id: true,
        username: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return c.json({
      message: "create profile completed",
      data: result,
    }, 201);
  } catch (err) {
    console.error(`Create profile failed: `, err);
    return c.json({ message: "Failed to create profile. The username, mobile, or cardId may already exist." }, 409);
  }
});

// --- GET Profile by ID ---
app.get("/profile/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const profile = await prisma.profile.findUnique({
      where: { id: id },
      select: {
        id: true,
        username: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!profile) {
      return c.json({ message: "Profile not found" }, 404);
    }
    return c.json({
      message: "get data completed",
      data: profile,
    }, 200);
  } catch (err) {
    console.error(`Get profile failed: `, err);
    return c.json({ message: "Error fetching profile" }, 500);
  }
});

// --- User Login ---
app.post("/login", async (c) => {
  const { username, password } = await c.req.json();
  if (!username || !password) {
    return c.json({ message: "Username and password are required" }, 400);
  }
  const user = await prisma.profile.findUnique({
    where: { username },
    select: { password: true, id: true },
  });
  if (!user) {
    return c.json({ message: "Invalid username or password" }, 401);
  }
  
  // เปรียบเทียบรหัสผ่านที่ป้อนเข้ามากับรหัสผ่านที่ถูก hash ไว้ในฐานข้อมูล
  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return c.json({ message: "Invalid username or password" }, 401);
  }
  return c.json({
    message: "Login successful",
    data: { userId: user.id },
  });
});

export default app;