import { cleanupE2eData, createE2eUser } from "./cleanup";

export default async function globalSetup() {
  if (process.env.E2E_RUN_ID) {
    await createE2eUser();
  }
  // Always run: in CI the user was just created above;
  // locally it uses the persistent E2E_USER_EMAIL from .env.local
  await cleanupE2eData();
}
