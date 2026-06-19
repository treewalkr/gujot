import { app } from "./index";

// Only this entrypoint boots a listening server. The frontend imports
// `type App` (erased at build), so importing the app module never starts a
// listener inside the Node frontend process.
//
// BACKEND_PORT is the validated value from the env plugin's decorator
// (fail-fast: invalid/missing config throws at app construction, before this
// line runs). The plugin's decorator is named `env`, which collides with
// Elysia's built-in instance method, so read it from the decorator store.
const port = app.decorator.env.BACKEND_PORT;
app.listen(port);

console.log(`🦊 backend listening on http://localhost:${port}`);
