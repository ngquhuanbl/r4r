'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Container from '@/components/dashboard/Container';
import { acceptInvitation, rejectInvitation } from '@/app/(protected)/home/actions';
import { toast } from 'sonner';

export default function Invitation({ invitation, platformStyles = {} }) {
	const [isAccepting, startAccepting] = useTransition();
	const [isRejecting, startRejecting] = useTransition();
  
  const handleAccept = async () => {
		startAccepting(async () => {
			try {
				const result = await acceptInvitation(invitation.id);
				if (result.success) {
					toast.success(`Accept invitation successfully`);
				} else {
					throw result.error;
				}
			} catch(e) {
				toast.error('Failed to accept invitation', {
					description: `Error: ${e}`
				})
			}
		})
  };
  
  const handleReject = async () => {
		startRejecting(async () => {
			try {
				const result = await rejectInvitation(invitation.id);
				if (result.success) {
					toast.success(`Reject invitation successfully`);
				} else {
					throw result.error;
				}
			} catch(e) {
				toast.error('Failed to reject invitation', {
					description: `Error: ${e}`
				})
			}
			
		})
  };
  
  const platformData = platformStyles[invitation.platform?.id] || { color: "bg-gray-500", name: "Unknown" };
	
	const disabled = isAccepting || isRejecting;
  
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
        {invitation.message && (
          <div className="mt-3 p-3 bg-gray-50 rounded-md">
            <p className="text-sm font-medium mb-1">Message from business owner:</p>
            <p className="text-sm italic">{invitation.message}</p>
          </div>
        )}
      </div>
      <div className="flex space-x-2">
        <Button variant="outline" onClick={handleReject} disabled={disabled} loading={isRejecting}>
          Reject
        </Button>
        <Button onClick={handleAccept} disabled={disabled} loading={isAccepting}>
          Accept Invitation
        </Button>
      </div>
    </Container>
  );
}