import { app } from "./index";

// Only this entrypoint boots a listening server. The frontend imports
// `type App` (erased at build), so importing the app module never starts a
// listener inside the Node frontend process.
//
// Read the port straight from process.env at boot: this is the app-construction
// path, where a typed decorator would just be reaching into the env plugin's
// internals. Route handlers still get the type-safe, validated env via the
// plugin's decorator (see env.ts); this is the one place we read the raw value.
const port = Number(process.env.BACKEND_PORT ?? 3000);
app.listen(port);

console.log(`🦊 backend listening on http://localhost:${port}`);
