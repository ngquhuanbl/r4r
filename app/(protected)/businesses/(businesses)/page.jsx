import { getUserOrRedirect } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { fetchBusinesses } from '../actions';
import BusinessList from '@/components/dashboard/BusinessList';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function BusinessesPage() {
  const user = await getUserOrRedirect();
  const supabase = createClient();
  
  // Fetch platforms from the database
  const { data: platforms, error } = await supabase
    .from('platforms')
    .select('*')
    .order('id');
    
  if (error) {
		// TODO: Error page
    console.error('Error fetching platforms:', error);
  }
  
  // Convert platforms to the format needed by components
  const platformStyles = {};
  if (platforms) {
    platforms.forEach(platform => {
      platformStyles[platform.id] = {
        name: platform.name,
        color: platform.color
      };
    });
  }
  
  // Fetch real data from Supabase
  const businesses = await fetchBusinesses(user.id);
	// TODO: Error page

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Your Businesses</h1>
        <Link href="/businesses/new">
          <Button>Add Business</Button>
        </Link>
      </div>
      
      <BusinessList 
        userId={user.id}
        initialBusinesses={businesses}
        platformStyles={platformStyles}
      />
    </div>
  );
}