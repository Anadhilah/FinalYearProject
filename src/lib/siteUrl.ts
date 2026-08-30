/**
 * Absolute base URL used to build shareable links (supervisor activation links,
 * shared logbook links, email confirmation redirects).
 *
 * Prefers the deployed site URL set as VITE_SITE_URL (see .env), and falls
 * back to the current window origin so local development keeps working.
 */
export const SITE_URL: string = resolveSiteUrl();

function resolveSiteUrl(): string {
  const configured = import.meta.env.VITE_SITE_URL as string | undefined;
  if (configured && typeof configured === "string" && configured.trim() !== "") {
    return configured.trim().replace(/\/+$/, "");
  }
  return window.location.origin;
}