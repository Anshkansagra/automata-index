// Single-owner app — no admin role in the schema, just a fixed allowlist of
// the owner's own account email(s).
const ADMIN_EMAILS = ["anshkansagra2004@gmail.com"];

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase());
}
