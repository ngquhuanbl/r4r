"use client";

import { ImagePlus, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useId, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type BusinessImageFieldProps = {
  file: File | null;
  previewUrl: string | null;
  onFileChange: (file: File | null) => void;
};

/** Optional storefront image — uploaded with the business create form. */
export function BusinessImageField({
  file,
  previewUrl,
  onFileChange,
}: BusinessImageFieldProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const onPick = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (!f || !f.type.startsWith("image/")) {
        onFileChange(null);
        return;
      }
      onFileChange(f);
      e.target.value = "";
    },
    [onFileChange],
  );

  const onRemove = useCallback(() => {
    onFileChange(null);
  }, [onFileChange]);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const f = e.dataTransfer.files?.[0];
      if (f?.type.startsWith("image/")) onFileChange(f);
    },
    [onFileChange],
  );

  return (
    <div className="space-y-2">
      <Label htmlFor={inputId} className="text-base font-medium leading-none">Photo (optional)</Label>
      <p className="text-xs text-muted-foreground mt-1">
        Add a landscape photo of your storefront to help partners recognize your
        business at a glance. JPEG, PNG, or WebP, up to 5MB.
      </p>
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className={cn(
          "flex min-h-[72px] cursor-pointer flex-wrap items-center gap-3 rounded-md border border-dashed border-input bg-muted/30 px-3 py-2 transition-colors hover:bg-muted/50",
        )}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={onPick}
        />
        {previewUrl ? (
          <>
            <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded border bg-background">
              <Image
                src={previewUrl}
                alt="Business preview"
                fill
                className="object-cover"
                sizes="80px"
                unoptimized
              />
            </div>
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <span className="truncate text-xs text-muted-foreground">
                {file?.name ?? "Image selected"}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="ml-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
              >
                <X className="h-4 w-4" />
                Remove
              </Button>
            </div>
          </>
        ) : (
          <>
            <ImagePlus className="h-8 w-8 shrink-0 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Drag a landscape storefront photo here or click to browse
            </span>
          </>
        )}
      </div>
    </div>
  );
}
