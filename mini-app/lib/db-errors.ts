export function isMissingDatabaseRelationError(
  error: unknown,
  relationNames: string[],
) {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: string; message?: string };
  if (candidate.code !== "42P01") return false;
  const message = candidate.message ?? "";
  return relationNames.some((name) =>
    new RegExp(`relation ["']?${name}["']? does not exist`, "i").test(message),
  );
}

