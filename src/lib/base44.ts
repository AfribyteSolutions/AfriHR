import { createClient } from "@base44/sdk";

export const base44 = createClient({
  appId: "6aa2c086b488d732777073e1",
  options: {
    onError: (error) => console.error("Base44 request failed", error),
  },
});
