import type { License } from "@/types/database";

export function isLifetimeLicense(license: License | null) {
  return license?.status === "lifetime" || license?.expires_at === null;
}

export function isLicenseActive(license: License | null) {
  if (!license) return false;
  if (isLifetimeLicense(license)) return true;
  if (!license.expires_at) return false;
  return ["active", "trial"].includes(license.status) && new Date(license.expires_at).getTime() > Date.now();
}

export function getLicenseLabel(license: License | null, isAdmin: boolean) {
  if (isAdmin) return "Admin ilimitado";
  if (!license) return "Sem licenca";
  if (isLifetimeLicense(license)) return "Vitalicia";
  if (license.status === "trial") return "Trial ativo";
  if (license.status === "active") return "Premium ativo";
  if (license.status === "expired") return "Expirada";
  return "Bloqueada";
}
