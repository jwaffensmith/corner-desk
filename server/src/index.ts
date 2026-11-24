import { createApp } from "./app.js";
import { appAuth } from "./auth.js";

if (!appAuth.providers.length) {
  console.warn("No sign-in provider is configured. Set GOOGLE_CLIENT_ID/SECRET or GITHUB_CLIENT_ID/SECRET in .env.");
}

const port = Number(process.env.PORT ?? 4000);
createApp(appAuth).listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
