const db = require('../config/db');
const { computeMatchScore, synthesizeArchetype } = require('../services/blueprintEngine');

// User & Profile operations
async function getCurrentUser() {
  const userRes = await db.query("SELECT * FROM users WHERE is_current_user = true LIMIT 1;");
  if (userRes.rows.length === 0) return null;
  const u = userRes.rows[0];

  const bpRes = await db.query("SELECT * FROM blueprints WHERE user_id = $1;", [u.id]);
  const consentRes = await db.query("SELECT * FROM user_consents WHERE user_id = $1;", [u.id]);

  const bp = bpRes.rows[0] || {};
  const consent = consentRes.rows[0] || {};

  return {
    id: u.id,
    phone: u.phone,
    firstName: u.first_name,
    birthYearMonth: u.birth_year_month,
    age: u.age,
    city: u.city,
    intentTimeline: u.intent_timeline,
    familyInvolvement: u.family_involvement,
    profession: u.profession,
    summaryNote: u.summary_note,
    verified: u.verified,
    photoBlurredUntilMutual: u.photo_blurred_until_mutual,
    hideFromSearchEngines: u.hide_from_search_engines,
    photos: typeof u.photos === 'string' ? JSON.parse(u.photos) : u.photos,
    vibes: typeof u.vibes === 'string' ? JSON.parse(u.vibes) : u.vibes,
    quote: u.quote,
    tags: typeof u.tags === 'string' ? JSON.parse(u.tags) : u.tags,
    blueprint: {
      money: bp.money || 72,
      moneyFlexibility: bp.money_flexibility || 'open',
      roots: bp.roots || 31,
      rootsFlexibility: bp.roots_flexibility || 'firm',
      kids: bp.kids || 58,
      kidsFlexibility: bp.kids_flexibility || 'open',
      ambition: bp.ambition || 84,
      ambitionFlexibility: bp.ambition_flexibility || 'firm',
      summaryText: bp.summary_text || synthesizeArchetype(bp),
      profileStrength: bp.profile_strength || 86,
    },
    consent: {
      matching: consent.matching ?? true,
      familySharing: consent.family_sharing ?? true,
      productResearch: consent.product_research ?? false,
      marketing: consent.marketing ?? false,
    },
  };
}

async function updateUserBasics({ firstName, birthYearMonth, city, intentTimeline, familyInvolvement }) {
  await db.query(`
    UPDATE users SET
      first_name = COALESCE($1, first_name),
      birth_year_month = COALESCE($2, birth_year_month),
      city = COALESCE($3, city),
      intent_timeline = COALESCE($4, intent_timeline),
      family_involvement = COALESCE($5, family_involvement)
    WHERE is_current_user = true;
  `, [firstName, birthYearMonth, city, intentTimeline, familyInvolvement]);
  return getCurrentUser();
}

async function updateUserVibes(vibes) {
  await db.query(`
    UPDATE users SET vibes = $1 WHERE is_current_user = true;
  `, [JSON.stringify(vibes.slice(0, 6))]);
  return vibes.slice(0, 6);
}

async function updateUserPhotos({ photoBlurredUntilMutual, hideFromSearchEngines }) {
  await db.query(`
    UPDATE users SET
      photo_blurred_until_mutual = COALESCE($1, photo_blurred_until_mutual),
      hide_from_search_engines = COALESCE($2, hide_from_search_engines)
    WHERE is_current_user = true;
  `, [photoBlurredUntilMutual, hideFromSearchEngines]);
  return getCurrentUser();
}

// Blueprint operations
async function updateUserBlueprint(weights) {
  const user = await getCurrentUser();
  const summary = synthesizeArchetype(weights);

  await db.query(`
    UPDATE blueprints SET
      money = COALESCE($1, money),
      money_flexibility = COALESCE($2, money_flexibility),
      roots = COALESCE($3, roots),
      roots_flexibility = COALESCE($4, roots_flexibility),
      kids = COALESCE($5, kids),
      kids_flexibility = COALESCE($6, kids_flexibility),
      ambition = COALESCE($7, ambition),
      ambition_flexibility = COALESCE($8, ambition_flexibility),
      summary_text = $9,
      updated_at = NOW()
    WHERE user_id = $10;
  `, [
    weights.money, weights.moneyFlexibility,
    weights.roots, weights.rootsFlexibility,
    weights.kids, weights.kidsFlexibility,
    weights.ambition, weights.ambitionFlexibility,
    summary, user.id
  ]);

  return { ...weights, summaryText: summary };
}

// Matches & Candidates
async function getCandidateMatches(filter) {
  const user = await getCurrentUser();
  const candidatesRes = await db.query(`
    SELECT u.*, b.money as bp_money, b.roots as bp_roots, b.kids as bp_kids, b.ambition as bp_ambition
    FROM users u
    LEFT JOIN blueprints b ON b.user_id = u.id
    WHERE u.is_current_user = false
    ORDER BY u.created_at ASC;
  `);

  let candidates = candidatesRes.rows.map((row) => {
    const cBp = {
      money: row.bp_money || 70,
      roots: row.bp_roots || 40,
      kids: row.bp_kids || 55,
      ambition: row.bp_ambition || 80,
    };
    const overlapScores = computeMatchScore(user.blueprint, cBp);

    return {
      id: row.id,
      firstName: row.first_name,
      age: row.age,
      city: row.city,
      profession: row.profession,
      summaryNote: row.summary_note,
      verified: row.verified,
      verifiedDate: row.verified_date,
      quote: row.quote,
      photos: typeof row.photos === 'string' ? JSON.parse(row.photos) : row.photos,
      vibes: typeof row.vibes === 'string' ? JSON.parse(row.vibes) : row.vibes,
      tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags,
      suggestedOpener: row.suggested_opener,
      blueprint: cBp,
      overlapScores,
    };
  });

  if (filter === '80+') {
    candidates = candidates.filter((c) => c.overlapScores.overall >= 80);
  }
  if (filter === 'verified') {
    candidates = candidates.filter((c) => c.verified);
  }

  return candidates;
}

// Family Co-Pilot operations
async function getFamilyLinks() {
  const res = await db.query("SELECT * FROM family_links ORDER BY created_at ASC;");
  return res.rows.map((r) => ({
    id: r.id,
    name: r.name,
    phoneMasked: r.phone_masked,
    status: r.status,
    sharedProfilesCount: r.shared_profiles_count,
    avatarChar: r.avatar_char,
  }));
}

async function createFamilyInvite(parentName, phone) {
  const user = await getCurrentUser();
  const id = `parent-${Date.now()}`;
  const phoneMasked = phone ? `${phone.slice(0, 6)}••••${phone.slice(-3)}` : '+91 98••• ••000';
  const avatarChar = (parentName || 'F')[0];

  await db.query(`
    INSERT INTO family_links (id, user_id, name, phone_masked, status, shared_profiles_count, avatar_char)
    VALUES ($1, $2, $3, $4, 'invited', 0, $5);
  `, [id, user.id, parentName, phoneMasked, avatarChar]);

  return { id, name: parentName, phoneMasked, status: 'invited', sharedProfilesCount: 0, avatarChar };
}

async function getSentFamilyRecords() {
  const res = await db.query("SELECT * FROM shared_to_family ORDER BY created_at DESC;");
  return res.rows.map((r) => ({
    id: r.id,
    candidateId: r.candidate_id,
    candidateName: r.candidate_name,
    candidateAge: r.candidate_age,
    candidateCity: r.candidate_city,
    overlapScore: r.overlap_score,
    recipientParentId: r.recipient_parent_id,
    recipientParentName: r.recipient_parent_name,
    sentAt: r.sent_at,
    status: r.status,
    statusBadge: r.status_badge,
    feedbackNote: r.feedback_note,
    permissions: typeof r.permissions === 'string' ? JSON.parse(r.permissions) : r.permissions,
    expiresIn: r.expires_in,
    childNote: r.child_note,
  }));
}

async function createFamilyShare({ candidateId, recipientParentId, expiresIn, customNote, permissions }) {
  const user = await getCurrentUser();
  const candidateRes = await db.query("SELECT * FROM users WHERE id = $1;", [candidateId]);
  const parentRes = await db.query("SELECT * FROM family_links WHERE id = $1;", [recipientParentId]);

  const candidate = candidateRes.rows[0] || {};
  const parent = parentRes.rows[0] || {};

  const id = `share-${Date.now()}`;
  const record = {
    id,
    senderUserId: user.id,
    candidateId: candidate.id,
    candidateName: candidate.first_name,
    candidateAge: candidate.age,
    candidateCity: candidate.city,
    overlapScore: 85,
    recipientParentId: parent.id,
    recipientParentName: parent.name,
    sentAt: 'Just now',
    status: 'awaiting',
    statusBadge: 'AWAITING REVIEW',
    feedbackNote: 'Awaiting review · reminder in 2 days',
    permissions: permissions || {
      showBlueprintScore: true,
      showFirstNameCity: true,
      showPhoto: false,
      showContact: false,
    },
    expiresIn: expiresIn || '30d',
    childNote: customNote || 'Please review this profile when you have a moment.',
  };

  await db.query(`
    INSERT INTO shared_to_family (
      id, sender_user_id, candidate_id, candidate_name, candidate_age, candidate_city,
      overlap_score, recipient_parent_id, recipient_parent_name, sent_at,
      status, status_badge, feedback_note, permissions, expires_in, child_note
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16);
  `, [
    record.id, record.senderUserId, record.candidateId, record.candidateName,
    record.candidateAge, record.candidateCity, record.overlapScore,
    record.recipientParentId, record.recipientParentName, record.sentAt,
    record.status, record.statusBadge, record.feedbackNote,
    JSON.stringify(record.permissions), record.expiresIn, record.childNote
  ]);

  await db.query("UPDATE family_links SET shared_profiles_count = shared_profiles_count + 1 WHERE id = $1;", [parent.id]);

  return record;
}

async function updateParentFeedback(shareId, decision, note) {
  const badge = decision === 'approved' ? 'AMMA APPROVED' : 'CONCERN RAISED';
  const defaultNote = decision === 'approved' ? '“Sensible about money. Ask about his posting in Pune.”' : '“Concern raised.”';
  const feedbackNote = note || defaultNote;

  const res = await db.query(`
    UPDATE shared_to_family SET
      status = $1,
      status_badge = $2,
      feedback_note = $3
    WHERE id = $4
    RETURNING *;
  `, [decision, badge, feedbackNote, shareId]);

  if (res.rows.length === 0) return null;
  return res.rows[0];
}

// Conversations & Chat
async function getConversations() {
  const convRes = await db.query("SELECT * FROM conversations ORDER BY created_at ASC;");
  const threads = [];

  for (const conv of convRes.rows) {
    const msgRes = await db.query("SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC;", [conv.id]);
    threads.push({
      id: conv.id,
      candidateId: conv.candidate_id,
      candidateName: conv.candidate_name,
      candidateAge: conv.candidate_age,
      candidateCity: conv.candidate_city,
      overlapScore: conv.overlap_score,
      lastMessage: conv.last_message,
      lastMessageTime: conv.last_message_time,
      unread: conv.unread,
      matchedDaysAgo: conv.matched_days_ago,
      isBlurred: conv.is_blurred,
      sharedWithParentStatus: conv.shared_with_parent_status,
      messages: msgRes.rows.map((m) => ({
        id: m.id,
        sender: m.sender,
        text: m.text,
        timestamp: m.timestamp,
      })),
    });
  }

  return threads;
}

async function saveChatMessage(threadId, text) {
  const msgId = `msg-${Date.now()}`;
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  await db.query(`
    INSERT INTO messages (id, conversation_id, sender, text, timestamp)
    VALUES ($1, $2, 'me', $3, $4);
  `, [msgId, threadId, text, timestamp]);

  await db.query(`
    UPDATE conversations SET
      last_message = $1,
      last_message_time = 'Just now'
    WHERE id = $2;
  `, [text, threadId]);

  return { id: msgId, sender: 'me', text, timestamp };
}

// Privacy & DPDP
async function saveDPDPConsents({ matching, familySharing, productResearch, marketing }) {
  const user = await getCurrentUser();
  await db.query(`
    UPDATE user_consents SET
      matching = COALESCE($1, matching),
      family_sharing = COALESCE($2, family_sharing),
      product_research = COALESCE($3, product_research),
      marketing = COALESCE($4, marketing),
      agreed_at = NOW()
    WHERE user_id = $5;
  `, [matching, familySharing, productResearch, marketing, user.id]);

  return { matching, familySharing, productResearch, marketing };
}

async function exportDPDPData() {
  const user = await getCurrentUser();
  const shared = await getSentFamilyRecords();
  const convs = await getConversations();

  return {
    exportDate: new Date().toISOString(),
    legalNotice: "Digital Personal Data Protection (DPDP) Act Compliant Export from PostgreSQL",
    user,
    sharedRecords: shared,
    conversations: convs,
  };
}

async function createErasureRequest() {
  const user = await getCurrentUser();
  const auditReceipt = `DPDP-DEL-HASH-${Date.now().toString(16).toUpperCase()}-${Math.floor(Math.random() * 100000)}`;
  const scheduled = new Date(Date.now() + 72 * 3600 * 1000);

  await db.query(`
    INSERT INTO privacy_logs (id, user_id, action, receipt_hash, scheduled_completion)
    VALUES ($1, $2, 'ACCOUNT_ERASURE_INITIATED', $3, $4);
  `, [`log-${Date.now()}`, user.id, auditReceipt, scheduled]);

  return {
    success: true,
    message: "Erasure request registered in PostgreSQL. Will execute within 72 hours across all tables.",
    auditReceiptHash: auditReceipt,
    retentionDetails: "Only a hashed record of the deletion request is retained for compliance audit."
  };
}

module.exports = {
  getCurrentUser,
  updateUserBasics,
  updateUserVibes,
  updateUserPhotos,
  updateUserBlueprint,
  getCandidateMatches,
  getFamilyLinks,
  createFamilyInvite,
  getSentFamilyRecords,
  createFamilyShare,
  updateParentFeedback,
  getConversations,
  saveChatMessage,
  saveDPDPConsents,
  exportDPDPData,
  createErasureRequest,
};
