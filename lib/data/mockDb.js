import { platforms } from './platforms';
import { businesses } from './businesses';
import { invitations } from './invitations';

// Helper function to deep clone objects to avoid mutation issues
const clone = (obj) => JSON.parse(JSON.stringify(obj));

// Utility functions to filter and process mock data
export const mockDb = {
  // Filter businesses by user ID
  getUserBusinesses: (userId) => {
    return clone(businesses)
      .filter(business => business.user_id === userId)
      .map(business => ({
        ...business,
        // Ensure platform_urls is always an object
        platform_urls: business.platform_urls || {}
      }));
  },

  // Get a specific business by ID
  getBusinessById: (businessId, userId) => {
    const business = clone(businesses)
      .find(b => b.id === businessId && b.user_id === userId);
    
    if (!business) return null;
    
    return {
      ...business,
      platform_urls: business.platform_urls || {}
    };
  },

  // Get all platforms
  getAllPlatforms: () => {
    return clone(platforms);
  },

  // Get invitations for user with status = 0 (Pending)
  getPendingInvitations: (userId) => {
    return clone(invitations)
      .filter(inv => inv.user_id === userId && inv.status_id === 0);
  },

  // Get invitations for user with status = 10 (Accepted)
  getAcceptedInvitations: (userId) => {
    return clone(invitations)
      .filter(inv => inv.user_id === userId && inv.status_id === 10);
  },

  // Get reviews waiting for approval by user (where user is counter_party)
  getPendingReviews: (userId) => {
    return clone(invitations)
      .filter(inv => inv.counter_party_user_id === userId && inv.status_id === 100);
  },

  // Simulate accepting an invitation
  acceptInvitation: (invitationId) => {
    const invitationIndex = invitations.findIndex(inv => inv.id === invitationId);
    if (invitationIndex === -1) return { success: false, error: 'Invitation not found' };
    
    // In a real app, this would update the database
    // For mock, we'll just return success
    return { 
      success: true, 
      data: { 
        ...clone(invitations[invitationIndex]),
        status_id: 10 
      } 
    };
  },

  // Simulate rejecting an invitation
  rejectInvitation: (invitationId) => {
    const invitationIndex = invitations.findIndex(inv => inv.id === invitationId);
    if (invitationIndex === -1) return { success: false, error: 'Invitation not found' };
    
    return { 
      success: true, 
      data: { 
        ...clone(invitations[invitationIndex]),
        status_id: -10 
      } 
    };
  },

  // Simulate submitting a review
  submitReview: (invitationId, reviewContent, reviewUrl) => {
    const invitationIndex = invitations.findIndex(inv => inv.id === invitationId);
    if (invitationIndex === -1) return { success: false, error: 'Invitation not found' };
    
    return { 
      success: true, 
      data: { 
        ...clone(invitations[invitationIndex]),
        status_id: 100,
        review_content: reviewContent,
        review_url: reviewUrl
      } 
    };
  },

  // Simulate approving a review
  approveReview: (invitationId) => {
    const invitationIndex = invitations.findIndex(inv => inv.id === invitationId);
    if (invitationIndex === -1) return { success: false, error: 'Review not found' };
    
    return { 
      success: true, 
      data: { 
        ...clone(invitations[invitationIndex]),
        status_id: 1000
      } 
    };
  },

  // Simulate denying a review
  denyReview: (invitationId) => {
    const invitationIndex = invitations.findIndex(inv => inv.id === invitationId);
    if (invitationIndex === -1) return { success: false, error: 'Review not found' };
    
    return { 
      success: true, 
      data: { 
        ...clone(invitations[invitationIndex]),
        status_id: -1000
      } 
    };
  },

  // Simulate creating a business
  createBusiness: (businessData, userId) => {
    const newId = `business-${Date.now()}`;
    
    const newBusiness = {
      id: newId,
      user_id: userId,
      ...businessData,
      platform_urls: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    return { success: true, data: newBusiness };
  },
  
  // Simulate updating a business
  updateBusiness: (businessId, businessData) => {
    const businessIndex = businesses.findIndex(b => b.id === businessId);
    if (businessIndex === -1) return { success: false, error: 'Business not found' };
    
    const updatedBusiness = {
      ...clone(businesses[businessIndex]),
      ...businessData,
      updated_at: new Date().toISOString()
    };
    
    return { success: true, data: updatedBusiness };
  },
  
  // Simulate sending an invitation
  sendInvitation: (invitationData, userId) => {
    const newId = `invitation-${Date.now()}`;
    
    const business = businesses.find(b => b.id === invitationData.business_id);
    if (!business) return { success: false, error: 'Business not found' };
    
    const platform = platforms.find(p => p.id.toString() === invitationData.platform_id.toString());
    if (!platform) return { success: false, error: 'Platform not found' };
    
    const newInvitation = {
      id: newId,
      user_id: userId,
      status_id: 0, // Pending
      ...invitationData,
      review_content: null,
      review_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      business: {
        business_name: business.business_name,
        address: business.address,
        city: business.city,
        state: business.state,
        zip_code: business.zip_code
      },
      platform: {
        id: platform.id,
        name: platform.name
      }
    };
    
    return { success: true, data: newInvitation };
  },
  
  // Simulate adding a platform URL to a business
  addPlatformUrl: (businessId, platformId, url) => {
    const businessIndex = businesses.findIndex(b => b.id === businessId);
    if (businessIndex === -1) return { success: false, error: 'Business not found' };
    
    const platformExists = platforms.some(p => p.id.toString() === platformId.toString());
    if (!platformExists) return { success: false, error: 'Platform not found' };
    
    // For mock purposes we're not actually updating the business array
    return { success: true };
  },
  
  // Simulate removing a platform URL from a business
  removePlatformUrl: (businessId, platformId) => {
    const businessIndex = businesses.findIndex(b => b.id === businessId);
    if (businessIndex === -1) return { success: false, error: 'Business not found' };
    
    // For mock purposes we're not actually updating the business array
    return { success: true };
  }
};