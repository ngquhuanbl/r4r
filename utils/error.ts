export namespace ErrorUtils {
  export function isAbortError(e: any) {
    return typeof e === "object" && e.name === "AbortError";
  }
  export function serializeError(e: any) {
    if (typeof e === "string") return e;
    if (typeof e === "object") return e.message || "Unexpected error";
    return "Unexpected error";
  }
}
