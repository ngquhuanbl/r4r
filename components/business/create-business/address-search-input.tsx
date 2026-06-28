"use client";

import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { useEffect, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AddressValue } from "@/types/address";

type AddressSearchInputProps = {
  onAddressSelect: (value: AddressValue) => void;
};

export function AddressSearchInput({ onAddressSelect }: AddressSearchInputProps) {
  /** Input used by Google Places autocomplete when search mode is enabled. */
  const searchInputRef = useRef<HTMLInputElement>(null);
  /** Active Places listener so we can reliably unsubscribe on mode changes. */
  const listenerRef = useRef<google.maps.MapsEventListener | null>(null);
  /** Search input text for Google Places autocomplete mode. */
  const [addressSearchValue, setAddressSearchValue] = useState("");

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!key || !searchInputRef.current) return;

    let cancelled = false;

    (async () => {
      try {
        setOptions({ key, v: "weekly" });
        await importLibrary("places");
        if (cancelled || !searchInputRef.current) return;

        const input = searchInputRef.current;
        const ac = new google.maps.places.Autocomplete(input, {
          componentRestrictions: { country: "us" },
          fields: ["address_components", "formatted_address"],
        });
        listenerRef.current = ac.addListener("place_changed", () => {
          const place = ac.getPlace();
          if (!place.address_components?.length) return;
          let streetNumber = "";
          let route = "";
          let subpremise = "";
          let city = "";
          let state = "";
          let zip = "";

          for (const component of place.address_components) {
            const types = component.types;
            if (types.includes("street_number")) streetNumber = component.long_name;
            if (types.includes("route")) route = component.long_name;
            if (types.includes("subpremise")) subpremise = component.long_name;
            if (types.includes("locality")) city = component.long_name;
            if (types.includes("administrative_area_level_1")) {
              state = component.short_name;
            }
            if (types.includes("postal_code")) zip = component.long_name;
          }

          onAddressSelect({
            line1: [streetNumber, route].filter(Boolean).join(" ").trim(),
            line2: subpremise,
            city,
            state,
            zip,
          });
          if (place.formatted_address) {
            setAddressSearchValue(place.formatted_address);
          }
        });
      } catch {
        /* Places failed — user can use manual mode */
      }
    })();

    return () => {
      cancelled = true;
      if (
        listenerRef.current &&
        typeof window !== "undefined" &&
        window.google?.maps?.event
      ) {
        google.maps.event.removeListener(listenerRef.current);
        listenerRef.current = null;
      }
    };
  }, [onAddressSelect]);

  return (
    <div className="space-y-1.5">
      <Label htmlFor="address-search">Search for address</Label>
      <Input
        ref={searchInputRef}
        id="address-search"
        value={addressSearchValue}
        onChange={(e) => setAddressSearchValue(e.target.value)}
        placeholder="Start typing your street address…"
        autoComplete="off"
        className="text-sm"
      />
    </div>
  );
}
