import { getUserOrRedirect, createClient } from "@/lib/supabase/server";
import { fetchBusinessById, updateBusiness } from "../actions";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Submit } from "@/components/shared/submit";
import Link from "next/link";
import ErrorPage from "./error";

export default async function BusinessPage({ params, searchParams }) {
  const user = await getUserOrRedirect();
  const businessId = params.id;
  const hasError = !!searchParams.error;

  if (hasError) return <ErrorPage />;

  // Fetch the business data
  const business = await fetchBusinessById(businessId, user.id);

  // Fetch platforms from database
  const supabase = createClient();
  const { data: platforms } = await supabase
    .from("platforms")
    .select("*")
    .order("id");

  if (!business) {
    redirect("/businesses");
  }

  async function handleUpdateBusiness(formData) {
    "use server";

    // First update the basic business info
    const result = await updateBusiness(businessId, formData);

    if (!result.success) {
      console.error("Failed to update business:", result.error);
      redirect(`/businesses/${businessId}?error=failed`);
      return;
    }

    // Now handle platform URLs
    const supabase = createClient();

    // Process each platform URL input and update business_platforms
    if (platforms) {
      for (const platform of platforms) {
        const url = formData.get(`platform-url-${platform.id}`);

        if (url && url.trim() !== "") {
          // Check if this platform already exists for this business
          const { data: existingPlatform } = await supabase
            .from("business_platforms")
            .select("id")
            .eq("business_id", businessId)
            .eq("platform_id", platform.id)
            .maybeSingle();

          if (existingPlatform) {
            // Update existing platform URL
            await supabase
              .from("business_platforms")
              .update({ platform_url: url.trim() })
              .eq("id", existingPlatform.id);
          } else {
            // Insert new platform URL
            await supabase.from("business_platforms").insert({
              business_id: businessId,
              platform_id: platform.id,
              platform_url: url.trim(),
              is_verified: false,
            });
          }
        } else {
          // If URL is empty, remove this platform
          await supabase
            .from("business_platforms")
            .delete()
            .eq("business_id", businessId)
            .eq("platform_id", platform.id);
        }
      }
    }

    redirect("/businesses");
  }

  // Get existing platform URLs
  const platformUrls = business.platform_urls || {};

  // return <ErrorPage />;

  return (
    <div className="container mx-auto py-6 max-w-2xl">
      <div className="flex items-center mb-6">
        <Link href="/businesses" className="mr-4">
          <Button variant="ghost" size="sm">
            ← Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Manage Business</h1>
      </div>

      <div className="bg-white dark:bg-black dark:shadow-gray-600 shadow-sm rounded-lg p-6 mb-6">
        <form action={handleUpdateBusiness}>
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="business-name">Business Name</Label>
                <Input
                  id="business-name"
                  name="business-name"
                  required
                  className="mt-1"
                  defaultValue={business.business_name}
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  className="mt-1"
                  defaultValue={business.phone || ""}
                />
              </div>

              <div>
                <Label htmlFor="street-address">Street Address</Label>
                <Input
                  id="street-address"
                  name="street-address"
                  required
                  className="mt-1"
                  defaultValue={business.address}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    name="city"
                    required
                    className="mt-1"
                    defaultValue={business.city}
                  />
                </div>

                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    name="state"
                    required
                    className="mt-1"
                    defaultValue={business.state}
                  />
                </div>

                <div>
                  <Label htmlFor="postal-code">ZIP Code</Label>
                  <Input
                    id="postal-code"
                    name="postal-code"
                    required
                    className="mt-1"
                    defaultValue={business.zip_code}
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h2 className="text-lg font-medium mb-3">Platform Profiles</h2>
              <p className="text-sm text-gray-500 mb-4">
                Manage your business profile links on various review platforms.
              </p>

              <div className="space-y-4">
                {platforms?.map((platform) => (
                  <div key={platform.id}>
                    <Label htmlFor={`platform-url-${platform.id}`}>
                      <span
                        className={`inline-block px-2 py-0.5 rounded mr-2 text-white text-xs ${platform.color}`}
                      >
                        {platform.name}
                      </span>
                    </Label>
                    <Input
                      id={`platform-url-${platform.id}`}
                      name={`platform-url-${platform.id}`}
                      type="text"
                      className="mt-1"
                      placeholder={`https://${platform.name.toLowerCase()}.com/your-business`}
                      defaultValue={platformUrls[platform.id] || ""}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Link href="/businesses">
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Link>
              <Submit text="Update Business" loadingText="Updating..." />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
