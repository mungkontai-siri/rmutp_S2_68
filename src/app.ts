import { Hono } from "hono";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const app = new Hono();

app.get("/", (c) => c.text("Hello World Today!"));

app.get("/profile", async (c) => {
  const profiles = await prisma.profile.findMany();
  return c.json({
    message: "get data completed",
    data: profiles
  }, 200);
});

app.get("/profile/:id", async (c) => {
  const id = c.req.param("id");
  const profile = await prisma.profile.findUnique({ where: { id } });

  if (!profile) {
    return c.json({ message: "Profile not found" }, 404);
  }

  return c.json({
    message: "Profile detail",
    data: profile
  }, 200);
});

app.post("/profile", async (c) => {
  const body = await c.req.json();

  if (!body.username || !body.password) {
    return c.json({ message: "Missing required fields" }, 400);
  }

  const newProfile = await prisma.profile.create({ data: body });

  return c.json({
    message: "Profile created",
    data: newProfile
  }, 201);
});

export default app;
