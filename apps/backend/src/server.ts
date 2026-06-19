import { app } from "./index";

// Only this entrypoint boots a listening server. The frontend imports
// `type App` (erased at build), so importing the app module never starts a
// listener inside the Node frontend process.
const port = Number(process.env.BACKEND_PORT ?? 3000);
app.listen(port);

console.log(`🦊 backend listening on http://localhost:${port}`);
