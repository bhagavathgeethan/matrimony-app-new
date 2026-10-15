// Family co-pilot: invited parents get a private portal link and see only what is shared with them
const express = require('express');
const env = require('../config/env');
const db = require('../config/db');
const sms = require('../services/sms');
const realtime = require('../services/realtime');
const notifications = require('./notifications');
const storage = require('../services/storage');
const { computeMatchScore } = require('../services/blueprintEngine');
const { blueprintFromRow, detailValues, updateDetails } = require('./profile');
const { getCandidate } = require('./matches');
const { httpError, newId, randomToken, normalizePhone, maskPhone, ageFrom, relativeTime } = require('../lib/util');
const { route, optionalString, oneOf } = require('../lib/http');

const router = express.Router();
const portalRouter = express.Router();

const MAX_LINKS = 4;
const EXPIRY = { '7d': 7, '30d': 30, never: null };
const DEFAULT_PERMISSIONS = { showBlueprintScore: true, showFirstNameCity: true, showPhoto: false, showContact: false };
const DECISIONS = ['approved', 'unsure', 'concern_raised'];
const DEFAULT_NOTES = { approved: 'Looks good to me.', unsure: 'Not sure yet — let’s discuss.', concern_raised: 'I have some concerns — let’s talk.' };

const portalUrl = (token) => `${env.PUBLIC_BASE_URL}/portal/${token}`;

function toLink(r) {
  return {
    id: r.id,
    name: r.name,
    relation: r.relation,
    phoneMasked: maskPhone(r.phone),
    status: r.status,
    sharedProfilesCount: Number(r.shared_count || 0),
    avatarChar: (r.name || '?')[0].toUpperCase(),
    portalUrl: r.status === 'revoked' ? null : portalUrl(r.portal_token),
    portalToken: r.status === 'revoked' ? null : r.portal_token,
    canManage: Boolean(r.can_manage),
    createdAt: r.created_at,
    linkedAt: r.linked_at,
  };
}

// Lets a linked family member edit your personal details from their portal (or stops it)
async function setManage(userId, linkId, canManage) {
  if (typeof canManage !== 'boolean') throw httpError(400, 'canManage must be true or false');
  await ownLink(userId, linkId);
  await db.query('UPDATE family_links SET can_manage = $2 WHERE id = $1', [linkId, canManage]);
  return (await listLinks(userId)).find((l) => l.id === linkId);
}

async function listLinks(userId) {
  const res = await db.query(
    `SELECT l.*, (SELECT COUNT(*) FROM family_shares s WHERE s.family_link_id = l.id) AS shared_count
     FROM family_links l WHERE l.user_id = $1 AND l.status <> 'revoked' ORDER BY l.created_at`,
    [userId]
  );
  return res.rows.map(toLink);
}

async function childName(userId) {
  return (await db.query('SELECT first_name FROM users WHERE id = $1', [userId])).rows[0]?.first_name || 'Your child';
}

async function createLink(userId, body) {
  const name = optionalString(body, 'name', { max: 60 });
  const relation = optionalString(body, 'relation', { max: 30, allowEmpty: true });
  const phone = normalizePhone(body.phone);
  if (!name) throw httpError(400, 'Enter their name');
  if (!phone) throw httpError(400, 'Enter a valid mobile number');

  const me = (await db.query('SELECT phone FROM users WHERE id = $1', [userId])).rows[0];
  if (me.phone === phone) throw httpError(400, 'Use a family member’s number, not your own');
  const active = await db.query(
    `SELECT phone FROM family_links WHERE user_id = $1 AND status <> 'revoked'`,
    [userId]
  );
  if (active.rows.some((l) => l.phone === phone)) throw httpError(409, 'This number is already linked');
  if (active.rows.length >= MAX_LINKS) throw httpError(400, `You can link up to ${MAX_LINKS} family members`);

  const token = randomToken(24);
  const res = await db.query(
    `INSERT INTO family_links (id, user_id, name, relation, phone, portal_token)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [newId(), userId, name, relation || null, phone, token]
  );
  await sms.sendFamilyInvite(phone, { childName: await childName(userId), parentName: name, portalUrl: portalUrl(token) });
  return toLink(res.rows[0]);
}

async function ownLink(userId, linkId) {
  const res = await db.query(
    `SELECT * FROM family_links WHERE id = $1 AND user_id = $2 AND status <> 'revoked'`,
    [linkId, userId]
  );
  if (!res.rows[0]) throw httpError(404, 'Family member not found');
  return res.rows[0];
}

async function resendInvite(userId, linkId) {
  const link = await ownLink(userId, linkId);
  await sms.sendFamilyInvite(link.phone, {
    childName: await childName(userId), parentName: link.name, portalUrl: portalUrl(link.portal_token),
  });
  return toLink(link);
}

async function revokeLink(userId, linkId) {
  await ownLink(userId, linkId);
  await db.query(`UPDATE family_links SET status = 'revoked', revoked_at = NOW() WHERE id = $1`, [linkId]);
  return { success: true };
}

function badge(status, parentName) {
  if (status === 'approved') return `${parentName.toUpperCase()} APPROVED`;
  if (status === 'concern_raised') return 'CONCERN RAISED';
  if (status === 'unsure') return `${parentName.toUpperCase()} IS UNSURE`;
  return 'AWAITING REVIEW';
}

const isExpired = (r) => r.expires_at && new Date(r.expires_at) < new Date();

async function listShares(userId) {
  const res = await db.query(
    `SELECT s.*, l.name AS parent_name, u.first_name, u.birth_year, u.birth_month, u.city,
            row_to_json(b.*) AS bp,
            (SELECT p.blur_key FROM photos p WHERE p.user_id = u.id ORDER BY p.position LIMIT 1) AS blur_key
     FROM family_shares s
     JOIN family_links l ON l.id = s.family_link_id
     JOIN users u ON u.id = s.candidate_id
     LEFT JOIN blueprints b ON b.user_id = u.id
     WHERE s.user_id = $1
     ORDER BY s.created_at DESC`,
    [userId]
  );
  const myBp = blueprintFromRow((await db.query('SELECT row_to_json(b.*) AS bp FROM blueprints b WHERE user_id = $1', [userId])).rows[0]?.bp);
  return res.rows.map((r) => ({
    id: r.id,
    candidateId: r.candidate_id,
    candidateName: r.first_name,
    candidateAge: ageFrom(r.birth_year, r.birth_month),
    candidateCity: r.city,
    candidatePhoto: r.blur_key ? storage.url(r.blur_key) : null,
    overlapScore: myBp && r.bp ? computeMatchScore(myBp, blueprintFromRow(r.bp)).overall : null,
    recipientParentId: r.family_link_id,
    recipientParentName: r.parent_name,
    sentAt: relativeTime(r.created_at),
    status: r.status,
    statusBadge: badge(r.status, r.parent_name),
    feedbackNote: r.status === 'awaiting' ? 'Awaiting review' : r.feedback_note,
    permissions: r.permissions,
    childNote: r.child_note,
    expiresAt: r.expires_at,
    expired: Boolean(isExpired(r)),
  }));
}

async function createShares(userId, body) {
  const consent = (await db.query('SELECT family_sharing FROM consents WHERE user_id = $1', [userId])).rows[0];
  if (!consent?.family_sharing) {
    throw httpError(403, 'Turn on family sharing in your consent settings first', 'NO_FAMILY_CONSENT');
  }
  const candidateIds = Array.isArray(body.candidateIds) ? [...new Set(body.candidateIds)] : [];
  if (!candidateIds.length || candidateIds.length > 10) throw httpError(400, 'Choose between 1 and 10 profiles');
  const expiresIn = oneOf(body, 'expiresIn', Object.keys(EXPIRY)) || '30d';
  const note = optionalString(body, 'note', { max: 500, allowEmpty: true }) || null;
  const link = await ownLink(userId, body.familyLinkId);

  // Contact details are never shareable, whatever the client sends
  const permissions = { ...DEFAULT_PERMISSIONS };
  for (const key of ['showBlueprintScore', 'showFirstNameCity', 'showPhoto']) {
    if (typeof body.permissions?.[key] === 'boolean') permissions[key] = body.permissions[key];
  }

  for (const candidateId of candidateIds) {
    if (!(await getCandidate(userId, candidateId))) throw httpError(404, 'One of these profiles is no longer available');
  }
  const days = EXPIRY[expiresIn];
  const ids = [];
  await db.transaction(async (client) => {
    for (const candidateId of candidateIds) {
      const id = newId();
      ids.push(id);
      await client.query(
        `INSERT INTO family_shares (id, user_id, candidate_id, family_link_id, permissions, child_note, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, CASE WHEN $7::int IS NULL THEN NULL ELSE NOW() + make_interval(days => $7::int) END)`,
        [id, userId, candidateId, link.id, JSON.stringify(permissions), note, days]
      );
    }
  });
  const all = await listShares(userId);
  return all.filter((s) => ids.includes(s.id));
}

// ---------- parent portal (no account; the unguessable token is the credential) ----------

async function linkForToken(token) {
  if (!/^[0-9a-f]{48}$/.test(token || '')) return null;
  const res = await db.query(`SELECT * FROM family_links WHERE portal_token = $1 AND status <> 'revoked'`, [token]);
  return res.rows[0] || null;
}

async function getPortal(token) {
  const link = await linkForToken(token);
  if (!link) throw httpError(404, 'This link is invalid or access has been revoked');
  if (link.status === 'invited') {
    await db.query(`UPDATE family_links SET status = 'linked', linked_at = NOW() WHERE id = $1`, [link.id]);
    await notifications.notify(link.user_id, {
      type: 'family_linked',
      title: `${link.name} opened your family link`,
      body: `${link.name} can now see the profiles you share with them.`,
      data: { familyLinkId: link.id },
    });
  }
  const child = (await db.query(
    `SELECT u.first_name, row_to_json(b.*) AS bp FROM users u LEFT JOIN blueprints b ON b.user_id = u.id WHERE u.id = $1`,
    [link.user_id]
  )).rows[0];
  const childBp = blueprintFromRow(child?.bp);

  const res = await db.query(
    `SELECT s.*, u.first_name, u.birth_year, u.birth_month, u.city, u.id_verified_at, row_to_json(b.*) AS bp,
            (SELECT row_to_json(p.*) FROM photos p WHERE p.user_id = u.id ORDER BY p.position LIMIT 1) AS photo
     FROM family_shares s
     JOIN users u ON u.id = s.candidate_id
     LEFT JOIN blueprints b ON b.user_id = u.id
     WHERE s.family_link_id = $1 AND (s.expires_at IS NULL OR s.expires_at > NOW())
     ORDER BY s.created_at DESC`,
    [link.id]
  );

  // Family members the child allowed to manage the profile also get the personal details to edit
  const manage = link.can_manage
    ? detailValues((await db.query('SELECT * FROM users WHERE id = $1', [link.user_id])).rows[0])
    : null;
  return {
    childName: child?.first_name || 'Your child',
    parentName: link.name,
    canManage: Boolean(link.can_manage),
    profileDetails: manage,
    records: res.rows.map((r) => {
      const p = r.permissions;
      const scores = childBp && r.bp ? computeMatchScore(childBp, blueprintFromRow(r.bp)) : null;
      return {
        id: r.id,
        candidateName: p.showFirstNameCity ? r.first_name : 'Name hidden',
        candidateAge: ageFrom(r.birth_year, r.birth_month),
        candidateCity: p.showFirstNameCity ? r.city : null,
        idVerified: Boolean(r.id_verified_at),
        overlapScore: p.showBlueprintScore && scores ? scores.overall : null,
        pillarScores: p.showBlueprintScore ? scores : null,
        photo: r.photo ? storage.url(p.showPhoto ? r.photo.storage_key : r.photo.blur_key) : null,
        photoBlurred: !p.showPhoto,
        childNote: r.child_note,
        status: r.status,
        feedbackNote: r.feedback_note,
        sharedAt: relativeTime(r.created_at),
        expiresAt: r.expires_at,
      };
    }),
  };
}

async function respond(token, shareId, body) {
  const link = await linkForToken(token);
  if (!link) throw httpError(404, 'This link is invalid or access has been revoked');
  const decision = oneOf(body, 'decision', DECISIONS);
  if (!decision) throw httpError(400, 'decision must be approved, unsure or concern_raised');
  const note = optionalString(body, 'note', { max: 500, allowEmpty: true });

  const share = (await db.query(
    'SELECT * FROM family_shares WHERE id = $1 AND family_link_id = $2',
    [shareId, link.id]
  )).rows[0];
  if (!share) throw httpError(404, 'Profile not found');
  if (isExpired(share)) throw httpError(410, 'Access to this profile has expired');

  const defaultNote = DEFAULT_NOTES[decision];
  await db.query(
    `UPDATE family_shares SET status = $2, feedback_note = $3, responded_at = NOW() WHERE id = $1`,
    [shareId, decision, note || defaultNote]
  );
  const updated = (await listShares(share.user_id)).find((s) => s.id === shareId);
  realtime.notify(share.user_id, 'family:feedback', { share: updated });
  await notifications.notify(share.user_id, {
    type: 'family_feedback',
    title: {
      approved: `${link.name} approved ${updated.candidateName}`,
      unsure: `${link.name} is unsure about ${updated.candidateName}`,
      concern_raised: `${link.name} raised a concern about ${updated.candidateName}`,
    }[decision],
    body: updated.feedbackNote,
    data: { shareId, candidateId: share.candidate_id },
  });
  return updated;
}

// Family votes across everyone a profile was shared with, grouped by candidate
async function votes(userId) {
  const shares = await listShares(userId);
  const byCandidate = new Map();
  for (const s of shares) {
    if (!byCandidate.has(s.candidateId)) {
      byCandidate.set(s.candidateId, {
        candidateId: s.candidateId, candidateName: s.candidateName, candidateAge: s.candidateAge, candidateCity: s.candidateCity,
        candidatePhoto: s.candidatePhoto, overlapScore: s.overlapScore, votes: [], tally: { approved: 0, unsure: 0, concern_raised: 0, awaiting: 0 },
      });
    }
    const group = byCandidate.get(s.candidateId);
    group.votes.push({ shareId: s.id, name: s.recipientParentName, status: s.status, note: s.status === 'awaiting' ? null : s.feedbackNote, sentAt: s.sentAt });
    group.tally[s.status] = (group.tally[s.status] || 0) + 1;
  }
  return [...byCandidate.values()];
}

// Portal: a managing family member edits the personal details (not the name)
async function portalUpdateDetails(token, body) {
  const link = await linkForToken(token);
  if (!link) throw httpError(404, 'This link is invalid or access has been revoked');
  if (!link.can_manage) throw httpError(403, 'You haven’t been given access to edit this profile');
  if (body && Object.prototype.hasOwnProperty.call(body, 'firstName')) throw httpError(400, 'The name can only be changed by the member');
  const profile = await updateDetails(link.user_id, body || {});
  await notifications.notify(link.user_id, {
    type: 'family_edit',
    title: `${link.name} updated your personal details`,
    body: 'Check your profile to see the changes.',
    data: { familyLinkId: link.id },
  });
  return { profileDetails: profile.details };
}

// Child-side routes (auth required; mounted at /api/family)
router.get('/votes', route(async (req, res) => res.json(await votes(req.userId))));
router.put('/links/:id', route(async (req, res) => res.json(await setManage(req.userId, req.params.id, req.body?.canManage))));
router.get('/links', route(async (req, res) => res.json(await listLinks(req.userId))));
router.post('/links', route(async (req, res) => res.status(201).json(await createLink(req.userId, req.body || {}))));
router.post('/links/:id/resend', route(async (req, res) => res.json(await resendInvite(req.userId, req.params.id))));
router.delete('/links/:id', route(async (req, res) => res.json(await revokeLink(req.userId, req.params.id))));
router.get('/shares', route(async (req, res) => res.json(await listShares(req.userId))));
router.post('/shares', route(async (req, res) => res.status(201).json(await createShares(req.userId, req.body || {}))));

// Parent portal routes (public; mounted at /api/portal)
portalRouter.get('/:token', route(async (req, res) => res.json(await getPortal(req.params.token))));
portalRouter.put('/:token/details', route(async (req, res) => res.json(await portalUpdateDetails(req.params.token, req.body))));
portalRouter.post('/:token/shares/:shareId/feedback', route(async (req, res) => {
  res.json(await respond(req.params.token, req.params.shareId, req.body || {}));
}));

module.exports = { router, portalRouter, listLinks, listShares };
