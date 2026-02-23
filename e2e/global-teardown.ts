import { cleanupE2eData, deleteE2eUser } from "./cleanup";

export default async function globalTeardown() {
  await cleanupE2eData();
  if (process.env.E2E_RUN_ID) {
    await deleteE2eUser();
  }
}
