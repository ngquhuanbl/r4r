"use client";

/**
 * Google Places address search is temporarily commented out.
 * To restore: uncomment the block at the bottom of this file, re-add the
 * imports and hooks from that block, and wire props from CreateBusinessDialog
 * (manualMode, addressSearch, placesDisabled, dialogOpen, etc.).
 */

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  onFieldsChange: (next: Partial<AddressFields>) => void;
};

export function AddressSection({
  fields,
  onFieldsChange,
}: AddressSectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-medium leading-none">Location</h3>
        <p className="text-xs text-muted-foreground mt-1">
          US address required. Enter your street, city, state, and ZIP below.
        </p>
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="street-address">Line 1 (street) <span className="text-destructive">*</span></Label>
          <Input
            required
            id="street-address"
            value={fields.street}
            onChange={(e) => onFieldsChange({ street: e.target.value })}
            placeholder="House number and street"
            className="text-sm "
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="address-line2">Line 2 (suite / unit)</Label>
          <Input
            id="address-line2"
            value={fields.line2}
            onChange={(e) => onFieldsChange({ line2: e.target.value })}
            placeholder="Optional"
            className="text-sm "
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="city">City <span className="text-destructive">*</span></Label>
            <Input
              id="city"
              required
              value={fields.city}
              onChange={(e) => onFieldsChange({ city: e.target.value })}
              className="text-sm "
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="state">State <span className="text-destructive">*</span></Label>
            <Input
              id="state"
              value={fields.state}
              required
              onChange={(e) => onFieldsChange({ state: e.target.value })}
              placeholder="CA"
              maxLength={2}
              className={cn("text-sm  uppercase")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="postal-code">ZIP <span className="text-destructive">*</span></Label>
            <Input
              id="postal-code"
              value={fields.zip}
              required
              onChange={(e) => onFieldsChange({ zip: e.target.value })}
              className="text-sm "
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/*
 * --- Previously: Google Places search + manual toggle (restore when re-enabling) ---
 *
 * import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
 * import { useCallback, useEffect, useRef } from "react";
 * import { Button } from "@/components/ui/button";
 * import { parseAddressComponents } from "@/lib/places/parse-place-address";
 *
 * type AddressSectionProps = {
 *   manualMode: boolean;
 *   onManualModeChange: (manual: boolean) => void;
 *   addressSearch: string;
 *   onAddressSearchChange: (v: string) => void;
 *   fields: AddressFields;
 *   onFieldsChange: (next: Partial<AddressFields>) => void;
 *   placesDisabled: boolean;
 *   dialogOpen: boolean;
 * };
 *
 * // useEffect attached google.maps.places.Autocomplete to #address-search when
 * // dialogOpen && !manualMode && !placesDisabled && NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
 *
 * // UI: toggle "Enter address manually" / "Search for address instead", optional
 * // search Input ref={searchInputRef}, then the same manual fields as above.
 */
