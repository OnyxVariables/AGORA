function parseBooleanEnv(value) {
  if (typeof value !== "string") {
    return false;
  }

  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

export const AUTH_DISABLED = parseBooleanEnv(import.meta.env.VITE_DISABLE_AUTH);

const ADMIN_PATH_PREFIXES = [
  "/crudvotations",
  "/crudparties",
  "/metrics",
  "/admin/monitor",
];

const CITIZEN_PATH_PREFIXES = [
  "/home",
  "/perfil",
  "/votar",
  "/resultados",
];

function matchesPrefix(pathname, prefixes) {
  const normalizedPath = (pathname || "/").toLowerCase();

  return prefixes.some((prefix) => normalizedPath.startsWith(prefix));
}

export function resolveRoleFromPathname(pathname) {
  if (matchesPrefix(pathname, ADMIN_PATH_PREFIXES)) {
    return 1;
  }

  if (matchesPrefix(pathname, CITIZEN_PATH_PREFIXES)) {
    return 2;
  }

  return null;
}
