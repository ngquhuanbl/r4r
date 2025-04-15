import { getUserOrRedirect, createClient } from "@/lib/supabase/server";
import { createBusiness } from '../actions';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Submit } from '@/components/shared/submit';
import Link from 'next/link';

// Separate server action that won't try to use client components
async function handleCreateBusiness(platformIds, userId, formData) {
  'use server';
  
  // Extract platform URLs into a single object
  const platformUrls = {};
  
  // Process each platform URL input based on platform IDs we received
  for (const platformId of platformIds) {
    const url = formData.get(`platform-url-${platformId}`);
    if (url && url.trim() !== '') {
      platformUrls[platformId] = url.trim();
    }
  }
  
  // Add platform URLs to the form data
  formData.append('platform-urls', JSON.stringify(platformUrls));
  
  const result = await createBusiness(formData, userId);
  
  if (result.success) {
    redirect('/businesses');
  } else {
    // In a real app, you'd handle this error better
    console.error('Failed to create business:', result.error);
    redirect('/businesses/new?error=failed');
  }
}

export default async function NewBusinessPage({ searchParams }) {
  const user = await getUserOrRedirect();
  const supabase = createClient();
	const hasError = !!searchParams.error;

  if (hasError) {
		throw new Error('Error occurred!')
	};
  
  // Fetch platforms from the database
  const { data: platforms, error } = await supabase
    .from('platforms')
    .select('*')
    .order('id');
    
  if (error) {
    console.error('Error fetching platforms:', error);
  }
  
  // Extract just the platform IDs that we'll need for the form
  const platformIds = platforms?.map(platform => platform.id) || [];
  
  // Create a bound version of the action with the user ID and platform IDs included
  const createBusinessAction = handleCreateBusiness.bind(null, platformIds, user.id);

  return (
    <div className="container mx-auto py-6 max-w-2xl">
      <div className="flex items-center mb-6">
        <Link href="/businesses" className="mr-4">
          <Button variant="ghost" size="sm">← Back</Button>
        </Link>
        <h1 className="text-2xl font-bold">Add New Business</h1>
      </div>
      
      <div className="bg-white dark:bg-black dark:shadow-gray-600 shadow-sm rounded-lg p-6">
        <form action={createBusinessAction}>
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="business-name">Business Name</Label>
                <Input 
                  id="business-name" 
                  name="business-name" 
                  required 
                  className="mt-1" 
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input 
                  id="phone" 
                  name="phone" 
                  type="tel" 
                  className="mt-1" 
                />
              </div>
              
              <div>
                <Label htmlFor="street-address">Street Address</Label>
                <Input 
                  id="street-address" 
                  name="street-address" 
                  required 
                  className="mt-1" 
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
                  />
                </div>
                
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input 
                    id="state" 
                    name="state" 
                    required 
                    className="mt-1" 
                  />
                </div>
                
                <div>
                  <Label htmlFor="postal-code">ZIP Code</Label>
                  <Input 
                    id="postal-code" 
                    name="postal-code" 
                    required 
                    className="mt-1" 
                  />
                </div>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <h2 className="text-lg font-medium mb-3">Platform Profiles</h2>
              <p className="text-sm text-gray-500 mb-4">
                Add links to your business profile pages on various review platforms.
              </p>
              
              <div className="space-y-4">
                {platforms?.map(platform => (
                  <div key={platform.id}>
                    <Label htmlFor={`platform-url-${platform.id}`}>
                      <span className={`inline-block px-2 py-0.5 rounded mr-2 text-white text-xs ${platform.color}`}>{platform.name}</span> 
         
                    </Label>
                    <Input 
                      id={`platform-url-${platform.id}`}
                      name={`platform-url-${platform.id}`}
                      type="text" 
                      className="mt-1"
                      placeholder={`https://${platform.name.toLowerCase()}.com/your-business`}
                    />
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Link href="/businesses">
                <Button variant="outline" type="button">Cancel</Button>
              </Link>
              <Submit text="Save Business" loadingText="Creating..." />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}