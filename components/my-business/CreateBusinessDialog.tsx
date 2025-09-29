import { Loader2Icon } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { createBusiness } from "@/app/(protected)/my-businesses/actions";
import { useAppSelector } from "@/lib/redux/hooks";
import { authSelectors } from "@/lib/redux/slices/auth";
import { platformsSelectors } from "@/lib/redux/slices/platform";
import { FetchedBusiness, PlatformURLs } from "@/types/dashboard";
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

interface CreateBusinessDialogProps {
  open: boolean;
  onOpenChange: (opened: boolean) => void;
  onCreatedData?: (data: FetchedBusiness) => void;
}

export function CreateBusinessDialog({
  open,
  onOpenChange,
  onCreatedData,
}: CreateBusinessDialogProps) {
  const [isUpdating, startUpdating] = useTransition();
  const platforms = useAppSelector(platformsSelectors.selectData);
  const userId = useAppSelector(authSelectors.selectUserId);

  const onSubmit = (formData: FormData) => {
    startUpdating(async () => {
      try {
        const nextPlatformUrls: PlatformURLs = {};
        platforms.forEach(({ id }) => {
          const value = formData.get(FieldNames.forSinglePlatformURL(id));
          if (value !== null) {
            nextPlatformUrls[id] = formData.get(
              FieldNames.forSinglePlatformURL(id)
            ) as string;
          }
        });
        formData.set(
          FieldNames.forPlatformUrls(),
          JSON.stringify(nextPlatformUrls)
        );

        const result = await createBusiness(userId, formData);
        if (result.ok) {
          toast.success(`Create business successfully`);
          if (onCreatedData) {
            onCreatedData(result.data);
          }
        } else {
          throw result.error;
        }
      } catch (e) {
        toast.error(`Failed to create business`, {
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
            <DialogTitle>Create business</DialogTitle>
            <DialogDescription>
              Provide details of your business profile here.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 space-y-2 md:space-y-6 lg:flex lg:space-y-0 lg:gap-4">
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
                    placeholder="e.g., The Corner Bistro"
                    className="text-sm md:text-base"
                  />
                </div>

                <div className="grid grid-cols-[1fr_5fr] gap-2 items-center md:block md:space-y-1">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name={FieldNames.forPhone()}
                    type="tel"
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
                    className="text-sm md:text-base"
                    placeholder="e.g., 123 Main St"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      name={FieldNames.forCity()}
                      required
                      className="text-sm md:text-base"
                      placeholder="e.g., San Francisco"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      name={FieldNames.forState()}
                      required
                      className="text-sm md:text-base"
                      placeholder="e.g., CA"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="postal-code">ZIP Code</Label>
                    <Input
                      id="postal-code"
                      name={FieldNames.forZipCode()}
                      required
                      className="text-sm md:text-base"
                      placeholder="e.g., 94101"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-2 md:pt-4 lg:pt-0 lg:border-t-0">
              <h2 className="text-sm md:text-lg font-medium mb-1">
                Platform Profiles
              </h2>
              <p className="text-xs md:text-sm text-gray-500 mb-4">
                Provide the direct URL to your business's page on each platform
                if available.
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
                        <p className="text-sm text-black">{platform.name}</p>
                      </Label>
                      <Input
                        id={fieldName}
                        name={fieldName}
                        type="text"
                        className="text-sm md:text-base"
                        placeholder={`https://${platform.name.toLowerCase()}.com/your-business`}
                      />
                    </div>
                  );
                })}
              </div>
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
                Create new business
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
