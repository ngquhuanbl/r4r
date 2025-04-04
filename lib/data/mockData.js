// Mock data just for UI display purposes
// These don't replace the server actions, just provide data to show in the UI

// Mock platforms
export const platforms = [
  { id: 1, name: "Yelp" },
  { id: 2, name: "Google" },
  { id: 3, name: "OpenTable" },
  { id: 4, name: "Facebook" },
  { id: 5, name: "TripAdvisor" },
  { id: 6, name: "Zomato" },
  { id: 7, name: "Zagat" }
];

// Mock businesses
export const businesses = [
  {
    id: "business-1",
    business_name: "Tech Solutions Inc",
    phone: "555-123-4567",
    address: "123 Tech Blvd",
    city: "San Francisco",
    state: "CA",
    zip_code: "94101",
    platform_urls: {
      "1": "https://yelp.com/tech-solutions",
      "2": "https://google.com/maps/tech-solutions"
    }
  },
  {
    id: "business-2",
    business_name: "Green Gardens Landscaping",
    phone: "555-789-0123",
    address: "456 Nature Ave",
    city: "Portland",
    state: "OR",
    zip_code: "97201",
    platform_urls: {
      "2": "https://google.com/maps/green-gardens",
      "4": "https://facebook.com/green-gardens"
    }
  },
  {
    id: "business-3",
    business_name: "Reliable Auto Repair",
    phone: "555-987-6543",
    address: "321 Mechanics Way",
    city: "Chicago",
    state: "IL",
    zip_code: "60601",
    platform_urls: {
      "1": "https://yelp.com/reliable-auto",
      "2": "https://google.com/maps/reliable-auto",
      "4": "https://facebook.com/reliable-auto"
    }
  }
];

// Mock pending invitations (status_id: 0)
export const pendingInvitations = [
  {
    id: "invitation-1",
    status_id: 0,
    business: {
      id: "business-other-1",
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
    id: "invitation-2",
    status_id: 0,
    business: {
      id: "business-other-2",
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
    id: "invitation-3",
    status_id: 0,
    business: {
      id: "business-other-3",
      business_name: "Gourmet Bistro",
      address: "222 Culinary Ave",
      city: "San Diego",
      state: "CA",
      zip_code: "92101"
    },
    platform: {
      id: 1,
      name: "Yelp"
    }
  },
  {
    id: "invitation-4",
    status_id: 0,
    business: {
      id: "business-other-4",
      business_name: "City Fitness Center",
      address: "555 Workout Blvd",
      city: "Miami",
      state: "FL",
      zip_code: "33101"
    },
    platform: {
      id: 2,
      name: "Google"
    }
  },
  {
    id: "invitation-5",
    status_id: 0,
    business: {
      id: "business-other-5",
      business_name: "Riverside Spa & Wellness",
      address: "888 Relaxation Way",
      city: "Seattle",
      state: "WA",
      zip_code: "98101"
    },
    platform: {
      id: 5,
      name: "TripAdvisor"
    }
  }
];

// Mock accepted invitations (status_id: 10)
export const acceptedInvitations = [
  {
    id: "invitation-6",
    status_id: 10,
    business: {
      id: "business-other-6",
      business_name: "Creative Design Agency",
      address: "555 Creative Ave",
      city: "Austin",
      state: "TX",
      zip_code: "78701"
    },
    platform: {
      id: 2,
      name: "Google"
    }
  },
  {
    id: "invitation-7",
    status_id: 10,
    business: {
      id: "business-other-7",
      business_name: "Mountain View Resort",
      address: "888 Mountain Dr",
      city: "Denver",
      state: "CO",
      zip_code: "80202"
    },
    platform: {
      id: 5,
      name: "TripAdvisor"
    }
  },
  {
    id: "invitation-8",
    status_id: 10,
    business: {
      id: "business-other-8",
      business_name: "Digital Marketing Solutions",
      address: "123 Marketing St",
      city: "Boston",
      state: "MA",
      zip_code: "02108"
    },
    platform: {
      id: 4,
      name: "Facebook"
    }
  },
  {
    id: "invitation-9",
    status_id: 10,
    business: {
      id: "business-other-9",
      business_name: "Urban Coffee Shop",
      address: "456 Espresso Ln",
      city: "Portland",
      state: "OR",
      zip_code: "97201"
    },
    platform: {
      id: 1,
      name: "Yelp"
    }
  },
  {
    id: "invitation-10",
    status_id: 10,
    business: {
      id: "business-other-10",
      business_name: "Coastal Seafood Restaurant",
      address: "789 Ocean Blvd",
      city: "San Francisco",
      state: "CA",
      zip_code: "94105"
    },
    platform: {
      id: 3,
      name: "OpenTable"
    }
  }
];

// Mock pending reviews (status_id: 100)
export const pendingReviews = [
  {
    id: "review-1",
    status_id: 100,
    review_content: "This auto shop provided excellent service. They fixed my car's brake issues quickly and at a fair price. The mechanics were very professional and transparent about what needed to be done.",
    review_url: "https://yelp.com/reviews/autoshop/12345",
    business: {
      id: "business-other-11",
      business_name: "Quick Fix Auto Shop",
      address: "123 Mechanic St",
      city: "Phoenix",
      state: "AZ",
      zip_code: "85001"
    },
    platform: {
      id: 1,
      name: "Yelp"
    }
  },
  {
    id: "review-2",
    status_id: 100,
    review_content: "Great meal at Gourmet Cuisine! The food was delicious and the service was excellent. I particularly enjoyed their signature pasta dish and the wine selection was impressive. Will definitely be coming back.",
    review_url: "https://opentable.com/reviews/restaurant/67890",
    business: {
      id: "business-other-12",
      business_name: "Gourmet Cuisine",
      address: "456 Foodie Blvd",
      city: "Chicago",
      state: "IL",
      zip_code: "60601"
    },
    platform: {
      id: 3,
      name: "OpenTable"
    }
  },
  {
    id: "review-3",
    status_id: 100,
    review_content: "Top-notch legal services from this firm. They were professional, attentive, and really fought for my case. Their communication was excellent throughout the process, and they always made sure I understood what was happening. Highly recommend their services to anyone needing legal assistance.",
    review_url: "https://google.com/reviews/lawfirm/54321",
    business: {
      id: "business-other-13",
      business_name: "Johnson & Smith Law Firm",
      address: "777 Legal Pkwy",
      city: "New York",
      state: "NY",
      zip_code: "10017"
    },
    platform: {
      id: 2,
      name: "Google"
    }
  },
  {
    id: "review-4",
    status_id: 100,
    review_content: "Had an amazing stay at this boutique hotel! The staff went above and beyond to make our anniversary special. The room was beautifully decorated and spotless. The location is perfect - walking distance to all the major attractions, yet on a quiet street. Will definitely stay here again on our next trip.",
    review_url: "https://tripadvisor.com/reviews/hotel/13579",
    business: {
      id: "business-other-14",
      business_name: "Heritage Boutique Hotel",
      address: "555 Luxury Ave",
      city: "Charleston",
      state: "SC",
      zip_code: "29401"
    },
    platform: {
      id: 5,
      name: "TripAdvisor"
    }
  },
  {
    id: "review-5",
    status_id: 100,
    review_content: "My go-to bookstore for the past few years! Their selection is incredible, with both popular titles and hard-to-find gems. The staff recommendations have never disappointed me. I also love their monthly book club events - great discussions and a wonderful way to meet fellow book lovers in the community.",
    review_url: "https://facebook.com/reviews/bookstore/97531",
    business: {
      id: "business-other-15",
      business_name: "Page Turner Books",
      address: "321 Reader's Lane",
      city: "Seattle",
      state: "WA",
      zip_code: "98112"
    },
    platform: {
      id: 4,
      name: "Facebook"
    }
  },
  {
    id: "review-6",
    status_id: 100,
    review_content: "The food here is authentic and delicious! I've tried many Indian restaurants in the city, but this one truly stands out. The butter chicken was creamy and flavorful, and the naan bread was perfectly cooked. Service was attentive without being intrusive. Prices are very reasonable for the quality and portion sizes.",
    review_url: "https://zomato.com/reviews/restaurant/24680",
    business: {
      id: "business-other-16",
      business_name: "Spice Route Indian Cuisine",
      address: "987 Curry St",
      city: "Houston",
      state: "TX",
      zip_code: "77002"
    },
    platform: {
      id: 6,
      name: "Zomato"
    }
  }
];