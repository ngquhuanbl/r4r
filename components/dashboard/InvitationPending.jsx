'use client';

import { useState } from 'react';
import Container from '@/components/dashboard/Container';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { acceptInvitation, rejectInvitation } from '@/app/(protected)/home/actions';
export default function InvitationPending({ invitation, platformStyles = {} }) {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleAccept = async () => {
    setIsLoading(true);
    await acceptInvitation(invitation.id);
    setIsLoading(false);
  };
  
  const handleReject = async () => {
    setIsLoading(true);
    await rejectInvitation(invitation.id);
    setIsLoading(false);
  };
  
  const platformData = platformStyles[invitation.platform?.id] || { color: "bg-gray-500", name: "Unknown" };
  
  return (
    <Container key={invitation.id}>
      <div>
        <h1 className="flex items-center text-xl font-semibold text-gray-900">
          {invitation.business?.business_name || "Unknown Business"}
         
          <Badge 
            className={`ml-2 ${platformData.color}`}
          >
            {platformData.name}
          </Badge>
        </h1>
        <p className="text-sm text-gray-500">
          {invitation.business?.address}, {invitation.business?.city}, {invitation.business?.state} {invitation.business?.zip_code}
        </p>
      </div>
      <div className="flex space-x-2">
        <Button variant="outline" onClick={handleReject} disabled={isLoading}>
          Decline
        </Button>
        <Button onClick={handleAccept} disabled={isLoading}>
          Accept & Review
        </Button>
      </div>
    </Container>
  );
}