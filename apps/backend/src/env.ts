import { env as createEnv } from "@yolk-oss/elysia-env";
import { t } from "elysia";

export const envPlugin = createEnv({
  BACKEND_PORT: t.Number({ default: 3000 }),
});
