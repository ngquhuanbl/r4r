'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import ConnectBusinessDialog from './ConnectBusinessDialog';

export default function BusinessList({ businesses = [] }) {
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [showConnectModal, setShowConnectModal] = useState(false);

  const handleConnectClick = (business) => {
    setSelectedBusiness(business);
    setShowConnectModal(true);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Businesses</h2>
      
      {businesses.length === 0 ? (
        <p className="text-gray-500">No businesses found.</p>
      ) : (
        <>
          <div className="rounded-md border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-900 border-b">
                  <th className="text-left py-3 px-4 font-medium">Business</th>
                  <th className="text-left py-3 px-4 font-medium">Address</th>
                  <th className="text-left py-3 px-4 font-medium">Owner</th>
                  <th className="text-left py-3 px-4 font-medium">Platforms</th>
                  <th className="text-right py-3 px-4 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {businesses.map((business) => (
                  <tr key={business.id} className="border-b last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-900">
                    <td className="py-3 px-4 align-top">
                      <span className="font-medium">{business.business_name}</span>
                    </td>
                    <td className="py-3 px-4 align-top text-gray-500 dark:text-gray-300">
                      {business.address}, <br />
                      {business.city}, {business.state} {business.zip_code}
                    </td>
                    <td className="py-3 px-4 align-top text-gray-500 dark:text-gray-300">
                      {business.user?.displayId || 'Unknown'}
                    </td>
                    <td className="py-3 px-4 align-top">
                      <div className="flex flex-wrap gap-1 ">
                        {business.platforms && business.platforms.length > 0 ? (
                          business.platforms.map((platform) => (
                            <Badge 
                              key={platform.id}
                              className={`${platform.platforms?.color || 'bg-gray-500'} dark:text-black`}
                              variant="outline"
                            >
                              {platform.platforms?.name || 'Unknown'}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-gray-400 text-xs">No platforms</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleConnectClick(business)}
                      >
                        Connect
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {showConnectModal && selectedBusiness && (
            <ConnectBusinessDialog
              businesses={businesses}
              sourceBusiness={selectedBusiness}
              isOpen={showConnectModal}
              onClose={() => setShowConnectModal(false)}
            />
          )}
        </>
      )}
    </div>
  );
}