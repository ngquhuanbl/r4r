"use client";

import { Loader2Icon } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";

import { updateBusiness } from "@/app/(protected)/actions/business-actions";
import { ADDRESS_SEARCH_TEMPORARILY_DISABLED } from "@/constants/address-search";
import { useAppSelector } from "@/lib/redux/hooks";
import { platformsSelectors } from "@/lib/redux/slices/platform";
import {
  formatUsPhoneMask,
  isCompleteUsPhone,
  normalizeUsPhoneDigits,
} from "@/lib/phone-us";
import { cn } from "@/lib/utils";
import {
  classifyPlatformUrl,
  normalizePlatformUrlInput,
} from "@/lib/validation/platform-urls";
import { FetchedBusiness } from "@/types/dashboard";
import { ErrorUtils } from "@/utils/error";
import { FieldNames } from "@/utils/my-business";

import {
  AddressSection,
  type AddressFields,
} from "@/components/business/create-business/address-section";
import { BusinessImageField } from "@/components/business/create-business/business-image-field";
import { PlatformUrlRow } from "@/components/business/create-business/platform-url-row";
import { sortPlatformsBySpec } from "@/components/business/create-business/sort-platforms";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

function emptyAddress(): AddressFields {
  return { street: "", line2: "", city: "", state: "", zip: "" };
}

function addressFromBusiness(b: FetchedBusiness): AddressFields {
  return {
    street: b.address ?? "",
    line2: "",
    city: b.city ?? "",
    state: b.state ?? "",
    zip: b.zip_code ?? "",
  };
}

const hasMapsKey = Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);

interface EditBusinessProfileDialogProps {
  open: boolean;
  onOpenChange: (_opened: boolean) => void;
  data: FetchedBusiness;
  onUpdatedData?: (_data: FetchedBusiness) => void;
}

/**
 * Same structure as CreateBusinessProfile (CreateBusinessDialog): identity,
 * address, phone, platform rows with live validation, optional photo — wired
 * to `updateBusiness` + FieldNames used by the server action.
 */
export function EditBusinessProfileDialog({
  open,
  onOpenChange,
  data,
  onUpdatedData,
}: EditBusinessProfileDialogProps) {
  const [isPending, startTransition] = useTransition();
  const platforms = useAppSelector(platformsSelectors.selectData);

  const [businessName, setBusinessName] = useState("");
  const [manualAddress, setManualAddress] = useState(true);
  const [addressSearch, setAddressSearch] = useState("");
  const [addressFields, setAddressFields] =
    useState<AddressFields>(emptyAddress);
  const [phoneDigits, setPhoneDigits] = useState("");
  const [platformUrls, setPlatformUrls] = useState<Record<number, string>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const sortedPlatforms = useMemo(
    () => sortPlatformsBySpec(platforms),
    [platforms],
  );

  useEffect(() => {
    if (!platforms.length) return;
    setPlatformUrls((prev) => {
      const next = { ...prev };
      for (const p of platforms) {
        if (next[p.id] === undefined) next[p.id] = "";
      }
      return next;
    });
  }, [platforms]);

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  useEffect(() => {
    if (!open) return;
    setBusinessName(data.business_name);
    setManualAddress(true);
    setAddressSearch("");
    setAddressFields(addressFromBusiness(data));
    setPhoneDigits(normalizeUsPhoneDigits(data.phone ?? ""));
    setImageFile(null);
    setPreviewUrl(null);
    const next: Record<number, string> = {};
    for (const p of sortedPlatforms) {
      next[p.id] = data.platform_urls[p.id] ?? "";
    }
    setPlatformUrls(next);
  }, [open, data.id, sortedPlatforms]);

  const setField = useCallback((patch: Partial<AddressFields>) => {
    setAddressFields((prev) => ({ ...prev, ...patch }));
  }, []);

  const hasValidPlatform = useMemo(() => {
    return sortedPlatforms.some((p) => {
      const u = platformUrls[p.id] ?? "";
      return classifyPlatformUrl(u, p.name) === "valid";
    });
  }, [sortedPlatforms, platformUrls]);

  const canSubmit = useMemo(() => {
    const a = addressFields;
    return (
      businessName.trim().length > 0 &&
      a.street.trim().length > 0 &&
      a.city.trim().length > 0 &&
      a.state.trim().length > 0 &&
      a.zip.trim().length > 0 &&
      isCompleteUsPhone(phoneDigits) &&
      hasValidPlatform
    );
  }, [businessName, addressFields, phoneDigits, hasValidPlatform]);

  const imagePreviewDisplay = imageFile ? previewUrl : data.cover_image_url;

  const buildFormData = useCallback((): FormData => {
    const fd = new FormData();
    fd.set(FieldNames.forBusinessName(), businessName.trim());
    const line1 = addressFields.street.trim();
    const addr = addressFields.line2.trim()
      ? `${line1}, ${addressFields.line2.trim()}`
      : line1;
    fd.set(FieldNames.forAddress(), addr);
    fd.set(FieldNames.forCity(), addressFields.city.trim());
    fd.set(FieldNames.forState(), addressFields.state.trim().toUpperCase());
    fd.set(FieldNames.forZipCode(), addressFields.zip.trim());
    fd.set(FieldNames.forPhone(), formatUsPhoneMask(phoneDigits));

    for (const p of sortedPlatforms) {
      const raw = (platformUrls[p.id] ?? "").trim();
      if (raw && classifyPlatformUrl(raw, p.name) === "valid") {
        fd.set(
          FieldNames.forSinglePlatformURL(p.id),
          normalizePlatformUrlInput(raw),
        );
      } else {
        fd.set(FieldNames.forSinglePlatformURL(p.id), "");
      }
    }

    if (imageFile) {
      fd.append(FieldNames.forBusinessPhoto(), imageFile);
    }
    return fd;
  }, [
    businessName,
    addressFields,
    phoneDigits,
    platformUrls,
    sortedPlatforms,
    imageFile,
  ]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!canSubmit || isPending) return;
      startTransition(async () => {
        try {
          const formData = buildFormData();
          const result = await updateBusiness(data.id, formData);
          if (result.ok) {
            toast.success("Business updated successfully");
            if (result.coverPhotoWarning) {
              toast.warning("Storefront photo not saved", {
                description: result.coverPhotoWarning,
              });
            }
            onOpenChange(false);
            onUpdatedData?.(result.data);
          } else {
            throw result.error;
          }
        } catch (e) {
          toast.error("Failed to update business", {
            description: ErrorUtils.serializeError(e),
          });
        }
      });
    },
    [
      buildFormData,
      canSubmit,
      isPending,
      data.id,
      onOpenChange,
      onUpdatedData,
    ],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,840px)] w-full max-w-2xl overflow-y-auto sm:max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-0">
          <DialogHeader>
            <DialogTitle>Edit business profile</DialogTitle>
            <DialogDescription>
              Same fields as creating a business: identity, location, phone, at
              least one valid platform link, and an optional storefront photo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-8 py-5">
            <section className="space-y-3">
              <h3 className="text-base font-medium leading-none">Identity</h3>
              <div className="space-y-1.5">
                <Label htmlFor="edit-business-name">
                  Business name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-business-name"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Pizza Palace"
                  autoComplete="organization"
                  className="text-sm"
                  required
                />
              </div>
            </section>

            <Separator />

            <AddressSection
              manualMode={manualAddress}
              onManualModeChange={setManualAddress}
              addressSearch={addressSearch}
              onAddressSearchChange={setAddressSearch}
              fields={addressFields}
              onFieldsChange={setField}
              placesDisabled={!hasMapsKey}
              addressSearchTemporarilyDisabled={
                ADDRESS_SEARCH_TEMPORARILY_DISABLED
              }
              dialogOpen={open}
            />

            <Separator />

            <section className="space-y-3">
              <h3 className="text-base font-medium leading-none">
                Phone <span className="text-destructive">*</span>
              </h3>
              <div className="flex max-w-md items-stretch gap-2">
                <span
                  className="flex shrink-0 items-center rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground"
                  aria-hidden
                >
                  +1
                </span>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Label htmlFor="edit-phone" className="sr-only">
                    Phone number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit-phone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    value={formatUsPhoneMask(phoneDigits)}
                    onChange={(e) =>
                      setPhoneDigits(normalizeUsPhoneDigits(e.target.value))
                    }
                    placeholder="(555) 123-4567"
                    className="text-sm"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    US number — 10 digits required.
                  </p>
                </div>
              </div>
            </section>

            <Separator />

            <section className="space-y-3">
              <div>
                <h3 className="text-base font-medium leading-none">
                  Platforms (1 required){" "}
                  <span className="text-destructive">*</span>
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Paste a valid link for at least one platform. We validate the
                  domain in real time.
                </p>
              </div>
              <div className="space-y-4">
                {sortedPlatforms.map((p) => (
                  <PlatformUrlRow
                    key={p.id}
                    platform={p}
                    value={platformUrls[p.id] ?? ""}
                    onChange={(v) =>
                      setPlatformUrls((prev) => ({ ...prev, [p.id]: v }))
                    }
                  />
                ))}
              </div>
            </section>

            <Separator />

            <BusinessImageField
              file={imageFile}
              previewUrl={imagePreviewDisplay}
              onFileChange={setImageFile}
            />
          </div>

          <DialogFooter className="gap-2 border-t pt-4 sm:justify-end">
            <DialogClose asChild>
              <Button type="button" variant="ghost" disabled={isPending}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={!canSubmit || isPending}
              className={cn("font-medium text-white")}
              variant="ocean"
            >
              {isPending && <Loader2Icon className="animate-spin" />}
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
