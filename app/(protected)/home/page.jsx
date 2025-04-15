import { getUserOrRedirect } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { fetchInvitations, fetchAcceptedInvitations, fetchPendingReviews } from './actions';
import DashboardTabs from '@/components/dashboard/DashboardTabs';

export default async function Page() {
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
  
  // Fetch real data from the database
  const invitations = await fetchInvitations(user.id);
  const acceptedInvs = await fetchAcceptedInvitations(user.id);
  const pendingRevs = await fetchPendingReviews(user.id);
  
  // Log data for debugging purposes
  console.log('Pending invitations:', invitations.length);
  console.log('Accepted invitations:', acceptedInvs.length);
  console.log('Pending reviews:', pendingRevs.length);

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <DashboardTabs 
        userId={user.id}
        initialInvitations={invitations}
        initialAcceptedInvitations={acceptedInvs}
        initialPendingReviews={pendingRevs}
        platformStyles={platformStyles}
      />
    </div>
  );
}
