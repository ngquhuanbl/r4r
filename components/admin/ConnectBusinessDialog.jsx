'use client';

import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { createBusinessConnection } from '@/app/(protected)/admin/actions';

export default function ConnectBusinessDialog({ 
  businesses, 
  sourceBusiness, 
  isOpen, 
  onClose 
}) {
  const [targetBusinessId, setTargetBusinessId] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // Filter out businesses that belong to the same user or are the source business
  const otherBusinesses = businesses.filter(b => 
    b.id !== sourceBusiness.id && 
    b.user_id !== sourceBusiness.user_id
  );

  const handleConnect = async () => {
    setLoading(true);
    setResult(null);

    try {
      const result = await createBusinessConnection(
        sourceBusiness.id,
        targetBusinessId,
        message
      );

      setResult(result);
      
      if (result.success) {
        // Close the dialog after 2 seconds if successful
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error connecting businesses:', error);
      setResult({
        success: false,
        message: 'An unexpected error occurred'
      });
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Businesses</DialogTitle>
          <DialogDescription>
            Create review invitations between businesses
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div>
            <Label className="text-xs font-medium text-gray-500">From:</Label>
            <div className="p-2 border rounded-md bg-gray-50 mt-1">
              <p className="font-medium">{sourceBusiness.business_name}</p>
              <p className="text-sm text-gray-500">
                {sourceBusiness.address}, {sourceBusiness.city}, {sourceBusiness.state}
              </p>
              {sourceBusiness.platforms && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {sourceBusiness.platforms.map(platform => (
                    <Badge 
                      key={platform.id}
                      className={platform.platforms?.color || 'bg-gray-500'}
                      variant="outline"
                    >
                      {platform.platforms?.name || 'Unknown'}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="target-business">Connect to:</Label>
            {otherBusinesses.length === 0 ? (
              <div className="mt-2 text-sm text-amber-600 p-2 bg-amber-50 rounded border border-amber-200">
                No eligible businesses to connect to. Businesses from the same owner cannot be connected.
              </div>
            ) : (
              <Select
                value={targetBusinessId}
                onValueChange={setTargetBusinessId}
                disabled={loading}
              >
                <SelectTrigger id="target-business">
                  <SelectValue placeholder="Select a business" />
                </SelectTrigger>
                <SelectContent>
                  {otherBusinesses.map(business => (
                    <SelectItem key={business.id} value={business.id.toString()}>
                      {business.business_name} 
                      {business.user?.displayId ? ` (${business.user.displayId})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div>
            <Label htmlFor="message">Message (optional):</Label>
            <Textarea
              id="message"
              placeholder="Add a message for the business owner"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={loading}
              className="resize-none"
              rows={3}
            />
          </div>
          
          {result && (
            <Alert className={result.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}>
              <div className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription className={result.success ? "text-green-800" : "text-red-800"}>
                  {result.message}
                </AlertDescription>
              </div>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConnect}
            disabled={!targetBusinessId || loading || otherBusinesses.length === 0}
          >
            {loading ? "Connecting..." : "Connect Businesses"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}