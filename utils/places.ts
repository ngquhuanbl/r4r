/**
 * Parses Google Places `address_components` into US-style fields.
 */
export function parseAddressComponents(
  components: google.maps.GeocoderAddressComponent[] | undefined,
): {
  line1: string;
  line2: string;
  city: string;
  state: string;
  zip: string;
} {
  let streetNumber = "";
  let route = "";
  let subpremise = "";
  let city = "";
  let state = "";
  let zip = "";

  for (const comp of components ?? []) {
    const types = comp.types;
    if (types.includes("street_number")) streetNumber = comp.long_name;
    if (types.includes("route")) route = comp.long_name;
    if (types.includes("subpremise")) subpremise = comp.long_name;
    if (types.includes("locality")) city = comp.long_name;
    if (types.includes("administrative_area_level_1")) {
      state = comp.short_name;
    }
    if (types.includes("postal_code")) zip = comp.long_name;
  }

  const line1 = [streetNumber, route].filter(Boolean).join(" ").trim();
  return { line1, line2: subpremise, city, state, zip };
}
