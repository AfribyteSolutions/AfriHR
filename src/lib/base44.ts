import { createClient } from "@base44/sdk";

const client = createClient({
  appId: "6aa2c086b488d732777073e1",
  options: {
    onError: (error) => console.error("Base44 request failed", error),
  },
});

// Compatibility adapter for legacy chunks created before the Firebase-to-Base44
// auth migration. Remove after all published clients use resetPasswordRequest.
type LegacyAuth = typeof client.auth & {
  sendPasswordResetEmail?: (email: string) => Promise<unknown>;
};
const auth = client.auth as LegacyAuth;
auth.sendPasswordResetEmail ??= (email: string) => auth.resetPasswordRequest(email.trim().toLowerCase());

export const base44 = client;
