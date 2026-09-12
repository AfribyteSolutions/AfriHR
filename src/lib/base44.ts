import { createClient } from "@base44/sdk";

export const BASE44_APP_ID = "6aa2c086b488d732777073e1";
export const DEFAULT_TENANT_ID = "6aa2eda8b1df8b8d6312c262";

export const base44 = createClient({
  appId: BASE44_APP_ID,
  options: {
    onError: (error) => console.error("Base44 request failed", error),
  },
});
