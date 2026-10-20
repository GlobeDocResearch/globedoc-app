/** Public entry pages contain only fixed site text, so full-page machine translation is allowed there. */
const PUBLIC_ENTRY_PATHS = new Set([
  "/", "/signin", "/patient", "/pro", "/login", "/signup", "/signup-pro", "/signin-pro",
  "/verify-email", "/verified", "/verified-pro", "/confirm-email-pro", "/reset-password", "/legal", "/launch",
]);

export function isPublicEntryPath(pathname: string): boolean {
  const p = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return PUBLIC_ENTRY_PATHS.has(p);
}

/** Languages served from built-in dictionaries; others use machine translation. */
export function usesMachineTranslation(langCode: string): boolean {
  return langCode !== "en" && langCode !== "sv";
}
