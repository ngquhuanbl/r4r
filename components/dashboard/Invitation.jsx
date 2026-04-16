'use client';

import { useEffect, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Container from '@/components/dashboard/Container';
import { acceptInvitation, rejectInvitation } from '@/app/(protected)/home/actions';
import { toast } from 'sonner';
import { useAppSelector } from '@/lib/redux/hooks';
import { myBusinessesSelectors } from '@/lib/redux/slices/my-business';

export default function Invitation({ invitation, platformStyles = {} }) {
	const [isAccepting, startAccepting] = useTransition();
	const [isRejecting, startRejecting] = useTransition();
  const myBusinesses = useAppSelector(myBusinessesSelectors.selectData);
  const [inviteeBusinessId, setInviteeBusinessId] = useState('');

  useEffect(() => {
    if (myBusinesses.length && !inviteeBusinessId) {
      setInviteeBusinessId(String(myBusinesses[0].id));
    }
  }, [myBusinesses, inviteeBusinessId]);
  
  const handleAccept = async () => {
		startAccepting(async () => {
			try {
        if (myBusinesses.length === 0) {
          toast.error('Add a business before accepting');
          return;
        }
        const chosen =
          myBusinesses.length > 1
            ? Number.parseInt(inviteeBusinessId, 10)
            : myBusinesses[0].id;
        if (myBusinesses.length > 1 && Number.isNaN(chosen)) {
          toast.error('Choose which of your businesses this review is for');
          return;
        }
				const result = await acceptInvitation(invitation.id, chosen);
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
        {myBusinesses.length > 1 ? (
          <div className="mt-3">
            <label className="text-xs text-muted-foreground block mb-1">Your business for this review</label>
            <select
              className="w-full max-w-md rounded-md border border-input bg-background px-2 py-1.5 text-sm"
              value={inviteeBusinessId}
              onChange={(e) => setInviteeBusinessId(e.target.value)}
            >
              {myBusinesses.map((b) => (
                <option key={b.id} value={String(b.id)}>{b.business_name}</option>
              ))}
            </select>
          </div>
        ) : null}
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