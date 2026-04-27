export function isReadOnly(): boolean {
  return process.env.NEXT_PUBLIC_READONLY === "true";
}
