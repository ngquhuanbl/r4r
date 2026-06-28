"use client";

import { useCallback, useState } from "react";

import { AddressSearchInput } from "@/components/business/create-business/address-search-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { AddressValue } from "@/types/address";

type AddressSectionProps = {
  fields: AddressValue;
  onFieldsChange: (_next: Partial<AddressValue>) => void;
};

export function AddressFields({ fields, onFieldsChange }: AddressSectionProps) {
  //
  // PROPS
  //

  //
  // STATE
  //
  /** Toggles between manual address form and Places search mode. */
  const [manualModeEnabled, setManualModeEnabled] = useState(true);

  const addressSearchEnabled =
    process.env.NEXT_PUBLIC_ADDRESS_SEARCH_ENABLED?.toLowerCase() === "true";
  const isMissingAPIKeys = !process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const isAddressSearchFeatureAvailable =
    !isMissingAPIKeys && addressSearchEnabled;

  const shouldShowSearch =
    !manualModeEnabled && isAddressSearchFeatureAvailable;

  //
  // EVENTS
  //
  /** Applies parsed address components into parent-managed address fields. */
  const onAddressSelect = useCallback((parsed: AddressValue) => {
    onFieldsChange({
      line1: parsed.line1,
      line2: parsed.line2,
      city: parsed.city,
      state: parsed.state,
      zip: parsed.zip,
    });
  }, [onFieldsChange]);

  /** Toggle between manual and address search mode. */
  const onToggleAddressMode = useCallback(() => {
    setManualModeEnabled((prev) => !prev);
  }, []);

  //
  // RENDER
  //
  const sectionDescription = addressSearchEnabled
    ? " Search or enter manually."
    : " Enter your address below.";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-medium leading-none">Location</h3>
          <p className="text-xs text-muted-foreground mt-1">
            US address required.
            {sectionDescription}
          </p>
        </div>
        {isAddressSearchFeatureAvailable ? (
          <Button
            type="button"
            variant="link"
            className="h-auto p-0 text-xs"
            onClick={onToggleAddressMode}
          >
            {manualModeEnabled
              ? "Search for address instead"
              : "Enter address manually"}
          </Button>
        ) : null}
      </div>

      {shouldShowSearch ? (
        <AddressSearchInput onAddressSelect={onAddressSelect} />
      ) : null}

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="street-address">
            Line 1 (street) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="street-address"
            value={fields.line1}
            onChange={(e) => onFieldsChange({ line1: e.target.value })}
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
