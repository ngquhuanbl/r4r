'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Fetch all invitations for a user that are in the "pending" status
export async function fetchInvitations(userId) {
  const supabase = createClient();
  
  // First, get the pending status ID
  const { data: pendingStatus, error: statusError } = await supabase
    .from('invitation_statuses')
    .select('id')
    .eq('name', 'PENDING')
    .single();
    
  if (statusError) {
    console.error('Error fetching pending status:', statusError);
    return [];
  }
  
  // Now fetch invitations with that status
  const { data, error } = await supabase
    .from('review_invitations')
    .select(`
      id,
      status_id,
      message,
      business:business_id(
        id,
        business_name,
        address,
        city,
        state,
        zip_code
      ),
      platform:platform_id(
        id,
        name,
        color
      )
    `)
    .eq('invitee_id', userId)
    .eq('status_id', pendingStatus.id)
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error fetching invitations:', error);
    return [];
  }
  
  return data || [];
}

// Fetch all invitations for a user that are in the "accepted" status
export async function fetchAcceptedInvitations(userId) {
  const supabase = createClient();
  
  // First, get the accepted status ID
  const { data: acceptedStatus, error: statusError } = await supabase
    .from('invitation_statuses')
    .select('id')
    .eq('name', 'ACCEPTED')
    .single();
    
  if (statusError) {
    console.error('Error fetching accepted status:', statusError);
    return [];
  }
  
  // Now fetch invitations with that status
  const { data, error } = await supabase
    .from('review_invitations')
    .select(`
      id,
      status_id,
      message,
      business:business_id(
        id,
        business_name,
        address,
        city,
        state,
        zip_code
      ),
      platform:platform_id(
        id,
        name,
        color
      )
    `)
    .eq('invitee_id', userId)
    .eq('status_id', acceptedStatus.id)
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error fetching accepted invitations:', error);
    return [];
  }
  
  // For each invitation, fetch the associated review to get its status
  const invitationsWithReviewStatus = await Promise.all(
    (data || []).map(async (invitation) => {
      const { data: reviewData, error: reviewError } = await supabase
        .from('reviews')
        .select(`
          id,
          status_id,
          content,
          url
        `)
        .eq('invitation_id', invitation.id)
        .single();
        
      if (reviewError) {
        console.error(`Error fetching review for invitation ${invitation.id}:`, reviewError);
        return { ...invitation, review: null };
      }
      
      return { ...invitation, review: reviewData };
    })
  );
  
  return invitationsWithReviewStatus || [];
}

// Fetch all reviews that need to be verified by the user (business owner)
export async function fetchPendingReviews(userId) {
  const supabase = createClient();
  
  // First, get the submitted status ID
  const { data: submittedStatus, error: reviewStatusError } = await supabase
    .from('review_statuses')
    .select('id')
    .eq('name', 'SUBMITTED')
    .single();
    
  if (reviewStatusError) {
    console.error('Error fetching submitted status:', reviewStatusError);
    return [];
  }
  
  // Now fetch submitted reviews where the user is the business owner
  const { data: invitations, error: invitationsError } = await supabase
    .from('review_invitations')
    .select(`
      id,
      business:business_id(
        id,
        business_name,
        address,
        city,
        state,
        zip_code
      ),
      platform:platform_id(
        id,
        name,
        color
      )
    `)
    .eq('inviter_id', userId);
    
  if (invitationsError) {
    console.error('Error fetching invitations for business owner:', invitationsError);
    return [];
  }
  
  if (!invitations || invitations.length === 0) {
    return [];
  }
  
  // Get the reviews for these invitations that are in SUBMITTED status
  const invitationIds = invitations.map(inv => inv.id);
  
  const { data: reviews, error: reviewsError } = await supabase
    .from('reviews')
    .select(`
      id,
      invitation_id,
      content,
      url,
      status_id,
      submitted_at
    `)
    .in('invitation_id', invitationIds)
    .eq('status_id', submittedStatus.id);
    
  if (reviewsError) {
    console.error('Error fetching submitted reviews:', reviewsError);
    return [];
  }
  
  // Combine the review data with the invitation data
  const pendingReviews = reviews.map(review => {
    const invitation = invitations.find(inv => inv.id === review.invitation_id);
    return {
      id: review.id,
      invitation_id: review.invitation_id,
      review_content: review.content,
      review_url: review.url,
      submitted_at: review.submitted_at,
      business: invitation?.business,
      platform: invitation?.platform
    };
  });
  
  return pendingReviews || [];
}

// Accept an invitation
export async function acceptInvitation(invitationId) {
  const supabase = createClient();
  
  // Get the ACCEPTED status ID
  const { data: acceptedStatus, error: statusError } = await supabase
    .from('invitation_statuses')
    .select('id')
    .eq('name', 'ACCEPTED')
    .single();
    
  if (statusError) {
    console.error('Error fetching accepted status:', statusError);
    return { success: false, error: statusError };
  }
  
  // Update the invitation status
  const { data, error } = await supabase
    .from('review_invitations')
    .update({ status_id: acceptedStatus.id })
    .eq('id', invitationId)
    .select();
    
  if (error) {
    console.error('Error accepting invitation:', error);
    return { success: false, error };
  }
  
  // Create an initial draft review
  const { data: draftStatus } = await supabase
    .from('review_statuses')
    .select('id')
    .eq('name', 'DRAFT')
    .single();
    
  if (draftStatus) {
    await supabase
      .from('reviews')
      .insert({
        invitation_id: invitationId,
        status_id: draftStatus.id
      });
  }
  
  revalidatePath('/home');
  return { success: true, data };
}

// Reject an invitation
export async function rejectInvitation(invitationId) {
  const supabase = createClient();
  
  // Get the REJECTED status ID
  const { data: rejectedStatus, error: statusError } = await supabase
    .from('invitation_statuses')
    .select('id')
    .eq('name', 'REJECTED')
    .single();
    
  if (statusError) {
    console.error('Error fetching rejected status:', statusError);
    return { success: false, error: statusError };
  }
  
  // Update the invitation status
  const { data, error } = await supabase
    .from('review_invitations')
    .update({ status_id: rejectedStatus.id })
    .eq('id', invitationId)
    .select();
    
  if (error) {
    console.error('Error rejecting invitation:', error);
    return { success: false, error };
  }
  
  revalidatePath('/home');
  return { success: true, data };
}

// Submit a review
export async function submitReview(invitationId, reviewContent, reviewUrl) {
  const supabase = createClient();
  
  // Get the SUBMITTED status ID
  const { data: submittedStatus, error: statusError } = await supabase
    .from('review_statuses')
    .select('id')
    .eq('name', 'SUBMITTED')
    .single();
    
  if (statusError) {
    console.error('Error fetching submitted status:', statusError);
    return { success: false, error: statusError };
  }
  
  // Get the review ID for this invitation
  const { data: reviewData, error: reviewError } = await supabase
    .from('reviews')
    .select('id')
    .eq('invitation_id', invitationId)
    .single();
    
  if (reviewError) {
    console.error('Error fetching review:', reviewError);
    return { success: false, error: reviewError };
  }
  
  // Update the review
  const { data, error } = await supabase
    .from('reviews')
    .update({ 
      content: reviewContent,
      url: reviewUrl,
      status_id: submittedStatus.id,
      submitted_at: new Date().toISOString()
    })
    .eq('id', reviewData.id)
    .select();
    
  if (error) {
    console.error('Error submitting review:', error);
    return { success: false, error };
  }
  
  // Ensure all relevant paths are revalidated
  revalidatePath('/home', 'layout');
  revalidatePath('/home', 'page');
  return { success: true, data, status_id: submittedStatus.id };
}

// Approve a review
export async function approveReview(reviewId) {
  const supabase = createClient();
  
  // Get the VERIFIED status ID
  const { data: verifiedStatus, error: statusError } = await supabase
    .from('review_statuses')
    .select('id')
    .eq('name', 'VERIFIED')
    .single();
    
  if (statusError) {
    console.error('Error fetching verified status:', statusError);
    return { success: false, error: statusError };
  }
  
  // Update the review status
  const { data, error } = await supabase
    .from('reviews')
    .update({ 
      status_id: verifiedStatus.id,
      verified_at: new Date().toISOString()
    })
    .eq('id', reviewId)
    .select();
    
  if (error) {
    console.error('Error approving review:', error);
    return { success: false, error };
  }
  
  // Get the review details for revalidation
  const { data: reviewData } = await supabase
    .from('reviews')
    .select('invitation_id')
    .eq('id', reviewId)
    .single();
    
  if (reviewData) {
    const { data: invitationData } = await supabase
      .from('review_invitations')
      .select('invitee_id, inviter_id')
      .eq('id', reviewData.invitation_id)
      .single();
      
    if (invitationData) {
      // Revalidate paths for both business owner and reviewer
      revalidatePath('/home');
      revalidatePath('/businesses');
    }
  }
  
  return { success: true, data };
}

// Deny a review
export async function denyReview(reviewId) {
  const supabase = createClient();
  
  // Get the REJECTED status ID
  const { data: rejectedStatus, error: statusError } = await supabase
    .from('review_statuses')
    .select('id')
    .eq('name', 'REJECTED')
    .single();
    
  if (statusError) {
    console.error('Error fetching rejected status:', statusError);
    return { success: false, error: statusError };
  }
  
  // Update the review status
  const { data, error } = await supabase
    .from('reviews')
    .update({ 
      status_id: rejectedStatus.id
    })
    .eq('id', reviewId)
    .select();
    
  if (error) {
    console.error('Error denying review:', error);
    return { success: false, error };
  }
  
  // Get the review details for revalidation
  const { data: reviewData } = await supabase
    .from('reviews')
    .select('invitation_id')
    .eq('id', reviewId)
    .single();
    
  if (reviewData) {
    const { data: invitationData } = await supabase
      .from('review_invitations')
      .select('invitee_id, inviter_id')
      .eq('id', reviewData.invitation_id)
      .single();
      
    if (invitationData) {
      // Revalidate paths for both business owner and reviewer
      revalidatePath('/home');
      revalidatePath('/businesses');
    }
  }
  
  return { success: true, data };
}