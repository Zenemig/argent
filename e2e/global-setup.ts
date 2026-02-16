import { cleanupE2eData } from "./cleanup";

export default async function globalSetup() {
  await cleanupE2eData();
}
