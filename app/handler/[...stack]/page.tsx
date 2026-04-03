import { StackHandler } from "@stackframe/stack";

/**
 * StackHandler handles the standard authentication UI.
 * By using the 'urls' configuration in lib/stack/client.ts,
 * we redirect users immediately after successful sign-in/sign-up
 * to our custom /auth-callback route which handles role-based redirection.
 */
export default function Handler() {
  return <StackHandler fullPage />;
}
