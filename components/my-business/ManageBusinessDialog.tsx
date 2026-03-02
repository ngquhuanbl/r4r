import { AlertCircle, Loader2Icon } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { updateBusiness } from "@/app/(protected)/my-businesses/actions";
import { useAppSelector } from "@/lib/redux/hooks";
import { platformsSelectors } from "@/lib/redux/slices/platform";
import { FetchedBusiness } from "@/types/dashboard";
import { Tables } from "@/types/database";
import { ErrorUtils } from "@/utils/error";
import { FieldNames } from "@/utils/my-business";

import { Platform } from "../dashboard/Platform";
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
import { PhoneInput } from "../ui/phone-input";

interface ManageBusinessDialogProps {
  open: boolean;
  onOpenChange: (opened: boolean) => void;
  data: FetchedBusiness;
  onUpdatedData?: (data: FetchedBusiness) => void;
}

export function ManageBusinessDialog({
  open,
  onOpenChange,
  data,
  onUpdatedData,
}: ManageBusinessDialogProps) {
  const [isUpdating, startUpdating] = useTransition();
  const [platformError, setPlatformError] = useState<string | null>(null);
  const platforms = useAppSelector(platformsSelectors.selectData);

  const onSubmit = (formData: FormData) => {
    setPlatformError(null);

    const nextPlatformUrls: Record<
      Tables<"platforms">["id"],
      FormDataEntryValue | null
    > = {};
    let hasAtLeastOnePlatform = false;

    platforms.forEach(({ id }) => {
      const value = formData.get(FieldNames.forSinglePlatformURL(id)) as string;
      const trimmed = value ? String(value).trim() : "";
      nextPlatformUrls[id] = trimmed;
      if (trimmed !== "") {
        hasAtLeastOnePlatform = true;
      }
    });

    if (!hasAtLeastOnePlatform) {
      setPlatformError("At least one platform URL must be filled");
      return;
    }

    startUpdating(async () => {
      try {
        const nextBusinessName =
          formData.get(FieldNames.forBusinessName()) || "";
        const nextPhone = formData.get(FieldNames.forPhone()) || "";
        const nextAddress = formData.get(FieldNames.forAddress()) || "";
        const nextCity = formData.get(FieldNames.forCity()) || "";
        const nextState = formData.get(FieldNames.forState()) || "";
        const nextZipCode = formData.get(FieldNames.forZipCode()) || "";

        const changed =
          nextBusinessName !== data.business_name ||
          nextPhone !== data.phone ||
          nextAddress !== data.address ||
          nextCity !== data.city ||
          nextState !== data.state ||
          nextZipCode !== data.zip_code ||
          platforms.some(
            ({ id }) =>
              (nextPlatformUrls[id] || "") !== (data.platform_urls[id] || "")
          );

        if (!changed) {
          toast.error("Nothing changed");
          return;
        }

        const result = await updateBusiness(data.id, formData);
        if (result.ok) {
          toast.success(`Update business successfully`);
          if (onUpdatedData) {
            onUpdatedData(result.data);
          }
        } else {
          throw result.error;
        }
      } catch (e) {
        toast.error(`Failed to update business`, {
          description: ErrorUtils.serializeError(e),
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-screen sm:max-w-[50%]">
        <form action={onSubmit}>
          <DialogHeader>
            <DialogTitle>Manage business</DialogTitle>
            <DialogDescription>
              Make changes to your business profile here. Click save when
              you&apos;re done.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 mt-2 md:space-y-6 lg:flex lg:space-y-0 lg:gap-4">
            <div>
              <h2 className="text-sm md:text-lg font-medium mb-1">
                Business information
              </h2>
              <p className="text-xs md:text-sm text-gray-500 mb-4">
                This information helps us accurately identify and categorize
                your location.
              </p>
              <div className="space-y-3">
                <div className="grid grid-cols-[1fr_5fr] gap-2 items-center md:block md:space-y-1">
                  <Label htmlFor="business-name">Business Name</Label>
                  <Input
                    id="business-name"
                    name={FieldNames.forBusinessName()}
                    required
                    className="text-sm md:text-base"
                    defaultValue={data.business_name}
                  />
                </div>

                <div className="grid grid-cols-[1fr_5fr] gap-2 items-center md:block md:space-y-1">
                  <Label htmlFor="phone">Phone Number</Label>
                  <PhoneInput
                    key={data.id}
                    name={FieldNames.forPhone()}
                    defaultValue={data.phone || ""}
                    placeholder="e.g., (555) 555-1234"
                    className="text-sm md:text-base"
                  />
                </div>

                <div className="grid grid-cols-[1fr_5fr] gap-2 items-center md:block md:space-y-1">
                  <Label htmlFor="street-address">Street Address</Label>
                  <Input
                    id="street-address"
                    name={FieldNames.forAddress()}
                    required
                    autoComplete="street-address"
                    className="text-sm md:text-base"
                    defaultValue={data.address}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      name={FieldNames.forCity()}
                      required
                      autoComplete="address-level2"
                      className="text-sm md:text-base"
                      defaultValue={data.city}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      name={FieldNames.forState()}
                      required
                      autoComplete="address-level1"
                      className="text-sm md:text-base"
                      defaultValue={data.state}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="postal-code">ZIP Code</Label>
                    <Input
                      id="postal-code"
                      name={FieldNames.forZipCode()}
                      required
                      autoComplete="postal-code"
                      className="text-sm md:text-base"
                      defaultValue={data.zip_code}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-2 md:pt-4 lg:pt-0 lg:border-t-0">
              <h2 className="text-sm md:text-lg font-medium mb-1">
                Platform Profiles
                <span className="text-red-500 ml-1">*</span>
              </h2>
              <p className="text-xs md:text-sm text-gray-500 mb-4">
                At least one platform URL must be filled. Provide the direct URL
                to your business&apos;s page on each platform if available.
              </p>

              <div className="space-y-3">
                {platforms.map((platform) => {
                  const fieldName = FieldNames.forSinglePlatformURL(
                    platform.id
                  );
                  return (
                    <div
                      key={platform.id}
                      className="grid grid-cols-[2fr_5fr] gap-2 items-center md:block md:space-y-1"
                    >
                      <Label
                        htmlFor={fieldName}
                        className="flex items-center gap-2"
                      >
                        <Platform name={platform.name} />
                        <p className="text-sm">{platform.name}</p>
                      </Label>
                      <Input
                        id={fieldName}
                        name={fieldName}
                        type="text"
                        className="text-sm md:text-base"
                        placeholder={`https://${platform.name.toLowerCase()}.com/your-business`}
                        defaultValue={data.platform_urls[platform.id] || ""}
                        onChange={() => setPlatformError(null)}
                      />
                    </div>
                  );
                })}
              </div>

              {platformError && (
                <div className="flex items-center gap-2 mt-3 text-red-500 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{platformError}</span>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <div className="flex justify-end space-x-2 pt-2 md:pt-4 border-t lg:border-t-0">
              <DialogClose asChild>
                <Button variant="outline" disabled={isUpdating}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating && <Loader2Icon className="animate-spin" />}
                Save changes
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
