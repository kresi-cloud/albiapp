import { randomBytes } from "node:crypto";

/**
 * A meghívó tokenje. Elég hosszú ahhoz, hogy ne lehessen kitalálni, és
 * URL-be írható, mert linkként megy ki.
 */
export function meghivoToken(): string {
  return randomBytes(24).toString("base64url");
}
