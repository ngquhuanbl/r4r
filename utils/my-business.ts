import { Tables } from "@/types/database";

export function getPlatformFieldName(platformId: Tables<"platforms">["id"]) {
  return `platform-url-${platformId}`;
}

export namespace FieldNames {
  export function forBusinessName() {
    return "business-name";
  }
  export function forAddress() {
    return "street-address";
  }
  export function forCity() {
    return "city";
  }
  export function forState() {
    return "state";
  }
  export function forZipCode() {
    return "postal-code";
  }
  export function forPhone() {
    return "phone";
  }
  export function forSinglePlatformURL(platformId?: Tables<"platforms">["id"]) {
    return `platform-url-${platformId}`;
  }
  export function forPlatformUrls() {
    return "platform-urls";
  }
}
