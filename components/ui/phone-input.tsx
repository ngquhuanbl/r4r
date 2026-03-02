"use client";

import * as React from "react";
import PhoneInputLib from "react-phone-number-input";
import type { Value } from "react-phone-number-input";

import { cn } from "@/lib/utils";

type PhoneInputProps = {
  name?: string;
  value?: Value;
  defaultValue?: Value | string;
  onChange?: (value: Value | undefined) => void;
  defaultCountry?: "US" | "GB" | "CA" | "AU" | string;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
};

/**
 * Phone input with country selector and E.164 formatting.
 * Renders a hidden input with the given name so form submission (FormData) receives the value.
 */
function PhoneInput({
  name,
  value: controlledValue,
  defaultValue,
  onChange,
  defaultCountry = "US",
  className,
  disabled,
  placeholder = "Enter phone number",
}: PhoneInputProps) {
  const [internalValue, setInternalValue] = React.useState<Value | undefined>(
    () => (controlledValue ?? (defaultValue as Value) ?? undefined)
  );
  const value = controlledValue !== undefined ? controlledValue : internalValue;

  const handleChange = (v: Value | undefined) => {
    setInternalValue(v);
    onChange?.(v);
  };

  return (
    <div className={cn("PhoneInputWrapper", className)}>
      <PhoneInputLib
        international
        defaultCountry={defaultCountry as "US"}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        placeholder={placeholder}
        numberInputProps={{
          className: cn(
            "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors",
            "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
          ),
        }}
        countrySelectProps={{
          className:
            "flex h-9 rounded-md border border-input bg-transparent px-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        }}
      />
      {name && (
        <input
          type="hidden"
          name={name}
          value={value ?? ""}
          readOnly
        />
      )}
    </div>
  );
}

export { PhoneInput };
export type { Value as PhoneValue };
