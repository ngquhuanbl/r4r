'use client';

import { useState } from 'react';
import Container from '@/components/dashboard/Container';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Link from 'next/link';
import { deleteBusiness } from '@/app/(protected)/businesses/actions';

// Default platform styling if none provided
const defaultPlatforms = {
  1: { color: "bg-gray-500 hover:bg-gray-600", name: "Yelp" },
  2: { color: "bg-gray-500 hover:bg-gray-600", name: "Google" },
  5: { color: "bg-gray-500 hover:bg-gray-600", name: "TripAdvisor" },
};

const EmptyState = () => (
  <div className="text-center py-10 border border-dashed border-gray-300 rounded-lg">
    <h3 className="text-lg font-medium text-gray-900 dark:text-white">No businesses found</h3>
    <p className="mt-1 text-sm text-gray-500">Add your first business to get started.</p>
    <div className="mt-6">
      <Link href="/businesses/new">
        <Button>Add Business</Button>
      </Link>
    </div>
  </div>
);

// Business card component
const BusinessCard = ({ business, onDelete, platforms }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleDelete = async () => {
    setIsDeleting(true);
    await deleteBusiness(business.id);
    setIsDeleting(false);
    if (onDelete) onDelete(business.id);
  };
  
  // Count how many platform URLs are set
  const platformCount = business.platform_urls ? Object.keys(business.platform_urls).length : 0;
  
  return (
    <Container key={business.id}>
      <div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          {business.business_name}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-300">
          {business.address}, {business.city}, {business.state} {business.zip_code}
        </p>
        {business.phone && (
          <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">
            {business.phone}
          </p>
        )}
        <p className="text-xs text-gray-400 dark:text-white mt-2">
          {platformCount === 0 
            ? "No platforms connected" 
            : `${platformCount} platform${platformCount === 1 ? '' : 's'} connected`}
        </p>
      </div>
      <div className="flex space-x-2">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm">Delete</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the business "{business.business_name}" and all its related data. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-500 hover:bg-red-600"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        
        <Link href={`/businesses/${business.id}`}>
          <Button size="sm">Manage</Button>
        </Link>
      </div>
    </Container>
  );
};

export default function BusinessList({ initialBusinesses = [], platformStyles = {} }) {
  const [businesses, setBusinesses] = useState(initialBusinesses);
  
  // Merge provided platform styles with defaults
  const platforms = { ...defaultPlatforms, ...platformStyles };
  
  const handleDeleteBusiness = (businessId) => {
    setBusinesses(businesses.filter(b => b.id !== businessId));
  };
  
  if (businesses.length === 0) {
    return <EmptyState />;
  }
  
  return (
    <div className="space-y-4">
      {businesses.map(business => (
        <BusinessCard 
          key={business.id} 
          business={business} 
          onDelete={handleDeleteBusiness}
          platforms={platforms}
        />
      ))}
    </div>
  );
}