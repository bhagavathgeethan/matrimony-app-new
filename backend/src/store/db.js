// In-memory / transactional store initialized with UI design specification data

const currentUser = {
  id: "user-ananya-01",
  phone: "+91 98765 43210",
  firstName: "Ananya",
  birthYearMonth: "Mar 1997",
  age: 29,
  city: "Bengaluru",
  intentTimeline: "Marriage in 1–2 years",
  familyInvolvement: "I consult my parents",
  verified: true,
  photoBlurredUntilMutual: true,
  hideFromSearchEngines: true,
  photos: [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80"
  ],
  vibes: ["Temple mornings", "Cooking together", "Quiet weekends", "Dogs everywhere"],
  quote: "Two incomes, one index fund, and a rule that neither of us checks Slack after 9pm.",
  tags: ["Both: no big wedding", "Both: dog people"],
  blueprint: {
    money: 72,
    moneyFlexibility: "open",
    roots: 31,
    rootsFlexibility: "firm",
    kids: 58,
    kidsFlexibility: "open",
    ambition: 84,
    ambitionFlexibility: "firm",
    summaryText: "In short: a saver who'd move cities for the right role, wants kids within a few years, and won't apologise for ambition.",
    profileStrength: 86
  },
  consent: {
    matching: true,
    familySharing: true,
    productResearch: false,
    marketing: false,
    agreedAt: new Date().toISOString()
  }
};

const candidateProfiles = [
  {
    id: "candidate-rohan-01",
    firstName: "Rohan",
    age: 31,
    city: "Bengaluru",
    profession: "Senior Product Architect",
    summaryNote: "saver · wants kids soon",
    verified: true,
    verifiedDate: "Verified 2 weeks ago",
    blueprint: {
      money: 75,
      roots: 35,
      kids: 60,
      ambition: 80
    },
    overlapScores: {
      overall: 87,
      money: 94,
      roots: 71,
      kids: 88,
      ambition: 62
    },
    quote: "Two incomes, one index fund, and a rule that neither of us checks Slack after 9pm.",
    photos: [
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80"
    ],
    vibes: ["Temple mornings", "Quiet weekends", "Cooking together", "Trekking"],
    tags: ["Both: no big wedding", "Both: dog people"],
    suggestedOpener: "You both scored low on \"stay near parents\" — ask him where he actually pictures being at 40."
  },
  {
    id: "candidate-aditya-02",
    firstName: "Aditya",
    age: 30,
    city: "Hyderabad",
    profession: "Fintech Lead",
    summaryNote: "splitter · flexible on city",
    verified: true,
    verifiedDate: "Verified 1 month ago",
    blueprint: {
      money: 70,
      roots: 45,
      kids: 55,
      ambition: 82
    },
    overlapScores: {
      overall: 81,
      money: 88,
      roots: 78,
      kids: 82,
      ambition: 76
    },
    quote: "Weekends are for slow filter coffee, cycling, and zero corporate buzzwords.",
    photos: [
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=600&q=80"
    ],
    vibes: ["Quiet weekends", "Trekking", "Dogs everywhere"],
    tags: ["Both: flexible on city", "Both: early risers"],
    suggestedOpener: "Ask about his favorite South Indian coffee spots and his views on splitting windfalls."
  },
  {
    id: "candidate-meher-03",
    firstName: "Meher",
    age: 31,
    city: "Pune",
    profession: "UX Director",
    summaryNote: "creative · high ambition",
    verified: true,
    verifiedDate: "Verified recently",
    blueprint: {
      money: 68,
      roots: 50,
      kids: 65,
      ambition: 86
    },
    overlapScores: {
      overall: 81,
      money: 84,
      roots: 65,
      kids: 86,
      ambition: 89
    },
    quote: "Work hard, travel light, and build an intentional home without social pressure.",
    photos: [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80"
    ],
    vibes: ["Quiet weekends", "Cooking together", "Nightlife"],
    tags: ["Both: love arts", "Both: ambitious"],
    suggestedOpener: "Connect over balancing high-trajectory careers while protecting evening dinners."
  },
  {
    id: "candidate-nikhil-04",
    firstName: "Nikhil",
    age: 33,
    city: "London / Bengaluru",
    profession: "Systems Engineer",
    summaryNote: "traveler · moving abroad",
    verified: true,
    verifiedDate: "Verified 3 weeks ago",
    blueprint: {
      money: 62,
      roots: 80,
      kids: 50,
      ambition: 75
    },
    overlapScores: {
      overall: 72,
      money: 75,
      roots: 45,
      kids: 80,
      ambition: 88
    },
    quote: "Keen to explore Europe assignments while staying anchored to family roots.",
    photos: [
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80"
    ],
    vibes: ["Trekking", "Big joint family"],
    tags: ["Global mindset"],
    suggestedOpener: "Discuss how you each handle long-distance family ties and relocation."
  },
  {
    id: "candidate-ishaan-05",
    firstName: "Ishaan",
    age: 32,
    city: "Mumbai",
    profession: "Financier",
    summaryNote: "express interest · pending",
    verified: true,
    verifiedDate: "Verified 1 week ago",
    blueprint: {
      money: 78,
      roots: 40,
      kids: 60,
      ambition: 85
    },
    overlapScores: {
      overall: 84,
      money: 90,
      roots: 70,
      kids: 84,
      ambition: 92
    },
    quote: "Building long-term wealth while keeping Sundays strictly for family and dogs.",
    photos: [
      "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=600&q=80"
    ],
    vibes: ["Dogs everywhere", "Vegetarian home"],
    tags: ["Investor mindset"],
    suggestedOpener: "Compare your approaches to long term compounding and downtime."
  }
];

const familyLinks = [
  {
    id: "parent-amma",
    name: "Amma",
    phoneMasked: "+91 98••• ••210",
    status: "linked",
    sharedProfilesCount: 2,
    avatarChar: "A"
  },
  {
    id: "parent-appa",
    name: "Appa",
    phoneMasked: "+91 94••• ••884",
    status: "not_linked",
    sharedProfilesCount: 0,
    avatarChar: "A"
  }
];

const sentToFamilyRecords = [
  {
    id: "share-rohan-01",
    candidateId: "candidate-rohan-01",
    candidateName: "Rohan",
    candidateAge: 31,
    candidateCity: "Bengaluru",
    overlapScore: 87,
    recipientParentId: "parent-amma",
    recipientParentName: "Amma",
    sentAt: "2 days ago",
    status: "approved",
    statusBadge: "AMMA APPROVED",
    feedbackNote: "“Sensible about money. Ask about his posting in Pune.”",
    permissions: {
      showBlueprintScore: true,
      showFirstNameCity: true,
      showPhoto: false,
      showContact: false
    },
    expiresIn: "30d",
    childNote: "Both of these feel right on money and kids. Tell me what you think before I reply."
  },
  {
    id: "share-aditya-02",
    candidateId: "candidate-aditya-02",
    candidateName: "Aditya",
    candidateAge: 30,
    candidateCity: "Hyderabad",
    overlapScore: 81,
    recipientParentId: "parent-amma",
    recipientParentName: "Amma",
    sentAt: "3 hours ago",
    status: "awaiting",
    statusBadge: "AWAITING REVIEW",
    feedbackNote: "Awaiting review · reminder in 2 days",
    permissions: {
      showBlueprintScore: true,
      showFirstNameCity: true,
      showPhoto: false,
      showContact: false
    },
    expiresIn: "30d",
    childNote: "Check his geographic preferences and values."
  },
  {
    id: "share-nikhil-03",
    candidateId: "candidate-nikhil-04",
    candidateName: "Nikhil",
    candidateAge: 33,
    candidateCity: "London / Bengaluru",
    overlapScore: 72,
    recipientParentId: "parent-amma",
    recipientParentName: "Amma",
    sentAt: "last week",
    status: "concern_raised",
    statusBadge: "CONCERN RAISED",
    feedbackNote: "“He wants to move abroad. Are you sure?”",
    permissions: {
      showBlueprintScore: true,
      showFirstNameCity: true,
      showPhoto: false,
      showContact: false
    },
    expiresIn: "7d",
    childNote: "Let me know if London relocation works."
  }
];

const conversations = [
  {
    id: "thread-rohan",
    candidateId: "candidate-rohan-01",
    candidateName: "Rohan",
    candidateAge: 31,
    candidateCity: "Bengaluru",
    overlapScore: 87,
    lastMessage: "Honestly the Bengaluru-vs-Pune thing is my only…",
    lastMessageTime: "4m ago",
    unread: true,
    matchedDaysAgo: "MATCHED 4 DAYS AGO",
    isBlurred: false,
    sharedWithParentStatus: "Amma approved Rohan · 2 days ago",
    messages: [
      {
        id: "msg-1",
        sender: "them",
        text: "So — where do you picture being at 40? Same city, or somewhere else entirely?",
        timestamp: "10:14 AM"
      },
      {
        id: "msg-2",
        sender: "me",
        text: "Honestly? Not Bengaluru. Maybe the hills, maybe Lisbon. I need someone who finds that exciting, not alarming.",
        timestamp: "10:18 AM"
      },
      {
        id: "msg-3",
        sender: "them",
        text: "Alarming is my mother's department. I'm in.",
        timestamp: "10:22 AM"
      }
    ]
  },
  {
    id: "thread-aditya",
    candidateId: "candidate-aditya-02",
    candidateName: "Aditya",
    candidateAge: 30,
    candidateCity: "Hyderabad",
    overlapScore: 81,
    lastMessage: "Sent you the answer to the money question",
    lastMessageTime: "2h ago",
    unread: false,
    matchedDaysAgo: "MATCHED YESTERDAY",
    isBlurred: false,
    sharedWithParentStatus: "Awaiting Amma review",
    messages: [
      {
        id: "msg-a1",
        sender: "them",
        text: "Hey Ananya! Loved your answer on the 9pm Slack cutoff.",
        timestamp: "Yesterday"
      },
      {
        id: "msg-a2",
        sender: "me",
        text: "Thanks Aditya! Boundaries are non-negotiable for sanity.",
        timestamp: "Yesterday"
      }
    ]
  },
  {
    id: "thread-ishaan",
    candidateId: "candidate-ishaan-05",
    candidateName: "Ishaan",
    candidateAge: 32,
    candidateCity: "Mumbai",
    overlapScore: 84,
    lastMessage: "Waiting for you to accept · expires in 5 days",
    lastMessageTime: "1d ago",
    unread: true,
    matchedDaysAgo: "RECEIVED YESTERDAY",
    isBlurred: true,
    sharedWithParentStatus: null,
    messages: []
  }
];

const privacyLogs = [];

module.exports = {
  currentUser,
  candidateProfiles,
  familyLinks,
  sentToFamilyRecords,
  conversations,
  privacyLogs
};
