// src/types/UserProfile.ts
// ---------------------------------------------------------------------------
// Minimal interface that matches the fields your UI actually touches.
// You can expand it later if you need more columns from the GraphQL model.
// ---------------------------------------------------------------------------

export interface UserProfile {
  /** Primary key of the UserProfile table (you use the username/email) */
  id: string;

  /** Cognito username / e-mail */
  username: string;

  /** RBAC role used by withRole → 'admin' | 'owner' | 'cleaner' */
  role: 'admin' | 'owner' | 'cleaner';

  /** Subscription flag your schema tracks */
  hasPaid: boolean;

  /** Cognito sub (populated by @auth owner rule) – optional for the UI */
  owner?: string;
}
