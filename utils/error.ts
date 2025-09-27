export namespace ErrorUtils {
  export function isAbortError(e: any) {
    return typeof e === "object" && e.name === "AbortError";
  }
}
