import { app } from "./index";

const port = Number(process.env.BACKEND_PORT ?? 3000);
app.listen(port);

console.log(`🦊 backend listening on http://localhost:${port}`);
