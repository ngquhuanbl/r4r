"use client";

import { useRouter } from "next/navigation";
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
import { useAppSelector } from "@/lib/redux/hooks";
import { platformsSelectors } from "@/lib/redux/slices/platform";
import {
  formatUsPhoneMask,
  isCompleteUsPhone,
  normalizeUsPhoneDigits,
} from "@/lib/phone-us";
import { cn } from "@/lib/utils";
import { classifyPlatformUrl } from "@/lib/validation/platform-urls";
import { FetchedBusiness } from "@/types/dashboard";
import { buildEditBusinessFormData } from "@/app/(protected)/actions/business-actions/utils/data-processing";
import { ErrorUtils } from "@/utils/error";

import { AddressFields } from "@/components/business/create-business/address-fields";
import { BusinessImageField } from "@/components/business/create-business/business-image-field";
import { PlatformUrlRow } from "@/components/business/create-business/platform-url-row";
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
import { AddressValue } from "@/types/address";

interface EditBusinessProfileDialogProps {
  data: FetchedBusiness;
  onOpenChange: (_opened: boolean) => void;
  open: boolean;
}

/**
 * Same structure as CreateBusinessProfile (CreateBusinessDialog): identity,
 * address, phone, platform rows with live validation, optional photo — wired
 * to `updateBusiness` + FieldNames used by the server action.
 */
export function EditBusinessProfileDialog({
  data,
  onOpenChange,
  open,
}: EditBusinessProfileDialogProps) {
  //
  // PROPS
  //

  /** Platform catalog used to render URL rows and validate entered links. */
  const platforms = useAppSelector(platformsSelectors.selectData);

  //
  // STATE
  //

  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  /** Business name edited in the dialog identity section. */
  const [businessName, setBusinessName] = useState("");
  /** Address fields edited manually or via Places search. */
  const [addressFields, setAddressFields] = useState<AddressValue>({
    line1: "",
    line2: "",
    city: "",
    state: "",
    zip: "",
  });
  /** US phone number as normalized digits-only input. */
  const [phoneDigits, setPhoneDigits] = useState("");
  /** Platform IDs mapped to user-provided URLs. */
  const [platformUrls, setPlatformUrls] = useState<Record<number, string>>({});
  /** Optional replacement storefront photo selected by user. */
  const [imageFile, setImageFile] = useState<File | null>(null);

  /** Whether at least one platform URL is currently valid. */
  const hasValidPlatform = useMemo(() => {
    return platforms.some((p) => {
      const u = platformUrls[p.id] ?? "";
      return classifyPlatformUrl(u, p.name) === "valid";
    });
  }, [platforms, platformUrls]);

  /** Whether all required fields are valid for submit. */
  const canSubmit = (() => {
    const a = addressFields;
    return (
      businessName.trim().length > 0 &&
      a.line1.trim().length > 0 &&
      a.city.trim().length > 0 &&
      a.state.trim().length > 0 &&
      a.zip.trim().length > 0 &&
      isCompleteUsPhone(phoneDigits) &&
      hasValidPlatform
    );
  })();

  //
  // EVENTS
  //

  /** Handler for patch updates from nested address fields component. */
  const setField = useCallback((patch: Partial<AddressValue>) => {
    setAddressFields((prev) => ({ ...prev, ...patch }));
  }, []);

  /** Handler for form submit to persist business updates. */
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!canSubmit || isPending) return;
      startTransition(async () => {
        try {
          const formData = buildEditBusinessFormData({
            addressFields,
            businessName,
            imageFile,
            phoneDigits,
            platformUrls,
            platforms,
          });
          const result = await updateBusiness(data.id, formData);
          if (result.ok) {
            toast.success("Business updated successfully");
            if (result.coverPhotoWarning) {
              toast.warning("Storefront photo not saved", {
                description: result.coverPhotoWarning,
              });
            }
            onOpenChange(false);
            router.refresh();
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
      addressFields,
      businessName,
      canSubmit,
      imageFile,
      isPending,
      data.id,
      onOpenChange,
      phoneDigits,
      platformUrls,
      platforms,
      router,
    ],
  );

  //
  // EFFECTS
  //

  /** Syncs dialog local state from the incoming business data when dialog opens. */
  useEffect(() => {
    if (!open) return;
    setBusinessName(data.business_name);
    setAddressFields({
      line1: data.address ?? "",
      line2: "",
      city: data.city ?? "",
      state: data.state ?? "",
      zip: data.zip_code ?? "",
    });
    setPhoneDigits(normalizeUsPhoneDigits(data.phone ?? ""));
    setImageFile(null);
    const next: Record<number, string> = {};
    for (const p of platforms) {
      next[p.id] = data.platform_urls[p.id] ?? "";
    }
    setPlatformUrls(next);
  }, [open, data, platforms]);

  //
  // RENDER
  //

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[min(90vh,840px)] w-full max-w-2xl overflow-y-auto sm:max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-0">
          <DialogHeader>
            <DialogTitle>Edit business profile</DialogTitle>
            <DialogDescription>
              Update identity, location, phone, and keep at least one platform
              link valid. <br />
              Add or replace storefront photo when you&apos;re ready.
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

            <AddressFields fields={addressFields} onFieldsChange={setField} />

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
                {platforms.map((p) => (
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
              existingPreviewUrl={data.cover_image_url}
              file={imageFile}
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
              className={cn("font-medium text-white")}
              disabled={!canSubmit || isPending}
              type="submit"
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
