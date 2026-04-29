export namespace ErrorUtils {
  export function isAbortError(e: any) {
    return typeof e === "object" && e.name === "AbortError";
  }
  export function serializeError(e: any) {
    if (typeof e === "string") return e;
    if (e && typeof e === "object") {
      if (typeof e.message === "string" && e.message.trim().length > 0) {
        return e.message;
      }
    }
    return "Unexpected error";
  }
}
