import { init } from "@instantdb/react";
import schema from "../../instant.schema";

const APP_ID = "7db44818-ed19-4938-be1c-f460ede74350";

export const db = init({
  appId: APP_ID,
  schema,
} as Parameters<typeof init>[0]);
