import { Hono } from "hono";
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { encode, decode } from "./security";

const prisma = new PrismaClient();
const app = new Hono();

app.get("/", (c) => c.text("Hello World Today!"));

app.get("/profile", async (c) => {
    try {
        const profiles = await prisma.profile.findMany({
            select: {
                id: true,
                username: true,
                mobile: true,
                cardId: true,
                status: true,
                createdAt: true,
            },
        });
        return c.json({
            message: "get data completed",
            data: profiles
        }, 200);
    } catch (err) {
        console.error("Error fetching profiles:", err);
        return c.json({ message: "Failed to retrieve profiles" }, 500);
    }
});

app.post("/profile", async (c) => {
    try {
        const body = await c.req.json();
        
        // **ปรับปรุง: Hash ข้อมูลที่ละเอียดอ่อนทั้งหมดด้วย bcrypt เพื่อความปลอดภัยสูงสุด**
        const passwordHash = await bcrypt.hash(body.password, 13);
        const mobileHash = await bcrypt.hash(body.mobile, 13);
        const cardIdHash = await bcrypt.hash(body.cardId, 13);

        const newProfile = {
            ...body,
            password: passwordHash,
            mobile: mobileHash,
            cardId: cardIdHash,
            status: false,
        };

        const result = await prisma.profile.create({
            data: newProfile
        });

        // ลบ password ก่อนส่ง response
        delete result.password;
        console.log('create profile completed', result);

        return c.json({
            message: "create profile completed",
            data: result
        });
    } catch (err) {
        console.error("Error creating profile:", err);
        // การจัดการข้อผิดพลาดที่ดีขึ้นสำหรับ unique constraint errors
        return c.json({ 
            message: "Failed to create profile. Please recheck username, mobile, or cardId." 
        }, 409); // 409 Conflict for unique constraint
    }
});

app.get("/profile/:id", async (c) => {
    try {
        const id = c.req.param('id');
        const profile = await prisma.profile.findFirstOrThrow({
            where: { id: id },
            select: {
                id: true,
                username: true,
                mobile: true,
                cardId: true,
                status: true,
                createdAt: true,
            },
        });
        return c.json({
            message: "get data completed",
            data: profile
        }, 200);
    } catch (err) {
        console.error("Error fetching profile:", err);
        return c.json({ message: "Profile not found" }, 404);
    }
});

app.post("/login", async (c) => {
    try {
        const body = await c.req.json();
        
        const user = await prisma.profile.findUnique({
            where: { username: body.username },
            select: { password: true },
        });

        if (!user) {
            return c.json({ message: "Login failed: Invalid username or password" }, 401);
        }

        // **ปรับปรุง: แก้ไข logic การเปรียบเทียบรหัสผ่านให้ถูกต้อง**
        const isMatch = await bcrypt.compare(body.password, user.password);

        if (isMatch) {
            return c.json({ message: "Login successful", data: true });
        } else {
            return c.json({ message: "Login failed: Invalid username or password" }, 401);
        }
    } catch (err) {
        console.error("Error during login:", err);
        return c.json({ message: "An error occurred during login" }, 500);
    }
});

app.post("/encode", async (c) => {
  try {
    const body = await c.req.json();
    const { username, password, mobile, cardId } = body;

    const passwordHash = await bcrypt.hash(password, 13);
    const encryptedMobile = encode(mobile);
    const encryptedCardId = encode(cardId);

    const result = await prisma.profile.create({
      data: {
        username,
        password: passwordHash,
        mobile: encryptedMobile,
        cardId: encryptedCardId,
        status: true,
      },
    });

    delete result.password;

    return c.json({ message: "encode completed", data: result }, 201);
  } catch (err) {
    console.error("Error during encode:", err);
    return c.json({ message: "Encoding failed", error: err.message }, 500);
  }
});

app.get("/decode/:id", async (c) => {
  try {
    const id = c.req.param("id");

    const profile = await prisma.profile.findUniqueOrThrow({
      where: { id },
    });

    const decryptedMobile = decode(profile.mobile);
    const decryptedCardId = decode(profile.cardId);

    return c.json({
      message: "decode completed",
      data: {
        ...profile,
        mobile: decryptedMobile,
        cardId: decryptedCardId,
      },
    });
  } catch (err) {
    console.error("Decode failed:", err);
    return c.json({ message: "Decode failed", error: err.message }, 500);
  }
});


export default app;