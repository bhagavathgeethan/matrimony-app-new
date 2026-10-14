const db = require('../config/db');

async function initializeDatabase() {
  console.log('Initializing PostgreSQL database schema for ab_matrimony...');

  // 1. Users table
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) PRIMARY KEY,
      phone VARCHAR(32) UNIQUE,
      first_name VARCHAR(64) NOT NULL,
      birth_year_month VARCHAR(32),
      age INT,
      city VARCHAR(64),
      intent_timeline VARCHAR(64),
      family_involvement VARCHAR(64),
      profession VARCHAR(128),
      summary_note VARCHAR(255),
      quote TEXT,
      verified BOOLEAN DEFAULT TRUE,
      verified_date VARCHAR(64),
      photo_blurred_until_mutual BOOLEAN DEFAULT TRUE,
      hide_from_search_engines BOOLEAN DEFAULT TRUE,
      photos JSONB DEFAULT '[]'::jsonb,
      vibes JSONB DEFAULT '[]'::jsonb,
      tags JSONB DEFAULT '[]'::jsonb,
      suggested_opener TEXT,
      is_current_user BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // 2. Blueprints table
  await db.query(`
    CREATE TABLE IF NOT EXISTS blueprints (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
      money INT DEFAULT 72,
      money_flexibility VARCHAR(16) DEFAULT 'open',
      roots INT DEFAULT 31,
      roots_flexibility VARCHAR(16) DEFAULT 'firm',
      kids INT DEFAULT 58,
      kids_flexibility VARCHAR(16) DEFAULT 'open',
      ambition INT DEFAULT 84,
      ambition_flexibility VARCHAR(16) DEFAULT 'firm',
      summary_text TEXT,
      profile_strength INT DEFAULT 86,
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // 3. DPDP Consents table
  await db.query(`
    CREATE TABLE IF NOT EXISTS user_consents (
      user_id VARCHAR(64) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      matching BOOLEAN DEFAULT TRUE,
      family_sharing BOOLEAN DEFAULT TRUE,
      product_research BOOLEAN DEFAULT FALSE,
      marketing BOOLEAN DEFAULT FALSE,
      agreed_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // 4. Family Links table
  await db.query(`
    CREATE TABLE IF NOT EXISTS family_links (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(64) NOT NULL,
      phone_masked VARCHAR(32),
      status VARCHAR(32) DEFAULT 'not_linked',
      shared_profiles_count INT DEFAULT 0,
      avatar_char VARCHAR(4),
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // 5. Shared To Family table
  await db.query(`
    CREATE TABLE IF NOT EXISTS shared_to_family (
      id VARCHAR(64) PRIMARY KEY,
      sender_user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
      candidate_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
      candidate_name VARCHAR(64),
      candidate_age INT,
      candidate_city VARCHAR(64),
      overlap_score INT,
      recipient_parent_id VARCHAR(64) REFERENCES family_links(id) ON DELETE CASCADE,
      recipient_parent_name VARCHAR(64),
      sent_at VARCHAR(64),
      status VARCHAR(32) DEFAULT 'awaiting',
      status_badge VARCHAR(64),
      feedback_note TEXT,
      permissions JSONB DEFAULT '{}'::jsonb,
      expires_in VARCHAR(16) DEFAULT '30d',
      child_note TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // 6. Conversations table
  await db.query(`
    CREATE TABLE IF NOT EXISTS conversations (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
      candidate_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
      candidate_name VARCHAR(64),
      candidate_age INT,
      candidate_city VARCHAR(64),
      overlap_score INT,
      last_message TEXT,
      last_message_time VARCHAR(32),
      unread BOOLEAN DEFAULT FALSE,
      matched_days_ago VARCHAR(64),
      is_blurred BOOLEAN DEFAULT FALSE,
      shared_with_parent_status VARCHAR(128),
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // 7. Messages table
  await db.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id VARCHAR(64) PRIMARY KEY,
      conversation_id VARCHAR(64) REFERENCES conversations(id) ON DELETE CASCADE,
      sender VARCHAR(16) NOT NULL,
      text TEXT NOT NULL,
      timestamp VARCHAR(32),
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // 8. Privacy Logs table
  await db.query(`
    CREATE TABLE IF NOT EXISTS privacy_logs (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64),
      action VARCHAR(64) NOT NULL,
      receipt_hash VARCHAR(128),
      scheduled_completion TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  console.log('✓ All PostgreSQL tables verified/created successfully!');

  // Seed default data if empty
  await seedInitialData();
}

async function seedInitialData() {
  const userCheck = await db.query("SELECT id FROM users WHERE id = 'user-ananya-01';");
  if (userCheck.rows.length === 0) {
    console.log('Seeding initial dataset into PostgreSQL ab_matrimony...');

    // 1. Current User (Ananya)
    await db.query(`
      INSERT INTO users (
        id, phone, first_name, birth_year_month, age, city,
        intent_timeline, family_involvement, verified,
        photo_blurred_until_mutual, hide_from_search_engines,
        photos, vibes, quote, tags, is_current_user
      ) VALUES (
        'user-ananya-01', '+91 98765 43210', 'Ananya', 'Mar 1997', 29, 'Bengaluru',
        'Marriage in 1–2 years', 'I consult my parents', true,
        true, true,
        $1, $2,
        'Two incomes, one index fund, and a rule that neither of us checks Slack after 9pm.',
        $3, true
      );
    `, [
      JSON.stringify([
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80'
      ]),
      JSON.stringify(['Temple mornings', 'Cooking together', 'Quiet weekends', 'Dogs everywhere']),
      JSON.stringify(['Both: no big wedding', 'Both: dog people'])
    ]);

    // Ananya's Blueprint
    await db.query(`
      INSERT INTO blueprints (
        id, user_id, money, money_flexibility, roots, roots_flexibility,
        kids, kids_flexibility, ambition, ambition_flexibility,
        summary_text, profile_strength
      ) VALUES (
        'bp-ananya-01', 'user-ananya-01', 72, 'open', 31, 'firm',
        58, 'open', 84, 'firm',
        'In short: a saver who’d move cities for the right role, wants kids within a few years, and won’t apologise for ambition.',
        86
      );
    `);

    // Ananya's Consent
    await db.query(`
      INSERT INTO user_consents (user_id, matching, family_sharing, product_research, marketing)
      VALUES ('user-ananya-01', true, true, false, false);
    `);

    // 2. Candidates
    const candidates = [
      {
        id: 'candidate-rohan-01',
        name: 'Rohan',
        age: 31,
        city: 'Bengaluru',
        profession: 'Senior Product Architect',
        summaryNote: 'saver · wants kids soon',
        verified: true,
        verifiedDate: 'Verified 2 weeks ago',
        bp: { money: 75, roots: 35, kids: 60, ambition: 80 },
        quote: 'Two incomes, one index fund, and a rule that neither of us checks Slack after 9pm.',
        photos: [
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
          'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=600&q=80',
          'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80'
        ],
        vibes: ['Temple mornings', 'Quiet weekends', 'Cooking together', 'Trekking'],
        tags: ['Both: no big wedding', 'Both: dog people'],
        suggestedOpener: 'You both scored low on "stay near parents" — ask him where he actually pictures being at 40.'
      },
      {
        id: 'candidate-aditya-02',
        name: 'Aditya',
        age: 30,
        city: 'Hyderabad',
        profession: 'Fintech Lead',
        summaryNote: 'splitter · flexible on city',
        verified: true,
        verifiedDate: 'Verified 1 month ago',
        bp: { money: 70, roots: 45, kids: 55, ambition: 82 },
        quote: 'Weekends are for slow filter coffee, cycling, and zero corporate buzzwords.',
        photos: [
          'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80',
          'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80',
          'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=600&q=80'
        ],
        vibes: ['Quiet weekends', 'Trekking', 'Dogs everywhere'],
        tags: ['Both: flexible on city', 'Both: early risers'],
        suggestedOpener: 'Ask about his favorite South Indian coffee spots and his views on splitting windfalls.'
      },
      {
        id: 'candidate-meher-03',
        name: 'Meher',
        age: 31,
        city: 'Pune',
        profession: 'UX Director',
        summaryNote: 'creative · high ambition',
        verified: true,
        verifiedDate: 'Verified recently',
        bp: { money: 68, roots: 50, kids: 65, ambition: 86 },
        quote: 'Work hard, travel light, and build an intentional home without social pressure.',
        photos: ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80'],
        vibes: ['Quiet weekends', 'Cooking together', 'Nightlife'],
        tags: ['Both: love arts', 'Both: ambitious'],
        suggestedOpener: 'Connect over balancing high-trajectory careers while protecting evening dinners.'
      },
      {
        id: 'candidate-nikhil-04',
        name: 'Nikhil',
        age: 33,
        city: 'London / Bengaluru',
        profession: 'Systems Engineer',
        summaryNote: 'traveler · moving abroad',
        verified: true,
        verifiedDate: 'Verified 3 weeks ago',
        bp: { money: 62, roots: 80, kids: 50, ambition: 75 },
        quote: 'Keen to explore Europe assignments while staying anchored to family roots.',
        photos: ['https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80'],
        vibes: ['Trekking', 'Big joint family'],
        tags: ['Global mindset'],
        suggestedOpener: 'Discuss how you each handle long-distance family ties and relocation.'
      },
      {
        id: 'candidate-ishaan-05',
        name: 'Ishaan',
        age: 32,
        city: 'Mumbai',
        profession: 'Financier',
        summaryNote: 'express interest · pending',
        verified: true,
        verifiedDate: 'Verified 1 week ago',
        bp: { money: 78, roots: 40, kids: 60, ambition: 85 },
        quote: 'Building long-term wealth while keeping Sundays strictly for family and dogs.',
        photos: ['https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=600&q=80'],
        vibes: ['Dogs everywhere', 'Vegetarian home'],
        tags: ['Investor mindset'],
        suggestedOpener: 'Compare your approaches to long term compounding and downtime.'
      }
    ];

    for (const c of candidates) {
      await db.query(`
        INSERT INTO users (
          id, first_name, age, city, profession, summary_note,
          verified, verified_date, quote, photos, vibes, tags, suggested_opener
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13);
      `, [
        c.id, c.name, c.age, c.city, c.profession, c.summaryNote,
        c.verified, c.verifiedDate, c.quote,
        JSON.stringify(c.photos), JSON.stringify(c.vibes), JSON.stringify(c.tags),
        c.suggestedOpener
      ]);

      await db.query(`
        INSERT INTO blueprints (id, user_id, money, roots, kids, ambition)
        VALUES ($1, $2, $3, $4, $5, $6);
      `, [
        `bp-${c.id}`, c.id, c.bp.money, c.bp.roots, c.bp.kids, c.bp.ambition
      ]);
    }

    // 3. Family Links
    await db.query(`
      INSERT INTO family_links (id, user_id, name, phone_masked, status, shared_profiles_count, avatar_char)
      VALUES
        ('parent-amma', 'user-ananya-01', 'Amma', '+91 98••• ••210', 'linked', 2, 'A'),
        ('parent-appa', 'user-ananya-01', 'Appa', '+91 94••• ••884', 'not_linked', 0, 'A');
    `);

    // 4. Sent To Family Records
    await db.query(`
      INSERT INTO shared_to_family (
        id, sender_user_id, candidate_id, candidate_name, candidate_age, candidate_city,
        overlap_score, recipient_parent_id, recipient_parent_name, sent_at,
        status, status_badge, feedback_note, permissions, expires_in, child_note
      ) VALUES
        (
          'share-rohan-01', 'user-ananya-01', 'candidate-rohan-01', 'Rohan', 31, 'Bengaluru',
          87, 'parent-amma', 'Amma', '2 days ago',
          'approved', 'AMMA APPROVED', '“Sensible about money. Ask about his posting in Pune.”',
          '{"showBlueprintScore":true,"showFirstNameCity":true,"showPhoto":false,"showContact":false}'::jsonb,
          '30d', 'Both of these feel right on money and kids. Tell me what you think before I reply.'
        ),
        (
          'share-aditya-02', 'user-ananya-01', 'candidate-aditya-02', 'Aditya', 30, 'Hyderabad',
          81, 'parent-amma', 'Amma', '3 hours ago',
          'awaiting', 'AWAITING REVIEW', 'Awaiting review · reminder in 2 days',
          '{"showBlueprintScore":true,"showFirstNameCity":true,"showPhoto":false,"showContact":false}'::jsonb,
          '30d', 'Check his geographic preferences and values.'
        ),
        (
          'share-nikhil-03', 'user-ananya-01', 'candidate-nikhil-04', 'Nikhil', 33, 'London / Bengaluru',
          72, 'parent-amma', 'Amma', 'last week',
          'concern_raised', 'CONCERN RAISED', '“He wants to move abroad. Are you sure?”',
          '{"showBlueprintScore":true,"showFirstNameCity":true,"showPhoto":false,"showContact":false}'::jsonb,
          '7d', 'Let me know if London relocation works.'
        );
    `);

    // 5. Conversations & Messages
    await db.query(`
      INSERT INTO conversations (
        id, user_id, candidate_id, candidate_name, candidate_age, candidate_city,
        overlap_score, last_message, last_message_time, unread,
        matched_days_ago, is_blurred, shared_with_parent_status
      ) VALUES
        ('thread-rohan', 'user-ananya-01', 'candidate-rohan-01', 'Rohan', 31, 'Bengaluru', 87, 'Honestly the Bengaluru-vs-Pune thing is my only…', '4m ago', true, 'MATCHED 4 DAYS AGO', false, 'Amma approved Rohan · 2 days ago'),
        ('thread-aditya', 'user-ananya-01', 'candidate-aditya-02', 'Aditya', 30, 'Hyderabad', 81, 'Sent you the answer to the money question', '2h ago', false, 'MATCHED YESTERDAY', false, 'Awaiting Amma review'),
        ('thread-ishaan', 'user-ananya-01', 'candidate-ishaan-05', 'Ishaan', 32, 'Mumbai', 84, 'Waiting for you to accept · expires in 5 days', '1d ago', true, 'RECEIVED YESTERDAY', true, null);
    `);

    await db.query(`
      INSERT INTO messages (id, conversation_id, sender, text, timestamp) VALUES
        ('msg-1', 'thread-rohan', 'them', 'So — where do you picture being at 40? Same city, or somewhere else entirely?', '10:14 AM'),
        ('msg-2', 'thread-rohan', 'me', 'Honestly? Not Bengaluru. Maybe the hills, maybe Lisbon. I need someone who finds that exciting, not alarming.', '10:18 AM'),
        ('msg-3', 'thread-rohan', 'them', 'Alarming is my mother''s department. I''m in.', '10:22 AM'),
        ('msg-a1', 'thread-aditya', 'them', 'Hey Ananya! Loved your answer on the 9pm Slack cutoff.', 'Yesterday'),
        ('msg-a2', 'thread-aditya', 'me', 'Thanks Aditya! Boundaries are non-negotiable for sanity.', 'Yesterday');
    `);

    console.log('✓ Initial dataset seeded successfully into PostgreSQL!');
  }
}

module.exports = {
  initializeDatabase,
};
