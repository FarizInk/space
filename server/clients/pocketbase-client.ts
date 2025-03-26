import PocketBase from "pocketbase";
import ENV from "@/env";

export async function PBClient() {
  if (
    !ENV.POCKETBASE_URL ||
    !ENV.POCKETBASE_USERNAME ||
    !ENV.POCKETBASE_PASSWORD
  )
    throw new Error("POCKETBASE_URL is not set");

  const pb = new PocketBase(ENV.POCKETBASE_URL);

  // disable autocancellation so that we can handle async requests from multiple users
  pb.autoCancellation(false);

  // option 1: authenticate as superuser using email/password (could be filled with ENV params)
  await pb
    .collection("_superusers")
    .authWithPassword(ENV.POCKETBASE_USERNAME, ENV.POCKETBASE_PASSWORD, {
      // This will trigger auto refresh or auto reauthentication in case
      // the token has expired or is going to expire in the next 30 minutes.
      autoRefreshThreshold: 30 * 60,
    });

  return pb;
}
