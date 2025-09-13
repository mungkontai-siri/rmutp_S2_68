import { Hono } from "hono";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const app = new Hono();

// operation
// CRUD // 

app.get("/", (c) => c.text("Hello World Today!"));
app.get("/profile", async (c) => {
    //get data from db
    const profiles = await prisma.profile.findMany();
    //response
    return c.json({
        message: "get data completed",
        data: profiles
    }, 200);
});

export default app;
