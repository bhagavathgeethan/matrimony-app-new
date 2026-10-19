// Premium compatibility report (PDF), including the horoscope match when both members opted in.
// The app asks for a short-lived signed link, which then opens in any browser or PDF viewer (no session needed).
const crypto = require('crypto');
const express = require('express');
const PDFDocument = require('pdfkit');
const env = require('../config/env');
const db = require('../config/db');
const { compare, getCandidate } = require('./matches');
const { requireFeature } = require('../lib/members');
const { httpError } = require('../lib/util');
const { route } = require('../lib/http');
const { PILLARS } = require('../../../shared/constants.js');

const router = express.Router();
const publicRouter = express.Router();
const LINK_MINUTES = 10;
const SECRET = process.env.REPORT_SECRET || crypto.createHash('sha256').update(`report:${env.DATABASE_URL}`).digest('hex');

const b64 = (s) => Buffer.from(s).toString('base64url');
const sign = (payload) => crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');

function makeToken(viewerId, candidateId) {
  const payload = b64(JSON.stringify({ v: viewerId, c: candidateId, exp: Date.now() + LINK_MINUTES * 60000 }));
  return `${payload}.${sign(payload)}`;
}

function readToken(token) {
  const [payload, sig] = String(token || '').split('.');
  if (!payload || !sig) return null;
  const expected = sign(payload);
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return data.exp > Date.now() ? data : null;
  } catch {
    return null;
  }
}

async function reportLink(userId, candidateId) {
  const me = (await db.query('SELECT plan, premium_until, plan_paused_at FROM users WHERE id = $1', [userId])).rows[0];
  requireFeature(me, 'deepReport');
  if (!(await getCandidate(userId, candidateId))) throw httpError(404, 'Profile not found');
  const path = `/api/public/report/${makeToken(userId, candidateId)}`;
  return { url: `${env.PUBLIC_BASE_URL}${path}`, path, expiresInMinutes: LINK_MINUTES };
}

const VERDICT = { aligned: 'Aligned', close: 'Close enough', talk: 'Worth a talk', dealbreaker: 'Possible dealbreaker' };

async function renderPdf(viewerId, candidateId) {
  const card = await getCandidate(viewerId, candidateId);
  if (!card) throw httpError(404, 'Profile not found');
  const cmp = await compare(viewerId, candidateId);
  const me = (await db.query('SELECT first_name FROM users WHERE id = $1', [viewerId])).rows[0];

  const doc = new PDFDocument({ size: 'A4', margin: 50, info: { Title: `3Knot Matrimony compatibility — ${me.first_name} & ${card.firstName}` } });
  const chunks = [];
  doc.on('data', (c) => chunks.push(c));
  const done = new Promise((resolve) => doc.on('end', () => resolve(Buffer.concat(chunks))));

  const crimson = '#A81E3C';
  const muted = '#6F5E55';
  doc.fillColor(crimson).fontSize(22).text('3Knot Matrimony', { continued: true }).fillColor(muted).fontSize(12).text('   Compatibility report');
  doc.moveDown(0.5);
  doc.fillColor('#23140F').fontSize(18).text(`${me.first_name} & ${card.firstName}, ${card.age}`);
  doc.fillColor(muted).fontSize(11).text(`${card.city || ''} · ${cmp.overall}% aligned overall · ${new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}`);
  doc.moveDown();

  doc.fillColor(crimson).fontSize(14).text('Values blueprint');
  doc.moveDown(0.3);
  for (const p of cmp.pillars) {
    const pillar = PILLARS.find((x) => x.key === p.key);
    doc.fillColor('#23140F').fontSize(12).text(`${pillar.title} — ${VERDICT[p.verdict]} (${p.score}%)`);
    doc.fillColor(muted).fontSize(10).text(
      `${me.first_name}: ${p.mine}/100 (${p.myFlexibility}) · ${card.firstName}: ${p.theirs}/100 (${p.theirFlexibility}) · scale: ${pillar.low} to ${pillar.high}`
    );
    // Bar with both positions
    const y = doc.y + 4;
    doc.roundedRect(50, y, 495, 6, 3).fill('#F2EBE1');
    doc.circle(50 + (495 * p.mine) / 100, y + 3, 5).fill(crimson);
    doc.circle(50 + (495 * p.theirs) / 100, y + 3, 5).fill('#C9A25C');
    doc.y = y + 16;
  }
  if (cmp.sharedVibes.length) doc.fillColor(muted).fontSize(10).text(`You both like: ${cmp.sharedVibes.join(', ')}`);
  doc.moveDown();

  const prefs = (title, m) => {
    if (!m || !m.total) return;
    doc.fillColor(crimson).fontSize(14).text(`${title} (${m.met} of ${m.total})`);
    for (const i of m.items) {
      doc.fillColor('#23140F').fontSize(10).text(`${i.met === true ? 'Fits' : i.met === false ? 'Does not fit' : 'Not stated'} — ${i.label}: wants ${i.wanted}`);
    }
    doc.moveDown(0.6);
  };
  doc.font('Helvetica');
  prefs(`${card.firstName} and your preferences`, cmp.fitsMyPreferences);
  prefs(`You and ${card.firstName}'s preferences`, cmp.iFitTheirPreferences);

  if (cmp.topics?.length) {
    doc.fillColor(crimson).fontSize(14).text('Worth talking about');
    for (const t of cmp.topics) doc.fillColor('#23140F').fontSize(10).text(`•  ${t}`);
    doc.moveDown();
  }

  if (cmp.horoscope?.items) {
    doc.fillColor(crimson).fontSize(14).text(`Horoscope match — ${cmp.horoscope.summary}`);
    for (const i of cmp.horoscope.items) {
      doc.fillColor(i.result === 'good' ? '#2E7D63' : i.result === 'average' ? '#8A6A2E' : crimson).fontSize(10)
        .text(`${i.name}: ${i.result}`, { continued: true }).fillColor(muted).text(`  — ${i.note}`);
    }
    doc.fillColor(muted).fontSize(9).text(cmp.horoscope.disclaimer);
    doc.moveDown();
  }

  doc.fillColor(muted).fontSize(8).text('Private report generated for a 3Knot Matrimony member. Contact details are never included.', 50, 780, { align: 'center' });
  doc.end();
  return done;
}

router.post('/:id/report-link', route(async (req, res) => res.json(await reportLink(req.userId, req.params.id))));
publicRouter.get('/:token', route(async (req, res) => {
  const data = readToken(req.params.token);
  if (!data) throw httpError(410, 'This report link has expired — open it again from the app');
  const pdf = await renderPdf(data.v, data.c);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'inline; filename="sangam-compatibility.pdf"');
  res.setHeader('Cache-Control', 'no-store');
  res.send(pdf);
}));

module.exports = { router, publicRouter };
