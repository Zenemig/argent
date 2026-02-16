import { cleanupE2eData } from "./cleanup";

export default async function globalTeardown() {
  await cleanupE2eData();
}
