import { Hono } from "hono";

const app = new Hono();

// operation
// CRUD // 

app.get("/", (c) => c.text("Hello World Today!"));
app.get("/profile", (c) => c.text("Profile"));

export default app;
