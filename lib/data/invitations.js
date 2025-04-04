// Mock invitations data with status codes:
// -1000: Denied
// -10: Rejected
// 0: Pending
// 10: Accepted
// 100: Submitted (review)
// 1000: Approved (review)

export const invitations = [
  {
    id: "invitation-1",
    user_id: "placeholder-user-id",
    business_id: "business-1",
    counter_party_user_id: "another-user-id",
    platform_id: 1,
    status_id: 0, // Pending
    message: "We'd appreciate your feedback on our recent tech support services!",
    review_content: null,
    review_url: null,
    created_at: "2023-03-10T00:00:00Z",
    updated_at: "2023-03-10T00:00:00Z",
    business: {
      business_name: "Tech Solutions Inc",
      address: "123 Tech Blvd",
      city: "San Francisco",
      state: "CA",
      zip_code: "94101"
    },
    platform: {
      id: 1,
      name: "Yelp"
    }
  },
  {
    id: "invitation-2",
    user_id: "placeholder-user-id",
    business_id: "business-2",
    counter_party_user_id: "another-user-id",
    platform_id: 2,
    status_id: 10, // Accepted
    message: "Thanks for choosing our landscaping services. Could you share your experience?",
    review_content: null,
    review_url: null,
    created_at: "2023-03-15T00:00:00Z",
    updated_at: "2023-03-20T00:00:00Z",
    business: {
      business_name: "Green Gardens Landscaping",
      address: "456 Nature Ave",
      city: "Portland",
      state: "OR",
      zip_code: "97201"
    },
    platform: {
      id: 2,
      name: "Google"
    }
  },
  {
    id: "invitation-3",
    user_id: "another-user-id",
    business_id: "business-3",
    counter_party_user_id: "placeholder-user-id",
    platform_id: 3,
    status_id: 100, // Submitted for approval
    message: "Hope you enjoyed our coffee and pastries!",
    review_content: "This café has the best coffee in town! The atmosphere is cozy and the staff is friendly. I highly recommend their croissants - they're freshly baked every morning. Will definitely be back again!",
    review_url: "https://opentable.com/reviews/sunny-day-cafe/12345",
    created_at: "2023-02-25T00:00:00Z",
    updated_at: "2023-03-05T00:00:00Z",
    business: {
      business_name: "Sunny Day Cafe",
      address: "789 Sunshine St",
      city: "Los Angeles",
      state: "CA",
      zip_code: "90001"
    },
    platform: {
      id: 3,
      name: "OpenTable"
    }
  },
  {
    id: "invitation-4",
    user_id: "another-user-id",
    business_id: "business-4",
    counter_party_user_id: "placeholder-user-id",
    platform_id: 4,
    status_id: -10, // Rejected
    message: "Would love to hear about your shopping experience!",
    review_content: null,
    review_url: null,
    created_at: "2023-03-25T00:00:00Z",
    updated_at: "2023-03-26T00:00:00Z",
    business: {
      business_name: "Urban Style Boutique",
      address: "101 Fashion Rd",
      city: "New York",
      state: "NY",
      zip_code: "10001"
    },
    platform: {
      id: 4,
      name: "Facebook"
    }
  },
  {
    id: "invitation-5",
    user_id: "placeholder-user-id",
    business_id: "business-5",
    counter_party_user_id: "another-user-id",
    platform_id: 1,
    status_id: 1000, // Approved
    message: "Thank you for choosing our auto shop. Could you share your experience?",
    review_content: "Great service at Reliable Auto Repair! They fixed my car's brake issues quickly and at a fair price. The mechanics took the time to explain what was wrong and what they were doing to fix it. Very transparent and professional.",
    review_url: "https://yelp.com/reviews/reliable-auto/67890",
    created_at: "2023-02-10T00:00:00Z",
    updated_at: "2023-02-25T00:00:00Z",
    business: {
      business_name: "Reliable Auto Repair",
      address: "321 Mechanics Way",
      city: "Chicago",
      state: "IL",
      zip_code: "60601"
    },
    platform: {
      id: 1,
      name: "Yelp"
    }
  },
  {
    id: "invitation-6",
    user_id: "placeholder-user-id",
    business_id: "business-1",
    counter_party_user_id: "another-user-id-2",
    platform_id: 2,
    status_id: 0, // Pending
    message: "We value your feedback on our tech consultation services!",
    review_content: null,
    review_url: null,
    created_at: "2023-04-01T00:00:00Z",
    updated_at: "2023-04-01T00:00:00Z",
    business: {
      business_name: "Tech Solutions Inc",
      address: "123 Tech Blvd",
      city: "San Francisco",
      state: "CA",
      zip_code: "94101"
    },
    platform: {
      id: 2,
      name: "Google"
    }
  }
];