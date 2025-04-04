'use server';

import { createClient } from '@/lib/supabase/server';

// Fetch all platforms - pure database implementation with no mock fallbacks
export async function fetchPlatforms() {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('platforms')
    .select('*')
    .order('id');
    
  if (error) {
    console.error('Error fetching platforms:', error);
    throw new Error('Failed to fetch platforms');
  }
  
  return data;
}

// Get platform by ID - pure database implementation with no mock fallbacks
export async function getPlatformById(platformId) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('platforms')
    .select('*')
    .eq('id', platformId)
    .single();
    
  if (error) {
    console.error('Error fetching platform:', error);
    throw new Error(`Failed to fetch platform with ID ${platformId}`);
  }
  
  return data;
}

// Convert platforms data to a styled format for UI
export async function getPlatformStyles() {
  const platforms = await fetchPlatforms();
  
  // Convert to object with ID as key for easier lookup
  const platformStyles = {};
  
  platforms.forEach(platform => {
    platformStyles[platform.id] = {
      name: platform.name,
      color: platform.color
    };
  });
  
  return platformStyles;
}