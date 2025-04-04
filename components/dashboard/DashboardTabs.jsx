'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import EmptyState from './EmptyState';
import InvitationPending from './InvitationPending';
import InvitationAccepted from './InvitationAccepted';
import ReviewVerify from './ReviewVerify';

export default function DashboardTabs({ 
  userId, 
  initialInvitations = [], 
  initialAcceptedInvitations = [], 
  initialPendingReviews = [],
  platformStyles = {} 
}) {
  
  const [invitations, setInvitations] = useState(initialInvitations);
  const [acceptedInvitations, setAcceptedInvitations] = useState(initialAcceptedInvitations);
  const [pendingReviews, setPendingReviews] = useState(initialPendingReviews);
  const [activeTab, setActiveTab] = useState('invitations');
  
  return (
    <Tabs defaultValue="invitations" onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="invitations">
          Review Requests
          <Badge variant="outline" className="ml-2">
            {invitations.length}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="accepted">
          Pending Reviews
          <Badge variant="outline" className="ml-2">
            {acceptedInvitations.length}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="reviews">
          Reviews to Approve
          <Badge variant="outline" className="ml-2">
            {pendingReviews.length}
          </Badge>
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="invitations" className="mt-4">
        <p className="text-sm text-gray-500 mb-4">Businesses that would like you to leave a review on their platform.</p>
        {invitations.length === 0 ? (
          <EmptyState 
            heading="No review requests" 
            body="Check back later for new review requests from other businesses."
          />
        ) : (
          <div className="space-y-4">
            {invitations.map(invitation => (
              <InvitationPending 
                key={invitation.id} 
                invitation={invitation} 
                platformStyles={platformStyles}
              />
            ))}
          </div>
        )}
      </TabsContent>
      
      <TabsContent value="accepted" className="mt-4">
        <p className="text-sm text-gray-500 mb-4">Requests you've accepted. Leave a review and submit the details here.</p>
        {acceptedInvitations.length === 0 ? (
          <EmptyState 
            heading="No pending reviews" 
            body="When you accept a review request, it will appear here for you to submit your review."
          />
        ) : (
          <div className="space-y-4">
            {acceptedInvitations.map(invitation => (
              <InvitationAccepted 
                key={invitation.id} 
                invitation={invitation} 
                platformStyles={platformStyles}
              />
            ))}
          </div>
        )}
      </TabsContent>
      
      <TabsContent value="reviews" className="mt-4">
        <p className="text-sm text-gray-500 mb-4">Reviews others have left for your business that need your approval.</p>
        {pendingReviews.length === 0 ? (
          <EmptyState 
            heading="No reviews to approve" 
            body="When others leave reviews for your business, they'll appear here for approval."
          />
        ) : (
          <div className="space-y-4">
            {pendingReviews.map(review => (
              <ReviewVerify 
                key={review.id} 
                review={review} 
                platformStyles={platformStyles}
                onReviewProcessed={(reviewId, action) => {
                  // Remove the processed review from the UI
                  setPendingReviews(prevReviews => 
                    prevReviews.filter(r => r.id !== reviewId)
                  );
                }}
              />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}