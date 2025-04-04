'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Fetch all businesses for the admin panel
export async function fetchAllBusinesses() {
  const supabase = createClient();

  // Fetch all businesses
  const { data: businesses, error: businessError } = await supabase
    .from("businesses")
    .select(`
      id,
      business_name,
      phone,
      address,
      city,
      state,
      zip_code,
      user_id
    `)
    .order("business_name", { ascending: true });
    
  if (businessError) {
    console.error("Error fetching businesses:", businessError);
    return [];
  }
  
  // Instead of trying to fetch emails which requires special access,
  // we'll just use the user_id directly
  if (businesses && businesses.length > 0) {
    businesses.forEach(business => {
      // Format the UUID to make it more readable as an identifier
      const userId = business.user_id || '';
      const shortId = userId.substring(0, 8);
      business.user = { 
        id: userId,
        displayId: shortId ? `User: ${shortId}...` : 'Unknown user'
      };
    });
  }

  // For each business, fetch their associated platform data
  const businessesWithPlatforms = await Promise.all(
    businesses.map(async (business) => {
      const { data: platformData, error: platformError } = await supabase
        .from("business_platforms")
        .select(`
          id,
          platform_id,
          platform_url,
          platform_business_id,
          is_verified,
          platforms (
            id,
            name,
            color
          )
        `)
        .eq("business_id", business.id);

      if (platformError) {
        console.error(
          `Error fetching platforms for business ${business.id}:`,
          platformError,
        );
        return { ...business, platforms: [] };
      }

      return {
        ...business,
        platforms: platformData || [],
      };
    }),
  );

  return businessesWithPlatforms;
}

// Create a connection (invitation) between two businesses
export async function createBusinessConnection(inviterBusinessId, inviteeBusinessId, message) {
  const supabase = createClient();

  // 1. Get information about both businesses to validate
  const { data: businesses, error: businessError } = await supabase
    .from('businesses')
    .select(`
      id,
      user_id
    `)
    .in('id', [inviterBusinessId, inviteeBusinessId]);

  if (businessError || businesses.length !== 2) {
    console.error('Error fetching businesses for connection:', businessError);
    return { success: false, error: businessError || 'Both businesses not found' };
  }

  const inviter = businesses.find(b => b.id === parseInt(inviterBusinessId));
  const invitee = businesses.find(b => b.id === parseInt(inviteeBusinessId));

  if (!inviter || !invitee) {
    return { success: false, error: 'One or both businesses not found' };
  }

  // 2. Get all platforms for the inviter business
  const { data: inviterPlatforms, error: platformError } = await supabase
    .from('business_platforms')
    .select(`
      id,
      platform_id,
      platform_url
    `)
    .eq('business_id', inviterBusinessId);

  if (platformError) {
    console.error('Error fetching inviter platforms:', platformError);
    return { success: false, error: platformError };
  }

  // 3. Get the "PENDING" status ID for invitations
  const { data: pendingStatus, error: statusError } = await supabase
    .from('invitation_statuses')
    .select('id')
    .eq('name', 'PENDING')
    .single();

  if (statusError) {
    console.error('Error fetching pending status:', statusError);
    return { success: false, error: statusError };
  }

  // 4. Create an invitation for each platform pair
  const results = await Promise.all(
    inviterPlatforms.map(async (platform) => {
      // Create invitation
      const { data, error } = await supabase
        .from('review_invitations')
        .insert({
          business_id: inviterBusinessId,
          platform_id: platform.platform_id,
          inviter_id: inviter.user_id,
          invitee_id: invitee.user_id,
          status_id: pendingStatus.id,
          message: message || '',
        });

      if (error) {
        console.error(`Error creating invitation for platform ${platform.platform_id}:`, error);
        return { success: false, platformId: platform.platform_id, error };
      }

      return { success: true, platformId: platform.platform_id, data };
    })
  );

  const allSuccessful = results.every(r => r.success);
  
  revalidatePath('/admin');
  return { 
    success: allSuccessful, 
    results,
    message: allSuccessful 
      ? `Successfully connected businesses` 
      : `There were errors connecting some platforms`
  };
}