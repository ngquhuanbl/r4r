"use client";

import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseAddressComponents } from "@/utils/places";
import { cn } from "@/lib/utils";

export type AddressFields = {
  street: string;
  line2: string;
  city: string;
  state: string;
  zip: string;
};

type AddressSectionProps = {
  fields: AddressFields;
  onFieldsChange: (_next: Partial<AddressFields>) => void;
};

export function AddressFields({ fields, onFieldsChange }: AddressSectionProps) {
  //
  // PROPS
  //

  //
  // STATE
  //
  /** Search input text for Google Places autocomplete mode. */
  const [addressSearch, setAddressSearch] = useState("");
  /** Toggles between manual address form and Places search mode. */
  const [manualModeEnabled, setManualModeEnabled] = useState(true);

  //
  // REFS
  //
  /** Input used by Google Places autocomplete when search mode is enabled. */
  const searchInputRef = useRef<HTMLInputElement>(null);
  /** Active Places listener so we can reliably unsubscribe on mode/dialog changes. */
  const listenerRef = useRef<google.maps.MapsEventListener | null>(null);

  //
  // EVENTS
  //
  /** Applies parsed address components into parent-managed address fields. */
  const applyParsed = useCallback(
    (parsed: ReturnType<typeof parseAddressComponents>) => {
      onFieldsChange({
        street: parsed.line1,
        line2: parsed.line2,
        city: parsed.city,
        state: parsed.state,
        zip: parsed.zip,
      });
    },
    [onFieldsChange],
  );

  //
  // EFFECTS
  //
  const addressSearchEnabled =
    process.env.NEXT_PUBLIC_ADDRESS_SEARCH_ENABLED?.toLowerCase() === "true";
  const placesDisabled = !process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const addressSearchTemporarilyDisabled = !addressSearchEnabled;

  useEffect(() => {
    if (manualModeEnabled || placesDisabled || addressSearchTemporarilyDisabled) {
      if (
        listenerRef.current &&
        typeof window !== "undefined" &&
        window.google?.maps?.event
      ) {
        google.maps.event.removeListener(listenerRef.current);
        listenerRef.current = null;
      }
      return;
    }

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
          const parsed = parseAddressComponents(place.address_components);
          applyParsed(parsed);
          if (place.formatted_address) {
            setAddressSearch(place.formatted_address);
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
  }, [
    manualModeEnabled,
    placesDisabled,
    addressSearchTemporarilyDisabled,
    applyParsed,
  ]);

  //
  // RENDER
  //
  const showSearch =
    !manualModeEnabled && !placesDisabled && !addressSearchTemporarilyDisabled;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-medium leading-none">Location</h3>
          <p className="text-xs text-muted-foreground mt-1">
            US address required.
            {addressSearchTemporarilyDisabled
              ? " Enter your address below."
              : " Search or enter manually."}
          </p>
        </div>
        {!placesDisabled && !addressSearchTemporarilyDisabled ? (
          <Button
            type="button"
            variant="link"
            className="h-auto p-0 text-xs"
            onClick={() => {
              setManualModeEnabled((prev) => !prev);
              if (!manualModeEnabled) setAddressSearch("");
            }}
          >
            {manualModeEnabled
              ? "Search for address instead"
              : "Enter address manually"}
          </Button>
        ) : null}
      </div>

      {showSearch && (
        <div className="space-y-1.5">
          <Label htmlFor="address-search">Search for address</Label>
          <Input
            ref={searchInputRef}
            id="address-search"
            value={addressSearch}
            onChange={(e) => setAddressSearch(e.target.value)}
            placeholder="Start typing your street address…"
            autoComplete="off"
            className="text-sm"
          />
        </div>
      )}

      {placesDisabled && !addressSearchTemporarilyDisabled && (
        <p className="text-xs text-muted-foreground">
          Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable address search, or fill
          the fields below.
        </p>
      )}

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="street-address">
            Line 1 (street) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="street-address"
            value={fields.street}
            onChange={(e) => onFieldsChange({ street: e.target.value })}
            placeholder="House number and street"
            className="text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="address-line2">Line 2 (suite / unit)</Label>
          <Input
            id="address-line2"
            value={fields.line2}
            onChange={(e) => onFieldsChange({ line2: e.target.value })}
            placeholder="Optional"
            className="text-sm"
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="city">
              City <span className="text-destructive">*</span>
            </Label>
            <Input
              id="city"
              value={fields.city}
              onChange={(e) => onFieldsChange({ city: e.target.value })}
              className="text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="state">
              State <span className="text-destructive">*</span>
            </Label>
            <Input
              id="state"
              value={fields.state}
              onChange={(e) => onFieldsChange({ state: e.target.value })}
              placeholder="CA"
              maxLength={2}
              className={cn("text-sm uppercase")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="postal-code">
              ZIP <span className="text-destructive">*</span>
            </Label>
            <Input
              id="postal-code"
              value={fields.zip}
              onChange={(e) => onFieldsChange({ zip: e.target.value })}
              className="text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
