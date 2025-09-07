import { serve } from "@hono/node-server";
import app from "./app.ts";

serve(app, (info) => {
    console.log(`Running server on port ${info.port}`);
}); //server        
