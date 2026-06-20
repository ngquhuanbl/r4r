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

import { createBusiness } from "@/app/(protected)/actions/business-actions";
import { useAppSelector } from "@/lib/redux/hooks";
import { authSelectors } from "@/lib/redux/slices/auth";
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
import { FetchedBusiness, PlatformURLs } from "@/types/dashboard";
import { ErrorUtils } from "@/utils/error";
import { FieldNames } from "@/utils/my-business";

import {
  AddressFields,
  type AddressFields as AddressFieldsValue,
} from "./create-business/address-fields";
import { BusinessImageField } from "./create-business/business-image-field";
import { PlatformUrlRow } from "./create-business/platform-url-row";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";

interface CreateBusinessDialogProps {
  open: boolean;
  onOpenChange: (_opened: boolean) => void;
  onCreatedData?: (_data: FetchedBusiness) => void;
}

function emptyAddress(): AddressFieldsValue {
  return { street: "", line2: "", city: "", state: "", zip: "" };
}

export function CreateBusinessDialog({
  open,
  onOpenChange,
  onCreatedData,
}: CreateBusinessDialogProps) {
  const [isPending, startTransition] = useTransition();
  const platforms = useAppSelector(platformsSelectors.selectData);
  const userId = useAppSelector(authSelectors.selectUserId);

  const [businessName, setBusinessName] = useState("");
  const [addressFields, setAddressFields] =
    useState<AddressFieldsValue>(emptyAddress);
  const [phoneDigits, setPhoneDigits] = useState("");
  const [platformUrls, setPlatformUrls] = useState<Record<number, string>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const sortedPlatforms = platforms;

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
    if (!open) {
      setBusinessName("");
      setAddressFields(emptyAddress());
      setPhoneDigits("");
      setPlatformUrls({});
      setImageFile(null);
      setPreviewUrl(null);
    }
  }, [open]);

  const setField = useCallback((patch: Partial<AddressFieldsValue>) => {
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

    const urls: PlatformURLs = {};
    for (const p of sortedPlatforms) {
      const raw = (platformUrls[p.id] ?? "").trim();
      if (classifyPlatformUrl(raw, p.name) === "valid") {
        urls[p.id] = normalizePlatformUrlInput(raw);
      }
    }
    fd.set(FieldNames.forPlatformUrls(), JSON.stringify(urls));
    if (imageFile) {
      fd.append(FieldNames.forBusinessPhoto(), imageFile);
    }
    return fd;
  }, [businessName, addressFields, phoneDigits, platformUrls, sortedPlatforms, imageFile]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!canSubmit || isPending) return;
      startTransition(async () => {
        try {
          const formData = buildFormData();
          const result = await createBusiness(userId, formData);
          if (result.ok) {
            toast.success("Business profile created successfully");
            if (result.coverPhotoWarning) {
              toast.warning("Storefront photo not saved", {
                description: result.coverPhotoWarning,
              });
            }
            onOpenChange(false);
            onCreatedData?.(result.data);
          } else {
            throw result.error;
          }
        } catch (e) {
          toast.error("Failed to create business profile", {
            description: ErrorUtils.serializeError(e),
          });
        }
      });
    },
    [
      buildFormData,
      canSubmit,
      isPending,
      userId,
      onOpenChange,
      onCreatedData,
    ],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,840px)] w-full max-w-2xl overflow-y-auto sm:max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-0">
          <DialogHeader>
            <DialogTitle>Create Business Profile</DialogTitle>
            <DialogDescription>
              Identity, location, phone, and at least one platform link are
              required. <br />
              Add an optional storefront photo when you&apos;re ready.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-8 py-5">
            <section className="space-y-3">
              <h3 className="text-base font-medium leading-none">Identity</h3>
              <div className="space-y-1.5">
                <Label htmlFor="business-name">Business name <span className="text-destructive">*</span></Label>
                <Input
                  id="business-name"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Pizza Palace"
                  autoComplete="organization"
                  className="text-sm "
                  required
                />
              </div>
            </section>

            <Separator />

            <AddressFields fields={addressFields} onFieldsChange={setField} />

            <Separator />

            <section className="space-y-3">
              <h3 className="text-base font-medium leading-none">Phone <span className="text-destructive">*</span></h3>
              <div className="flex max-w-md items-stretch gap-2">
                <span
                  className="flex shrink-0 items-center rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground"
                  aria-hidden
                >
                  +1
                </span>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Label htmlFor="phone" className="sr-only">
                    Phone number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    value={formatUsPhoneMask(phoneDigits)}
                    onChange={(e) =>
                      setPhoneDigits(normalizeUsPhoneDigits(e.target.value))
                    }
                    placeholder="(555) 123-4567"
                    className="text-sm "
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
                  Platforms (1 required) <span className="text-destructive">*</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
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
              previewUrl={previewUrl}
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
              variant="ocean"
              disabled={!canSubmit || isPending}
              className={cn("font-medium text-white")}
            >
              {isPending && <Loader2Icon className="animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
