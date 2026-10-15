// End-to-end API tests against a real (embedded) PostgreSQL with several real users.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { startTestStack } = require('./helpers/testServer');

let stack;
let base;
let db;
let sms;
let sharp;
let WebSocket;

test.before(async () => {
  stack = await startTestStack();
  base = stack.base;
  db = require('../src/config/db');
  sms = require('../src/services/sms');
  sharp = require('sharp');
  WebSocket = require('ws');
});
test.after(() => stack && stack.stop());

// ---------- helpers ----------

async function api(pathname, { method = 'GET', body, token, form } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${base}/api${pathname}`, {
    method,
    headers,
    body: form || (body !== undefined ? JSON.stringify(body) : undefined),
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data };
}

const fileOnDisk = (url) => path.join(stack.uploadDir, decodeURIComponent(new URL(url).pathname.replace(/^\/uploads\//, '')));

async function imageForm(color = '#a81e3c', { format = 'png', withExif = false } = {}) {
  let img = sharp({ create: { width: 640, height: 800, channels: 3, background: color } });
  if (withExif) img = img.withExif({ IFD0: { Copyright: 'secret-location-test' } });
  const buffer = await img[format]().toBuffer();
  const form = new FormData();
  form.append('photo', new Blob([buffer], { type: `image/${format}` }), `photo.${format}`);
  return form;
}

let phoneSeq = 9000000000;
async function signIn(phone = `+91${phoneSeq++}`) {
  const sent = await api('/auth/otp/send', { method: 'POST', body: { phone } });
  assert.equal(sent.status, 200, JSON.stringify(sent.data));
  const verified = await api('/auth/otp/verify', { method: 'POST', body: { phone, code: sent.data.devCode } });
  assert.equal(verified.status, 200, JSON.stringify(verified.data));
  return { phone, token: verified.data.token, user: verified.data.user, isNewUser: verified.data.isNewUser };
}

// A fully onboarded user who appears in other people's feeds
// The required "about you" onboarding answers
const ONBOARDING_DETAILS = { maritalStatus: 'Never married', heightCm: 170, motherTongue: 'Tamil', religion: 'Prefer not to say' };

async function makeMember({ name, gender, birth = 'Mar 1995', city = 'Bengaluru', blueprint, vibes = [], familySharing = true }) {
  const u = await signIn();
  const t = u.token;
  assert.equal((await api('/me/consent', { method: 'PUT', token: t, body: { familySharing } })).status, 200);
  assert.equal((await api('/me/basics', {
    method: 'PUT', token: t,
    body: { firstName: name, gender, birthYearMonth: birth, city, intentTimeline: 'Marriage in 1–2 years', familyInvolvement: 'I consult my parents' },
  })).status, 200);
  assert.equal((await api('/me/details', { method: 'PUT', token: t, body: ONBOARDING_DETAILS })).status, 200);
  assert.equal((await api('/me/blueprint', { method: 'PUT', token: t, body: blueprint })).status, 200);
  if (vibes.length) assert.equal((await api('/me/vibes', { method: 'PUT', token: t, body: { vibes } })).status, 200);
  assert.equal((await api('/me/photos', { method: 'POST', token: t, form: await imageForm() })).status, 201);
  const done = await api('/me/onboarding/complete', { method: 'POST', token: t });
  assert.equal(done.status, 200, JSON.stringify(done.data));
  return { ...u, id: done.data.id, name };
}

function wsClient(token) {
  const ws = new WebSocket(`${base.replace('http', 'ws')}/ws?token=${token}`);
  const events = [];
  ws.on('message', (raw) => events.push(JSON.parse(raw)));
  const waitFor = (type, ms = 3000) => new Promise((resolve, reject) => {
    const started = Date.now();
    const timer = setInterval(() => {
      const hit = events.find((e) => e.type === type);
      if (hit) { clearInterval(timer); resolve(hit); }
      else if (Date.now() - started > ms) { clearInterval(timer); reject(new Error(`timeout waiting for ${type}`)); }
    }, 15);
  });
  const opened = new Promise((resolve) => ws.on('open', resolve));
  const closed = new Promise((resolve) => ws.on('close', (code) => resolve(code)));
  return { ws, events, waitFor, opened, closed };
}

const BP = {
  ananya: { money: 72, moneyFlexibility: 'open', roots: 31, rootsFlexibility: 'firm', kids: 58, kidsFlexibility: 'open', ambition: 84, ambitionFlexibility: 'firm' },
  close: { money: 75, roots: 35, kids: 60, ambition: 80 },
  far: { money: 20, roots: 90, kids: 10, ambition: 30 },
};

// ---------- auth ----------

test.describe('auth: phone OTP and sessions', () => {
  test('invalid numbers are rejected', async () => {
    assert.equal((await api('/auth/otp/send', { method: 'POST', body: { phone: '12345' } })).status, 400);
    assert.equal((await api('/auth/otp/send', { method: 'POST', body: {} })).status, 400);
  });

  test('send OTP stores a hashed code and goes through the SMS provider', async () => {
    const phone = '98111 22233';
    const res = await api('/auth/otp/send', { method: 'POST', body: { phone } });
    assert.equal(res.status, 200);
    assert.equal(res.data.phone, '+919811122233');
    assert.match(res.data.devCode, /^\d{6}$/);
    const last = sms.sent.at(-1);
    assert.equal(last.to, '+919811122233');
    assert.ok(last.text.includes(res.data.devCode));
    const row = (await db.query('SELECT code_hash FROM otp_codes WHERE phone = $1 ORDER BY created_at DESC LIMIT 1', ['+919811122233'])).rows[0];
    assert.ok(!row.code_hash.includes(res.data.devCode), 'code is not stored in plain text');
  });

  test('wrong codes count attempts and lock after the limit', async () => {
    const phone = '+919811100000';
    const { data } = await api('/auth/otp/send', { method: 'POST', body: { phone } });
    const wrong = data.devCode === '000000' ? '111111' : '000000';
    for (let i = 0; i < 5; i++) {
      assert.equal((await api('/auth/otp/verify', { method: 'POST', body: { phone, code: wrong } })).data.code, 'OTP_WRONG');
    }
    const locked = await api('/auth/otp/verify', { method: 'POST', body: { phone, code: data.devCode } });
    assert.equal(locked.status, 429);
    assert.equal(locked.data.code, 'OTP_LOCKED');
  });

  test('expired codes are refused', async () => {
    const phone = '+919811100001';
    const { data } = await api('/auth/otp/send', { method: 'POST', body: { phone } });
    await db.query(`UPDATE otp_codes SET expires_at = NOW() - INTERVAL '1 second' WHERE phone = $1`, [phone]);
    const res = await api('/auth/otp/verify', { method: 'POST', body: { phone, code: data.devCode } });
    assert.equal(res.data.code, 'OTP_EXPIRED');
  });

  test('verify creates the account once, issues a session, and a code works only once', async () => {
    const phone = '+919811100002';
    const { data } = await api('/auth/otp/send', { method: 'POST', body: { phone } });
    const first = await api('/auth/otp/verify', { method: 'POST', body: { phone, code: data.devCode } });
    assert.equal(first.status, 200);
    assert.equal(first.data.isNewUser, true);
    assert.equal(first.data.user.onboarding.nextScreen, 'consent');
    assert.equal((await api('/auth/otp/verify', { method: 'POST', body: { phone, code: data.devCode } })).status, 400);

    const again = await signIn(phone);
    assert.equal(again.isNewUser, false);
    assert.equal(again.user.id, first.data.user.id);
    const sessionRow = (await db.query('SELECT token_hash FROM sessions WHERE user_id = $1 LIMIT 1', [first.data.user.id])).rows[0];
    assert.notEqual(sessionRow.token_hash, first.data.token, 'only the token hash is stored');
  });

  test('protected routes need a valid token; logout revokes it', async () => {
    assert.equal((await api('/me')).status, 401);
    assert.equal((await api('/me', { token: 'not-a-token' })).status, 401);
    const u = await signIn();
    assert.equal((await api('/me', { token: u.token })).status, 200);
    assert.equal((await api('/auth/logout', { method: 'POST', token: u.token })).status, 200);
    assert.equal((await api('/me', { token: u.token })).status, 401);
  });
});

// ---------- profile & onboarding ----------

test.describe('profile and onboarding', () => {
  let u;
  test.before(async () => { u = await signIn(); });

  test('a new account starts empty — no demo data', async () => {
    const me = (await api('/me', { token: u.token })).data;
    assert.equal(me.firstName, null);
    assert.equal(me.blueprint, null);
    assert.deepEqual(me.photos, []);
    assert.deepEqual(me.vibes, []);
    assert.equal(me.consent, null);
  });

  test('consent: matching cannot be refused; other flags persist', async () => {
    assert.equal((await api('/me/consent', { method: 'PUT', token: u.token, body: { matching: false } })).status, 400);
    const res = await api('/me/consent', { method: 'PUT', token: u.token, body: { familySharing: true, marketing: false } });
    assert.equal(res.status, 200);
    assert.equal(res.data.consent.matching, true);
    assert.equal(res.data.consent.familySharing, true);
  });

  test('basics are validated and age is derived from the birth month', async () => {
    const put = (body) => api('/me/basics', { method: 'PUT', token: u.token, body });
    assert.equal((await put({ birthYearMonth: 'yesterday' })).status, 400);
    assert.equal((await put({ birthYearMonth: `Jan ${new Date().getFullYear() - 10}` })).status, 400, 'under 18');
    assert.equal((await put({ gender: 'other' })).status, 400);
    assert.equal((await put({ firstName: '   ' })).status, 400);
    const ok = await put({ firstName: ' Ananya ', gender: 'woman', birthYearMonth: 'Mar 1997', city: 'Bengaluru', intentTimeline: 'Marriage in 1–2 years', familyInvolvement: 'I consult my parents' });
    assert.equal(ok.status, 200);
    assert.equal(ok.data.firstName, 'Ananya');
    assert.equal(ok.data.birthYearMonth, 'Mar 1997');
    assert.ok(ok.data.age >= 28);
    assert.equal(ok.data.onboarding.basics, true);
  });

  test('blueprint: the money question alone saves with neutral defaults, then the tuner completes it', async () => {
    const first = await api('/me/blueprint', { method: 'PUT', token: u.token, body: { money: 30, moneyFlexibility: 'firm' } });
    assert.equal(first.status, 200);
    assert.deepEqual([first.data.blueprint.money, first.data.blueprint.roots], [30, 50]);
    const full = await api('/me/blueprint', { method: 'PUT', token: u.token, body: BP.ananya });
    assert.equal(full.data.blueprint.money, 72);
    assert.match(full.data.blueprint.summaryText, /saver who'd move cities/);
    assert.equal((await api('/me/blueprint', { method: 'PUT', token: u.token, body: { kids: 120 } })).status, 400);
    assert.equal((await api('/me/blueprint', { method: 'PUT', token: u.token, body: { kidsFlexibility: 'maybe' } })).status, 400);
  });

  test('vibes must come from the list, at most six', async () => {
    assert.equal((await api('/me/vibes', { method: 'PUT', token: u.token, body: { vibes: ['Skydiving'] } })).status, 400);
    const seven = ['Temple mornings', 'Trekking', 'Cooking together', 'Big joint family', 'Quiet weekends', 'Nightlife', 'Dogs everywhere'];
    assert.equal((await api('/me/vibes', { method: 'PUT', token: u.token, body: { vibes: seven } })).status, 400);
    const ok = await api('/me/vibes', { method: 'PUT', token: u.token, body: { vibes: ['Trekking', 'Trekking', 'Nightlife'] } });
    assert.deepEqual(ok.data.vibes, ['Trekking', 'Nightlife']);
  });

  test('after basics, onboarding asks for the short personal step', async () => {
    const me = (await api('/me', { token: u.token })).data;
    assert.equal(me.onboarding.personal, false);
    assert.equal(me.onboarding.nextScreen, 'personal');
    assert.ok(me.profileCompletion.percent < 30, `percent=${me.profileCompletion.percent}`);
    assert.equal(me.profileStrength, me.profileCompletion.percent);
    assert.equal(me.details.firstName, 'Ananya');
    assert.equal(me.details.city, 'Bengaluru');
  });

  test('personal details are validated field by field', async () => {
    const put = (body) => api('/me/details', { method: 'PUT', token: u.token, body });
    for (const bad of [
      { favouriteColour: 'red' },
      { maritalStatus: 'Complicated' },
      { heightCm: 100 },
      { heightCm: 170.5 },
      { weightKg: 'heavy' },
      { hobbies: ['Skydiving'] },
      { hobbies: 'Travel' },
      { firstName: '' },
      { city: null },
      { aboutMe: 'x'.repeat(1001) },
      { casteNoBar: 'yes' },
      { brothers: 1, brothersMarried: 2 },
      {},
    ]) {
      const res = await put(bad);
      assert.equal(res.status, 400, JSON.stringify(bad));
    }
  });

  test('the onboarding personal step saves; column fields update their columns', async () => {
    const res = await api('/me/details', {
      method: 'PUT', token: u.token,
      body: { maritalStatus: 'Never married', heightCm: 162, motherTongue: 'Tamil', religion: 'Hindu', educationCategory: 'B.E. / B.Tech', profession: '  Product   designer ' },
    });
    assert.equal(res.status, 200, JSON.stringify(res.data));
    assert.equal(res.data.onboarding.personal, true);
    assert.equal(res.data.onboarding.nextScreen, 'photos', 'blueprint was saved earlier');
    assert.equal(res.data.profession, 'Product designer');
    assert.equal(res.data.details.heightCm, 162);
    assert.equal(res.data.details.religion, 'Hindu');
  });

  test('the full profile fills in section by section and the completion % rises', async () => {
    const before = (await api('/me', { token: u.token })).data.profileCompletion;
    const res = await api('/me/details', {
      method: 'PUT', token: u.token,
      body: {
        aboutMe: 'I work in product design in Bengaluru.\nI love long walks.',
        weightKg: 55, physicalStatus: 'Normal', bodyType: 'Average', profileCreatedBy: 'Self',
        eatingHabits: 'Vegetarian', drinkingHabits: 'Never drinks', smokingHabits: 'Never smokes',
        caste: 'Iyer', casteNoBar: true, star: 'Rohini', raasi: 'Rishabam (Taurus)', dosham: 'Don’t know',
        college: 'PSG Tech', employedIn: 'Private', annualIncome: 'Rs. 14 - 16 Lakhs',
        country: 'India', state: 'Karnataka', citizenship: 'India',
        familyValues: 'Liberal', familyType: 'Nuclear', familyStatus: 'Middle class',
        fatherOccupation: 'Retired', motherOccupation: 'Homemaker', brothers: 2, brothersMarried: 1, sisters: 0,
        aboutFamily: 'A small, close family from Coimbatore.',
        hobbies: ['Technology', 'Travel', 'Travel'], movies: ['Anime'], spokenLanguages: ['English', 'Tamil'],
      },
    });
    assert.equal(res.status, 200, JSON.stringify(res.data));
    const d = res.data.details;
    assert.deepEqual(d.hobbies, ['Technology', 'Travel'], 'duplicates removed');
    assert.equal(d.aboutMe, 'I work in product design in Bengaluru.\nI love long walks.', 'line breaks kept');
    assert.equal(d.casteNoBar, true);
    const after = res.data.profileCompletion;
    assert.ok(after.percent > before.percent, `${before.percent} -> ${after.percent}`);
    for (const key of ['about', 'basic', 'religion', 'professional', 'location', 'family', 'aboutFamily', 'hobbies']) {
      assert.ok(after.sections.find((s) => s.key === key).complete, `${key} incomplete`);
    }
  });

  test('clearing a field removes it; clearing siblings clears the married count', async () => {
    const res = await api('/me/details', { method: 'PUT', token: u.token, body: { caste: null, brothers: null } });
    assert.equal(res.status, 200);
    assert.equal(res.data.details.caste, undefined);
    assert.equal(res.data.details.brothers, undefined);
    assert.equal(res.data.details.brothersMarried, undefined);
    assert.equal(res.data.profileCompletion.sections.find((s) => s.key === 'family').complete, false);
    await api('/me/details', { method: 'PUT', token: u.token, body: { brothers: 2, brothersMarried: 1 } });
  });

  test('onboarding cannot complete without a photo', async () => {
    const res = await api('/me/onboarding/complete', { method: 'POST', token: u.token });
    assert.equal(res.status, 400);
    assert.equal(res.data.code, 'ONBOARDING_INCOMPLETE');
  });

  test('photos: non-images rejected; uploads saved to the project folder with a blurred copy and no EXIF', async () => {
    const bad = new FormData();
    bad.append('photo', new Blob([Buffer.from('not an image')], { type: 'image/png' }), 'x.png');
    assert.equal((await api('/me/photos', { method: 'POST', token: u.token, form: bad })).status, 400);
    assert.equal((await api('/me/photos', { method: 'POST', token: u.token })).status, 400);

    const res = await api('/me/photos', { method: 'POST', token: u.token, form: await imageForm('#123456', { format: 'jpeg', withExif: true }) });
    assert.equal(res.status, 201);
    const photo = res.data.photos[0];
    const original = fileOnDisk(photo.url);
    const blurred = fileOnDisk(photo.blurUrl);
    assert.ok(original.startsWith(stack.uploadDir), 'stored under UPLOAD_DIR');
    assert.ok(fs.existsSync(original) && fs.existsSync(blurred));
    const meta = await sharp(original).metadata();
    assert.equal(meta.format, 'jpeg');
    assert.equal(meta.exif, undefined, 'EXIF stripped');

    const served = await fetch(`${base}${new URL(photo.url).pathname}`);
    assert.equal(served.status, 200);
    assert.equal(served.headers.get('content-type'), 'image/jpeg');
  });

  test('photos: reorder primary and delete removes the files', async () => {
    const second = (await api('/me/photos', { method: 'POST', token: u.token, form: await imageForm('#00aa00') })).data.photos[1];
    const primary = await api(`/me/photos/${second.id}/primary`, { method: 'PUT', token: u.token });
    assert.equal(primary.data.photos[0].id, second.id);
    const del = await api(`/me/photos/${second.id}`, { method: 'DELETE', token: u.token });
    assert.equal(del.data.photos.length, 1);
    assert.equal(del.data.photos[0].position, 0);
    assert.ok(!fs.existsSync(fileOnDisk(second.url)));
    assert.equal((await api('/me/photos/not-a-uuid', { method: 'DELETE', token: u.token })).status, 404);
  });

  test('onboarding completes once required steps are done', async () => {
    const res = await api('/me/onboarding/complete', { method: 'POST', token: u.token });
    assert.equal(res.status, 200);
    assert.equal(res.data.onboarding.completed, true);
    assert.equal(res.data.onboarding.nextScreen, 'feed');
  });

  test('a completed profile stays complete in the feed even with optional fields empty; others see filled details', async () => {
    const other = await makeMember({ name: 'Varun', gender: 'man', blueprint: BP.close });
    const feed = (await api('/matches', { token: other.token })).data;
    const card = feed.find((c) => c.firstName === 'Ananya');
    assert.ok(card, 'Ananya in feed');
    assert.equal(card.details.heightCm, 162);
    assert.equal(card.details.annualIncome, 'Rs. 14 - 16 Lakhs');
    assert.equal(card.details.caste, undefined, 'cleared field not sent');
    assert.ok(!('phone' in card.details));
  });
});

// ---------- matching, chat, family, privacy across real users ----------

test.describe('multi-user flows', () => {
  let ananya; let rohan; let nikhil; let meera; let pending;

  test.before(async () => {
    ananya = await makeMember({ name: 'Ananya', gender: 'woman', birth: 'Mar 1997', blueprint: BP.ananya, vibes: ['Trekking', 'Quiet weekends'] });
    rohan = await makeMember({ name: 'Rohan', gender: 'man', birth: 'Jun 1994', blueprint: BP.close, vibes: ['Trekking'] });
    nikhil = await makeMember({ name: 'Nikhil', gender: 'man', birth: 'Jan 1993', city: 'Pune', blueprint: BP.far });
    meera = await makeMember({ name: 'Meera', gender: 'woman', blueprint: BP.close });
    pending = await signIn(); // never finishes onboarding
    await api('/me/basics', { method: 'PUT', token: pending.token, body: { firstName: 'Half', gender: 'man', birthYearMonth: 'Jan 1990', city: 'Delhi' } });
  });

  test('feed shows only onboarded users of the other gender, best fit first', async () => {
    const feed = (await api('/matches', { token: ananya.token })).data;
    const names = feed.map((c) => c.firstName);
    assert.ok(names.includes('Rohan') && names.includes('Nikhil'));
    assert.ok(!names.includes('Meera'), 'same gender excluded');
    assert.ok(!names.includes('Ananya'), 'self excluded');
    assert.ok(!names.includes('Half'), 'unfinished onboarding excluded');
    const scores = feed.map((c) => c.overlapScores.overall);
    assert.deepEqual(scores, [...scores].sort((a, b) => b - a));
    const r = feed.find((c) => c.firstName === 'Rohan');
    assert.deepEqual(r.tags, ['Both: Trekking']);
    assert.ok(r.suggestedOpener.length > 10);
    assert.equal(r.age, new Date().getFullYear() - 1994 - (new Date().getMonth() + 1 < 6 ? 1 : 0));
  });

  test('photos are blurred server-side until mutual interest', async () => {
    const r = (await api('/matches', { token: ananya.token })).data.find((c) => c.firstName === 'Rohan');
    assert.equal(r.photoBlurred, true);
    assert.match(r.photos[0], /-blur\.jpg$/);
  });

  test('80+ filter and pass work', async () => {
    const top = (await api('/matches?filter=80%2B', { token: ananya.token })).data;
    assert.ok(top.every((c) => c.overlapScores.overall >= 80));
    assert.equal((await api(`/matches/${nikhil.id}/pass`, { method: 'POST', token: ananya.token })).status, 200);
    const after = (await api('/matches', { token: ananya.token })).data.map((c) => c.firstName);
    assert.ok(!after.includes('Nikhil'));
  });

  test('chat: open, message with live delivery to the right person only, read state, mutual unblur', async () => {
    const rohanWs = wsClient(rohan.token);
    const meeraWs = wsClient(meera.token);
    await Promise.all([rohanWs.opened, meeraWs.opened]);

    const opened = await api('/conversations', { method: 'POST', token: ananya.token, body: { candidateId: rohan.id } });
    assert.equal(opened.status, 201);
    const again = await api('/conversations', { method: 'POST', token: ananya.token, body: { candidateId: rohan.id } });
    assert.equal(again.status, 200);
    assert.equal(again.data.id, opened.data.id);

    const sent = await api(`/conversations/${opened.data.id}/messages`, { method: 'POST', token: ananya.token, body: { text: '  Hi Rohan!  ' } });
    assert.equal(sent.status, 201);
    assert.equal(sent.data.message.text, 'Hi Rohan!');
    const live = await rohanWs.waitFor('message:new');
    assert.equal(live.message.text, 'Hi Rohan!');
    assert.equal(live.message.sender, 'them');
    assert.equal(meeraWs.events.filter((e) => e.type === 'message:new').length, 0, 'other users get nothing');

    const rohanThreads = (await api('/conversations', { token: rohan.token })).data;
    assert.equal(rohanThreads[0].candidateName, 'Ananya');
    assert.equal(rohanThreads[0].unread, true);
    assert.equal((await api(`/conversations/${opened.data.id}/read`, { method: 'PUT', token: rohan.token })).status, 200);
    assert.equal((await api('/conversations', { token: rohan.token })).data[0].unread, false);

    assert.equal((await api(`/conversations/${opened.data.id}`, { token: meera.token })).status, 404, 'non-participant');
    assert.equal((await api(`/conversations/${opened.data.id}/messages`, { method: 'POST', token: meera.token, body: { text: 'x' } })).status, 404);
    assert.equal((await api(`/conversations/${opened.data.id}/messages`, { method: 'POST', token: ananya.token, body: { text: '   ' } })).status, 400);

    await api(`/conversations/${opened.data.id}/messages`, { method: 'POST', token: rohan.token, body: { text: 'Hello Ananya' } });
    const r = (await api(`/matches/${rohan.id}`, { token: ananya.token })).data;
    assert.equal(r.photoBlurred, false, 'mutual interest reveals photos');
    assert.doesNotMatch(r.photos[0], /-blur\.jpg$/);

    rohanWs.ws.close(); meeraWs.ws.close();
  });

  test('websocket refuses connections without a valid session', async () => {
    const bad = wsClient('nope');
    assert.equal(await bad.closed, 4401);
  });

  let link;
  test('family: invite by SMS, validation, and consent gate', async () => {
    const created = await api('/family/links', { method: 'POST', token: ananya.token, body: { name: 'Amma', relation: 'Mother', phone: '98455 12210' } });
    assert.equal(created.status, 201);
    link = created.data;
    assert.equal(link.status, 'invited');
    assert.equal(link.phoneMasked, '+91 98••• ••210');
    const invite = sms.sent.at(-1);
    assert.equal(invite.type, 'family_invite');
    assert.ok(invite.text.includes(`/portal/${link.portalToken}`));

    assert.equal((await api('/family/links', { method: 'POST', token: ananya.token, body: { name: 'Amma2', phone: '9845512210' } })).status, 409);
    assert.equal((await api('/family/links', { method: 'POST', token: ananya.token, body: { name: 'Me', phone: ananya.phone } })).status, 400);

    await api('/me/consent', { method: 'PUT', token: ananya.token, body: { familySharing: false } });
    const blocked = await api('/family/shares', { method: 'POST', token: ananya.token, body: { candidateIds: [rohan.id], familyLinkId: link.id } });
    assert.equal(blocked.status, 403);
    await api('/me/consent', { method: 'PUT', token: ananya.token, body: { familySharing: true } });
  });

  let share;
  test('family: shares respect permissions; contact can never be shared', async () => {
    const res = await api('/family/shares', {
      method: 'POST', token: ananya.token,
      body: { candidateIds: [rohan.id], familyLinkId: link.id, expiresIn: '7d', note: 'Sensible about money', permissions: { showContact: true, showPhoto: false } },
    });
    assert.equal(res.status, 201);
    share = res.data[0];
    assert.equal(share.permissions.showContact, false);
    assert.equal(share.candidateName, 'Rohan');
    assert.ok(share.overlapScore >= 80);
    assert.equal((await api('/family/shares', { method: 'POST', token: ananya.token, body: { candidateIds: ['00000000-0000-0000-0000-000000000000'], familyLinkId: link.id } })).status, 404);
  });

  test('parent portal: link opens without an account, marks linked, shows only permitted data', async () => {
    assert.equal((await api('/portal/not-a-real-token')).status, 404);
    const portal = await api(`/portal/${link.portalToken}`);
    assert.equal(portal.status, 200);
    assert.equal(portal.data.childName, 'Ananya');
    assert.equal(portal.data.parentName, 'Amma');
    const rec = portal.data.records[0];
    assert.equal(rec.candidateName, 'Rohan');
    assert.equal(rec.photoBlurred, true);
    assert.match(rec.photo, /-blur\.jpg$/);
    assert.equal(rec.phone, undefined);
    assert.equal(rec.candidateId, undefined);
    const links = (await api('/family/links', { token: ananya.token })).data;
    assert.equal(links[0].status, 'linked');
  });

  test('parent feedback reaches the child live and in the tracker', async () => {
    const ws = wsClient(ananya.token);
    await ws.opened;
    const res = await api(`/portal/${link.portalToken}/shares/${share.id}/feedback`, { method: 'POST', body: { decision: 'approved', note: 'Ask about his posting in Pune' } });
    assert.equal(res.status, 200);
    const live = await ws.waitFor('family:feedback');
    assert.equal(live.share.statusBadge, 'AMMA APPROVED');
    const tracked = (await api('/family/shares', { token: ananya.token })).data.find((s) => s.id === share.id);
    assert.equal(tracked.feedbackNote, 'Ask about his posting in Pune');
    assert.equal((await api(`/portal/${link.portalToken}/shares/${share.id}/feedback`, { method: 'POST', body: { decision: 'veto' } })).status, 400);
    const chats = (await api('/conversations', { token: ananya.token })).data;
    assert.match(chats[0].sharedWithParentStatus, /^Amma approved/);
    ws.ws.close();
  });

  test('expired shares disappear from the portal and cannot be answered', async () => {
    await db.query(`UPDATE family_shares SET expires_at = NOW() - INTERVAL '1 minute' WHERE id = $1`, [share.id]);
    assert.equal((await api(`/portal/${link.portalToken}`)).data.records.length, 0);
    assert.equal((await api(`/portal/${link.portalToken}/shares/${share.id}/feedback`, { method: 'POST', body: { decision: 'approved' } })).status, 410);
  });

  test('revoking a family member kills their portal link', async () => {
    assert.equal((await api(`/family/links/${link.id}`, { method: 'DELETE', token: ananya.token })).status, 200);
    assert.equal((await api(`/portal/${link.portalToken}`)).status, 404);
  });

  test('export contains the user’s data but no portal secrets', async () => {
    const res = await api('/me/export', { token: ananya.token });
    assert.equal(res.data.profile.firstName, 'Ananya');
    assert.ok(res.data.messagesSent.some((m) => m.body === 'Hi Rohan!'));
    assert.ok(res.data.familyShares.length > 0);
    assert.ok(!JSON.stringify(res.data).includes(link.portalToken));
  });

  test('erasure: hidden immediately, cancellable, then permanently erased by the sweep', async () => {
    const req = await api('/me/erasure', { method: 'POST', token: rohan.token });
    assert.equal(req.status, 201);
    assert.match(req.data.auditReceiptHash, /^DPDP-DEL-[0-9A-F]{32}$/);
    assert.equal((await api('/me/erasure', { method: 'POST', token: rohan.token })).status, 409);
    assert.ok(!(await api('/matches', { token: ananya.token })).data.some((c) => c.firstName === 'Rohan'), 'hidden from feeds');

    assert.equal((await api('/me/erasure', { method: 'DELETE', token: rohan.token })).status, 200);
    assert.ok((await api('/matches', { token: ananya.token })).data.some((c) => c.firstName === 'Rohan'), 'visible again');

    await api('/me/erasure', { method: 'POST', token: rohan.token });
    const photoUrl = (await api('/me', { token: rohan.token })).data.photos[0].url;
    await db.query(`UPDATE erasure_requests SET scheduled_for = NOW() - INTERVAL '1 minute' WHERE user_id = $1`, [rohan.id]);
    const { runErasureSweep } = require('../src/modules/privacy');
    assert.equal(await runErasureSweep({ log: () => {} }), 1);

    assert.equal((await api('/me', { token: rohan.token })).status, 401, 'sessions gone');
    assert.ok(!fs.existsSync(fileOnDisk(photoUrl)), 'photo files deleted');
    assert.equal((await db.query('SELECT 1 FROM users WHERE id = $1', [rohan.id])).rows.length, 0);
    const audit = (await db.query('SELECT * FROM erasure_requests WHERE completed_at IS NOT NULL')).rows;
    assert.equal(audit.length, 1);
    assert.equal(audit[0].user_id, null, 'only the hashed reference remains');

    const thread = (await api('/conversations', { token: ananya.token })).data[0];
    assert.equal(thread.candidateName, 'Former member');
    const full = (await api(`/conversations/${thread.id}`, { token: ananya.token })).data;
    assert.ok(full.messages.some((m) => m.sender === 'former' && m.text === 'Hello Ananya'), 'history kept, anonymised');
    assert.equal((await api(`/conversations/${thread.id}/messages`, { method: 'POST', token: ananya.token, body: { text: 'hi?' } })).status, 410);
  });
});

// ---------- notifications ----------

test.describe('notifications', () => {
  let push;
  let priya; let kabir; let farhan;
  const NEAR = { money: 70, roots: 40, kids: 60, ambition: 75 };
  const FAR = { money: 5, roots: 95, kids: 5, ambition: 10 };
  const inbox = (t) => api('/notifications', { token: t }).then((r) => r.data);

  test.before(async () => {
    push = require('../src/services/push');
    priya = await makeMember({ name: 'Priya', gender: 'woman', blueprint: NEAR });
  });

  test('requires a session', async () => {
    assert.equal((await api('/notifications')).status, 401);
  });

  test('a newcomer who aligns ≥80% triggers a "new aligned match" for existing members; a poor fit does not', async () => {
    kabir = await makeMember({ name: 'Kabir', gender: 'man', blueprint: NEAR });
    farhan = await makeMember({ name: 'Farhan', gender: 'man', blueprint: FAR });
    const items = (await inbox(priya.token)).items.filter((n) => n.type === 'match');
    assert.equal(items.length, 1);
    assert.equal(items[0].title, 'New aligned match');
    assert.match(items[0].body, /^Kabir, \d+ · 100% aligned with you$/);
    assert.equal(items[0].data.candidateId, kabir.id);
  });

  let conversationId;
  test('an interest with an intro message notifies live; the sender waits for an answer before writing more', async () => {
    const ws = wsClient(priya.token);
    try {
      await ws.opened;
      const opened = await api('/conversations', { method: 'POST', token: kabir.token, body: { candidateId: priya.id, message: 'Hi Priya!' } });
      assert.equal(opened.status, 201);
      conversationId = opened.data.id;
      assert.equal(opened.data.status, 'requested');
      assert.equal(opened.data.requestedByMe, true);
      const live = await ws.waitFor('notification:new');
      assert.equal(live.notification.type, 'interest_request');
      assert.equal(live.notification.title, 'Kabir is interested in you');
      assert.equal(live.notification.body, 'Hi Priya!');
      const more = await api(`/conversations/${conversationId}/messages`, { method: 'POST', token: kabir.token, body: { text: 'Free to talk?' } });
      assert.equal(more.status, 403);
      assert.equal(more.data.code, 'AWAITING_RESPONSE');
      const priyaView = (await api(`/conversations/${conversationId}`, { token: priya.token })).data;
      assert.equal(priyaView.needsMyResponse, true);
    } finally {
      ws.ws.close();
      await new Promise((r) => setTimeout(r, 50));
    }
  });

  test('replying accepts the interest and tells the sender', async () => {
    await api(`/conversations/${conversationId}/messages`, { method: 'POST', token: priya.token, body: { text: 'Hello Kabir' } });
    const accepted = (await inbox(kabir.token)).items.find((n) => n.type === 'interest_accepted');
    assert.ok(accepted);
    assert.equal(accepted.title, 'Priya accepted your interest');
    assert.equal(accepted.data.conversationId, conversationId);
    assert.equal((await api(`/conversations/${conversationId}`, { token: kabir.token })).data.status, 'accepted');
    assert.equal((await inbox(priya.token)).items.find((n) => n.type === 'interest_request').read, true, 'request cleared once answered');
  });

  test('messages notify live, group per conversation, and never push while the app is open', async () => {
    const ws = wsClient(priya.token);
    try {
      await ws.opened;
      const pushesBefore = push.sent.length;
      await api(`/conversations/${conversationId}/messages`, { method: 'POST', token: kabir.token, body: { text: 'So glad you replied' } });
      const live = await ws.waitFor('notification:new');
      assert.equal(live.notification.type, 'message');
      assert.equal(live.notification.data.conversationId, conversationId);
      await api(`/conversations/${conversationId}/messages`, { method: 'POST', token: kabir.token, body: { text: 'Free to talk this week?' } });
      const msgs = (await inbox(priya.token)).items.filter((n) => n.type === 'message');
      assert.equal(msgs.length, 1, 'grouped into one notification');
      assert.equal(msgs[0].count, 2);
      assert.equal(msgs[0].title, '2 new messages from Kabir');
      assert.equal(msgs[0].body, 'Free to talk this week?');
      assert.equal(push.sent.length, pushesBefore, 'no push while online');
    } finally {
      ws.ws.close();
      await new Promise((r) => setTimeout(r, 50));
    }
  });

  test('opening the conversation clears its message notifications (and tells other devices)', async () => {
    // Replying already counted as reading; a new message from Kabir makes it unread again
    await api(`/conversations/${conversationId}/messages`, { method: 'POST', token: kabir.token, body: { text: 'Lovely to hear from you' } });
    const before = (await inbox(priya.token)).unreadCount;
    const ws = wsClient(priya.token);
    try {
      await ws.opened;
      await api(`/conversations/${conversationId}/read`, { method: 'PUT', token: priya.token });
      const after = await inbox(priya.token);
      assert.equal(after.unreadCount, before - 1);
      assert.ok(after.items.filter((n) => n.type === 'message').every((n) => n.read));
      const evt = await ws.waitFor('notification:read');
      assert.equal(evt.unreadCount, after.unreadCount);
    } finally {
      ws.ws.close();
      await new Promise((r) => setTimeout(r, 50));
    }

    // A new message after reading starts a fresh notification
    await api(`/conversations/${conversationId}/messages`, { method: 'POST', token: kabir.token, body: { text: 'Great!' } });
    const fresh = (await inbox(priya.token)).items.filter((n) => n.type === 'message' && !n.read);
    assert.equal(fresh.length, 1);
    assert.equal(fresh[0].count, 1);
  });

  test('offline users get a push on their registered devices', async () => {
    assert.equal((await api('/notifications/push-tokens', { method: 'POST', token: priya.token, body: { platform: 'pager', token: 'x' } })).status, 400);
    assert.equal((await api('/notifications/push-tokens', { method: 'POST', token: priya.token, body: { platform: 'android', token: 'device-token-priya' } })).status, 201);
    const pushesBefore = push.sent.length;
    await api(`/conversations/${conversationId}/messages`, { method: 'POST', token: kabir.token, body: { text: 'Are you there?' } });
    assert.equal(push.sent.length, pushesBefore + 1);
    const last = push.sent.at(-1);
    assert.deepEqual(last.tokens, [{ platform: 'android', token: 'device-token-priya' }]);
    assert.equal(last.data.conversationId, conversationId);
    assert.equal(last.data.type, 'message');
  });

  test('preferences: categories can be switched off (push too); invalid values rejected', async () => {
    assert.equal((await api('/notifications/preferences', { method: 'PUT', token: priya.token, body: { messages: 'no' } })).status, 400);
    const prefs = await api('/notifications/preferences', { method: 'PUT', token: priya.token, body: { messages: false, push: false } });
    assert.deepEqual(prefs.data, { messages: false, matches: true, family: true, tips: true, push: false });
    assert.equal((await api('/me', { token: priya.token })).data.notificationPrefs.messages, false);

    await api('/notifications/read', { method: 'POST', token: priya.token, body: { all: true } });
    const pushesBefore = push.sent.length;
    await api(`/conversations/${conversationId}/messages`, { method: 'POST', token: kabir.token, body: { text: 'Muted?' } });
    const unread = await inbox(priya.token);
    assert.equal(unread.unreadCount, 0, 'no message notification while muted');
    assert.equal(push.sent.length, pushesBefore);
    await api('/notifications/preferences', { method: 'PUT', token: priya.token, body: { messages: true, push: true } });
  });

  test('family: link opened and parent feedback both notify the member', async () => {
    const link = (await api('/family/links', { method: 'POST', token: priya.token, body: { name: 'Maa', phone: '9811122299' } })).data;
    await api(`/portal/${link.portalToken}`);
    const share = (await api('/family/shares', { method: 'POST', token: priya.token, body: { candidateIds: [kabir.id], familyLinkId: link.id } })).data[0];
    await api(`/portal/${link.portalToken}/shares/${share.id}/feedback`, { method: 'POST', body: { decision: 'concern_raised', note: 'Let us meet his family first' } });
    const items = (await inbox(priya.token)).items;
    const linked = items.find((n) => n.type === 'family_linked');
    const feedback = items.find((n) => n.type === 'family_feedback');
    assert.equal(linked.title, 'Maa opened your family link');
    assert.equal(feedback.title, 'Maa raised a concern about Kabir');
    assert.equal(feedback.body, 'Let us meet his family first');
    assert.equal(feedback.data.shareId, share.id);
  });

  test('security: a sign-in while already signed in elsewhere raises an alert that cannot be muted', async () => {
    await api('/notifications/preferences', { method: 'PUT', token: priya.token, body: { messages: false, matches: false, family: false } });
    await signIn(priya.phone);
    const sec = (await inbox(priya.token)).items.find((n) => n.type === 'security');
    assert.ok(sec);
    assert.equal(sec.title, 'New sign-in to your account');
  });

  test('mark by ids, mark all, and cursor pagination', async () => {
    const page1 = (await api('/notifications?limit=2', { token: priya.token })).data;
    assert.equal(page1.items.length, 2);
    assert.ok(page1.nextCursor);
    const page2 = (await api(`/notifications?limit=2&before=${encodeURIComponent(page1.nextCursor)}`, { token: priya.token })).data;
    assert.ok(page2.items.every((n) => !page1.items.some((m) => m.id === n.id)));

    const unreadId = (await inbox(priya.token)).items.find((n) => !n.read).id;
    const byId = await api('/notifications/read', { method: 'POST', token: priya.token, body: { ids: [unreadId] } });
    assert.equal(byId.status, 200);
    assert.ok((await inbox(priya.token)).items.find((n) => n.id === unreadId).read);
    assert.equal((await api('/notifications/read', { method: 'POST', token: priya.token, body: {} })).status, 400);
    const all = await api('/notifications/read', { method: 'POST', token: priya.token, body: { all: true } });
    assert.equal(all.data.unreadCount, 0);
  });
});

// ---------- search ----------

test.describe('search', () => {
  let seeker;
  const people = {};
  const BASE_BP = { money: 70, roots: 40, kids: 60, ambition: 75 };
  const run = async (qs, token = seeker.token) => api(`/search${qs ? `?${qs}` : ''}`, { token });
  const names = (r) => r.data.results.map((c) => c.firstName);

  test.before(async () => {
    seeker = await makeMember({ name: 'Sita', gender: 'woman', birth: 'Mar 1996', city: 'Chennai', blueprint: BASE_BP, vibes: ['Trekking'] });
    people.vikram = await makeMember({ name: 'Vikram', gender: 'man', birth: 'Jan 1990', city: 'Chennai', blueprint: BASE_BP, vibes: ['Trekking', 'Nightlife'] });
    people.dev = await makeMember({ name: 'Dev', gender: 'man', birth: 'Jun 1998', city: 'Hyderabad', blueprint: { money: 72, roots: 10, kids: 62, ambition: 75 }, vibes: ['Art & theater'] });
    people.omar = await makeMember({ name: 'Omar', gender: 'man', birth: 'Feb 1994', city: 'Chennai', blueprint: { money: 10, roots: 95, kids: 5, ambition: 15 } });
    await api('/me/basics', { method: 'PUT', token: people.omar.token, body: { profession: 'Marine biologist', intentTimeline: 'Open, no timeline' } });
    await api('/me/basics', { method: 'PUT', token: people.vikram.token, body: { intentTimeline: 'Marriage this year' } });
    people.lena = await makeMember({ name: 'Lena', gender: 'woman', birth: 'Mar 1995', city: 'Chennai', blueprint: BASE_BP });
  });

  test('requires a session', async () => {
    assert.equal((await api('/search')).status, 401);
  });

  test('default: only visible members of the other gender, best fit first, with totals and city facets', async () => {
    const r = await run('');
    assert.equal(r.status, 200);
    const n = names(r);
    for (const want of ['Vikram', 'Dev', 'Omar']) assert.ok(n.includes(want), `${want} missing`);
    assert.ok(!n.includes('Lena') && !n.includes('Sita'), 'same gender / self excluded');
    const scores = r.data.results.map((c) => c.overlapScores.overall);
    assert.deepEqual(scores, [...scores].sort((a, b) => b - a));
    assert.equal(r.data.total, r.data.results.length);
    assert.ok(r.data.facets.cities.some((c) => c.city === 'Chennai' && c.count >= 2));
    assert.equal(typeof r.data.results[0].activeRecently, 'boolean');
  });

  test('free text matches name, city, profession and vibes (case-insensitive)', async () => {
    assert.deepEqual(names(await run('q=vik')), ['Vikram']);
    assert.ok(names(await run('q=hyderabad')).includes('Dev'));
    assert.deepEqual(names(await run('q=MARINE')), ['Omar']);
    assert.deepEqual(names(await run('q=theater')), ['Dev']);
    assert.equal((await run('q=%25')).data.total, 0, 'LIKE wildcards are escaped');
  });

  test('filters: age range, city, timeline, minimum alignment, strong pillars, shared vibes', async () => {
    const ages = (await run('ageMin=27&ageMax=33')).data.results.map((c) => c.age);
    assert.ok(ages.length && ages.every((a) => a >= 27 && a <= 33));
    assert.ok(!names(await run('city=chennai')).includes('Dev'));
    assert.deepEqual(names(await run(`timelines=${encodeURIComponent('Marriage this year')}`)), ['Vikram']);
    assert.ok(!names(await run('minScore=80')).includes('Omar'), 'poor fit filtered out');
    const strongRoots = names(await run('strongOn=money,roots'));
    assert.ok(strongRoots.includes('Vikram') && !strongRoots.includes('Dev'), 'Dev is far apart on roots');
    assert.deepEqual(names(await run(`vibes=${encodeURIComponent('Art & theater')}`)), ['Dev']);
  });

  test('sorting and paging', async () => {
    const asc = (await run('sort=age_asc')).data.results.map((c) => c.age);
    assert.deepEqual(asc, [...asc].sort((a, b) => a - b));
    const p1 = await run('limit=2');
    assert.equal(p1.data.results.length, 2);
    assert.equal(p1.data.nextOffset, 2);
    const p2 = await run('limit=2&offset=2');
    assert.ok(p2.data.results.every((c) => !p1.data.results.some((x) => x.id === c.id)));
  });

  test('not-contacted and passed members are excluded', async () => {
    await api('/conversations', { method: 'POST', token: seeker.token, body: { candidateId: people.vikram.id } });
    assert.ok(!names(await run('notContacted=true')).includes('Vikram'));
    await api(`/matches/${people.omar.id}/pass`, { method: 'POST', token: seeker.token });
    assert.ok(!names(await run('')).includes('Omar'), 'passed member hidden from search');
  });

  test('invalid filters are rejected with 400', async () => {
    for (const qs of ['ageMin=10', 'ageMin=40&ageMax=30', 'minScore=101', 'strongOn=caste', 'timelines=Never', 'vibes=Skydiving', 'sort=salary', 'limit=500']) {
      assert.equal((await run(qs)).status, 400, qs);
    }
  });
});

// ---------- engagement, safety and operations ----------

test.describe('engagement, safety and operations', () => {
  const NEAR = { money: 70, roots: 40, kids: 60, ambition: 75 };
  const me = (t) => api('/me', { token: t }).then((r) => r.data);
  const feedNames = async (t) => (await api('/matches', { token: t })).data.map((c) => c.firstName);
  const searchNames = async (t) => (await api('/search', { token: t })).data.results.map((c) => c.firstName);
  const inbox = (t) => api('/notifications', { token: t }).then((r) => r.data.items);
  let asha; let vasanth; let dev; let ishan; let neel; let admin;

  test.before(async () => {
    asha = await makeMember({ name: 'Asha', gender: 'woman', birth: 'Apr 1995', blueprint: NEAR, vibes: ['Trekking'] });
    vasanth = await makeMember({ name: 'Vasanth', gender: 'man', birth: 'Jan 1992', blueprint: NEAR, vibes: ['Trekking'] });
    dev = await makeMember({ name: 'Devan', gender: 'man', birth: 'Feb 1993', blueprint: { ...NEAR, roots: 60 } });
    ishan = await makeMember({ name: 'Ishan', gender: 'man', birth: 'Mar 1994', blueprint: { ...NEAR, kids: 40 } });
    neel = await makeMember({ name: 'Neelan', gender: 'man', birth: 'May 1990', blueprint: { ...NEAR, ambition: 50 } });
    admin = await signIn('+919999999999');
  });

  test('partner preferences are validated, saved, and shown both ways on cards', async () => {
    const put = (body, t = asha.token) => api('/me/preferences', { method: 'PUT', token: t, body });
    for (const bad of [{ age: { min: 40, max: 30 } }, { religion: ['Pastafarian'] }, { colour: ['red'] }, { height: { min: 50 } }, { age: [25] }]) {
      assert.equal((await put(bad)).status, 400, JSON.stringify(bad));
    }
    const ok = await put({ age: { min: 28, max: 34 }, motherTongue: ['Tamil'], religion: ['Hindu'] });
    assert.equal(ok.status, 200, JSON.stringify(ok.data));
    assert.deepEqual(ok.data.preferences.age, { min: 28, max: 34 });
    await api('/me/details', { method: 'PUT', token: vasanth.token, body: { religion: 'Hindu' } });
    await put({ age: { min: 25, max: 35 } }, vasanth.token);

    const card = (await api('/matches', { token: asha.token })).data.find((c) => c.firstName === 'Vasanth');
    assert.equal(card.fitsMyPreferences.total, 3);
    assert.equal(card.fitsMyPreferences.met, 3, JSON.stringify(card.fitsMyPreferences));
    assert.equal(card.iFitTheirPreferences.total, 1);
    assert.equal(card.iFitTheirPreferences.met, 1);
    assert.deepEqual(card.lookingFor.age, { min: 25, max: 35 });
    const older = (await api('/matches', { token: asha.token })).data.find((c) => c.firstName === 'Neelan');
    assert.equal(older.fitsMyPreferences.items.find((i) => i.key === 'age').met, false);

    const cleared = await put({ religion: null });
    assert.equal(cleared.data.preferences.religion, undefined);
    const filtered = (await api('/search?matchesPreferences=true', { token: asha.token })).data.results.map((c) => c.firstName);
    assert.ok(filtered.includes('Vasanth') && !filtered.includes('Neelan'), filtered.join());
  });

  test('profile prompts: up to three answers from the list, shown on cards and counted in completion', async () => {
    const put = (prompts) => api('/me/prompts', { method: 'PUT', token: vasanth.token, body: { prompts } });
    assert.equal((await put([{ q: 'Made up?', a: 'x' }])).status, 400);
    assert.equal((await put([{ q: 'A perfect Sunday for me is…', a: '' }])).status, 400);
    assert.equal((await put(Array(4).fill({ q: 'A perfect Sunday for me is…', a: 'x' }))).status, 400);
    const before = (await me(vasanth.token)).profileCompletion.percent;
    const ok = await put([{ q: 'A perfect Sunday for me is…', a: '  Filter coffee and a long trek  ' }]);
    assert.equal(ok.status, 200);
    assert.equal(ok.data.prompts[0].a, 'Filter coffee and a long trek');
    assert.ok(ok.data.profileCompletion.percent > before);
    const card = (await api('/matches', { token: asha.token })).data.find((c) => c.firstName === 'Vasanth');
    assert.equal(card.prompts[0].a, 'Filter coffee and a long trek');
  });

  let declinedId;
  test('interests: free members have a daily limit; declined requests stay closed for the sender', async () => {
    const send = (to, message) => api('/conversations', { method: 'POST', token: asha.token, body: { candidateId: to.id, message } });
    assert.equal((await send(vasanth, 'Hi Vasanth')).status, 201);
    const toDev = await send(dev);
    assert.equal(toDev.status, 201);
    declinedId = toDev.data.id;
    assert.equal((await send(ishan)).status, 201);
    const limited = await send(neel);
    assert.equal(limited.status, 429);
    assert.equal(limited.data.code, 'INTEREST_LIMIT');
    const limits = (await api('/conversations/limits', { token: asha.token })).data;
    assert.equal(limits.interestsLeftToday, 0);

    // Devan declines: it vanishes for him; Asha sees it as declined and can neither write nor re-send
    assert.equal((await api(`/conversations/${declinedId}/decline`, { method: 'POST', token: asha.token })).status, 400, 'sender cannot decline');
    assert.equal((await api(`/conversations/${declinedId}/decline`, { method: 'POST', token: dev.token })).status, 200);
    assert.ok(!(await api('/conversations', { token: dev.token })).data.some((c) => c.id === declinedId));
    const mine = (await api('/conversations', { token: asha.token })).data.find((c) => c.id === declinedId);
    assert.equal(mine.status, 'declined');
    assert.equal((await api(`/conversations/${declinedId}/messages`, { method: 'POST', token: asha.token, body: { text: 'hi' } })).status, 403);
    assert.equal((await send(dev)).status, 409);
  });

  test('accepting unlocks chat and unblurs photos for both', async () => {
    const thread = (await api('/conversations', { token: vasanth.token })).data.find((c) => c.candidateName === 'Asha');
    assert.equal(thread.needsMyResponse, true);
    assert.equal(thread.isBlurred, true);
    assert.equal((await api(`/conversations/${thread.id}/accept`, { method: 'POST', token: asha.token })).status, 403, 'only the recipient accepts');
    const accepted = await api(`/conversations/${thread.id}/accept`, { method: 'POST', token: vasanth.token });
    assert.equal(accepted.data.status, 'accepted');
    assert.equal(accepted.data.isBlurred, false);
    assert.ok(accepted.data.conversationPrompts.length >= 2);
    const card = (await api('/matches', { token: asha.token })).data.find((c) => c.firstName === 'Vasanth');
    assert.equal(card.photoBlurred, false);
    assert.equal(card.interest.status, 'accepted');
    assert.ok((await inbox(asha.token)).some((n) => n.type === 'interest_accepted' && n.title === 'Vasanth accepted your interest'));
  });

  test('shortlist and profile views: owners see counts; free members don’t see who', async () => {
    assert.equal((await api(`/matches/${ishan.id}/shortlist`, { method: 'POST', token: asha.token })).status, 200);
    const list = (await api('/matches/shortlist', { token: asha.token })).data;
    assert.deepEqual(list.map((c) => c.firstName), ['Ishan']);
    assert.equal((await api('/matches', { token: asha.token })).data.find((c) => c.firstName === 'Ishan').shortlisted, true);
    const cmp = await api(`/matches/${asha.id}/compare`, { token: ishan.token }); // Ishan views Asha's full profile
    assert.equal(cmp.status, 200);
    await api(`/matches/${asha.id}/shortlist`, { method: 'POST', token: ishan.token });

    const free = (await api('/matches/admirers', { token: asha.token })).data;
    assert.equal(free.premium, false);
    assert.equal(free.views.count, 1);
    assert.equal(free.views.people, null);
    assert.equal(free.shortlists.count, 1);
    assert.equal((await api(`/matches/${ishan.id}/shortlist`, { method: 'DELETE', token: asha.token })).data.shortlisted, false);
  });

  test('premium: dummy checkout activates it; unlocks admirers, unlimited interests, incognito and read receipts', async () => {
    assert.equal((await api('/me/privacy', { method: 'PUT', token: asha.token, body: { incognito: true } })).status, 403);
    const plans = (await api('/premium', { token: asha.token })).data;
    assert.equal(plans.premium, false);
    assert.equal(plans.plans.length, 3);
    const order = await api('/premium/checkout', { method: 'POST', token: asha.token, body: { plan: 'premium_3m' } });
    assert.equal(order.status, 201);
    assert.equal((await api('/premium/confirm', { method: 'POST', token: asha.token, body: { paymentId: order.data.paymentId, payload: {} } })).status, 402);
    const order2 = await api('/premium/checkout', { method: 'POST', token: asha.token, body: { plan: 'premium_3m' } });
    const done = await api('/premium/confirm', { method: 'POST', token: asha.token, body: { paymentId: order2.data.paymentId, payload: { dummyConfirm: true } } });
    assert.equal(done.status, 200, JSON.stringify(done.data));
    assert.equal(done.data.premium, true);
    const profile = await me(asha.token);
    assert.equal(profile.plan, 'premium');
    assert.ok(new Date(profile.premiumUntil) > new Date(Date.now() + 80 * 86400000));
    assert.deepEqual((await api('/premium/payments', { token: asha.token })).data.map((p) => p.status), ['paid', 'failed']);

    const admirers = (await api('/matches/admirers', { token: asha.token })).data;
    assert.deepEqual(admirers.views.people.map((p) => p.firstName), ['Ishan']);
    assert.equal((await api('/conversations', { method: 'POST', token: asha.token, body: { candidateId: neel.id } })).status, 201, 'no limit');
    assert.equal((await api('/me/privacy', { method: 'PUT', token: asha.token, body: { incognito: true } })).data.incognito, true);
    assert.equal((await api(`/matches/${neel.id}/view`, { method: 'POST', token: asha.token })).data.recorded, false);
    assert.equal((await api('/matches', { token: vasanth.token })).data.find((c) => c.firstName === 'Asha').premium, true);

    // Read receipts
    const thread = (await api('/conversations', { token: asha.token })).data.find((c) => c.candidateName === 'Vasanth');
    await api(`/conversations/${thread.id}/messages`, { method: 'POST', token: asha.token, body: { text: 'Seen?' } });
    let msgs = (await api(`/conversations/${thread.id}`, { token: asha.token })).data.messages.filter((m) => m.sender === 'me');
    assert.equal(msgs.at(-1).seen, false);
    await api(`/conversations/${thread.id}/read`, { method: 'PUT', token: vasanth.token });
    msgs = (await api(`/conversations/${thread.id}`, { token: asha.token })).data.messages.filter((m) => m.sender === 'me');
    assert.equal(msgs.at(-1).seen, true);
    const vasanthSide = (await api(`/conversations/${thread.id}`, { token: vasanth.token })).data.messages.filter((m) => m.sender === 'me');
    assert.ok(vasanthSide.every((m) => m.seen === undefined), 'free members get no receipts');
  });

  test('why we matched: per-pillar comparison; horoscope only when both opt in', async () => {
    const cmp = (await api(`/matches/${dev.id}/compare`, { token: asha.token })).data;
    assert.equal(cmp.pillars.length, 4);
    const roots = cmp.pillars.find((p) => p.key === 'roots');
    assert.equal(roots.mine, 40);
    assert.equal(roots.theirs, 60);
    assert.equal(roots.gap, 20);
    assert.ok(['aligned', 'close', 'talk', 'dealbreaker'].includes(roots.verdict));
    assert.equal(cmp.horoscope, null);

    await api('/me/details', { method: 'PUT', token: asha.token, body: { star: 'Rohini', raasi: 'Rishabam (Taurus)' } });
    await api('/me/details', { method: 'PUT', token: vasanth.token, body: { star: 'Ashwini', raasi: 'Mesham (Aries)' } });
    await api('/me/privacy', { method: 'PUT', token: asha.token, body: { showHoroscope: true } });
    assert.equal((await api(`/matches/${vasanth.id}/compare`, { token: asha.token })).data.horoscope, null, 'Vasanth has not opted in');
    await api('/me/privacy', { method: 'PUT', token: vasanth.token, body: { showHoroscope: true } });
    const h = (await api(`/matches/${vasanth.id}/compare`, { token: asha.token })).data.horoscope;
    assert.equal(h.total, 10);
    assert.equal(h.matched, 5);
    assert.ok(h.items.find((i) => i.name === 'Rajju'));
    const fromHim = (await api(`/matches/${asha.id}/compare`, { token: vasanth.token })).data.horoscope;
    assert.equal(fromHim.matched, h.matched, 'same result from either side (bride counted first)');
  });

  test('daily picks: stable for the day, only people not yet contacted, each with a reason', async () => {
    const first = (await api('/matches/daily', { token: vasanth.token })).data;
    const second = (await api('/matches/daily', { token: vasanth.token })).data;
    assert.deepEqual(first.picks.map((p) => p.id), second.picks.map((p) => p.id));
    assert.ok(first.picks.length >= 1 && first.picks.length <= 5);
    assert.ok(!first.picks.some((p) => p.firstName === 'Asha'), 'already talking to Asha');
    assert.ok(first.picks.every((p) => typeof p.pickReason === 'string' && p.pickReason.length > 5));
  });

  test('saved searches: validated, listed, and alert when a fitting newcomer joins', async () => {
    assert.equal((await api('/search/saved', { method: 'POST', token: asha.token, body: { name: '', filters: {} } })).status, 400);
    assert.equal((await api('/search/saved', { method: 'POST', token: asha.token, body: { name: 'Bad', filters: { sort: 'salary' } } })).status, 400);
    const saved = await api('/search/saved', { method: 'POST', token: asha.token, body: { name: 'Pune folks', filters: { city: 'Pune', minScore: 70 } } });
    assert.equal(saved.status, 201);
    assert.deepEqual((await api('/search/saved', { token: asha.token })).data.map((s) => s.name), ['Pune folks']);

    await makeMember({ name: 'Rohit', gender: 'man', city: 'Pune', blueprint: NEAR });
    const alert = (await inbox(asha.token)).find((n) => n.type === 'saved_search');
    assert.ok(alert, 'saved-search alert');
    assert.equal(alert.title, 'New match for “Pune folks”');
    await makeMember({ name: 'Mohan', gender: 'man', city: 'Delhi', blueprint: NEAR });
    assert.equal((await inbox(asha.token)).filter((n) => n.type === 'saved_search').length, 1, 'no alert for a non-fit');

    assert.equal((await api(`/search/saved/${saved.data.id}`, { method: 'PUT', token: asha.token, body: { alerts: false } })).data.alerts, false);
    assert.equal((await api(`/search/saved/${saved.data.id}`, { method: 'DELETE', token: vasanth.token })).status, 404);
    assert.equal((await api(`/search/saved/${saved.data.id}`, { method: 'DELETE', token: asha.token })).status, 200);
  });

  test('pausing hides you from the feed and search; unpausing brings you back', async () => {
    assert.equal((await api('/me/status', { method: 'PUT', token: ishan.token, body: { paused: true } })).data.paused, true);
    assert.ok(!(await feedNames(asha.token)).includes('Ishan'));
    assert.ok(!(await searchNames(asha.token)).includes('Ishan'));
    await api('/me/status', { method: 'PUT', token: ishan.token, body: { paused: false } });
    assert.ok((await feedNames(asha.token)).includes('Ishan'));
  });

  test('blocking hides both members from each other everywhere and stops messages', async () => {
    const thread = (await api('/conversations', { token: vasanth.token })).data.find((c) => c.candidateName === 'Asha');
    assert.equal((await api('/safety/blocks', { method: 'POST', token: vasanth.token, body: { userId: vasanth.id } })).status, 400);
    assert.equal((await api('/safety/blocks', { method: 'POST', token: vasanth.token, body: { userId: asha.id } })).status, 200);
    assert.ok(!(await feedNames(vasanth.token)).includes('Asha'));
    assert.ok(!(await feedNames(asha.token)).includes('Vasanth'), 'hidden for the blocked member too');
    assert.ok(!(await searchNames(asha.token)).includes('Vasanth'));
    assert.equal((await api(`/matches/${vasanth.id}`, { token: asha.token })).status, 404);
    assert.ok(!(await api('/conversations', { token: asha.token })).data.some((c) => c.id === thread.id));
    assert.equal((await api(`/conversations/${thread.id}/messages`, { method: 'POST', token: asha.token, body: { text: 'hello?' } })).status, 404);
    assert.deepEqual((await api('/safety/blocks', { token: vasanth.token })).data.map((b) => b.firstName), ['Asha']);
    await api(`/safety/blocks/${asha.id}`, { method: 'DELETE', token: vasanth.token });
    assert.ok((await feedNames(vasanth.token)).includes('Asha'));
  });

  let reportId;
  test('reports: reasons validated; enough reports hide a member until an admin reviews', async () => {
    assert.equal((await api('/safety/reports', { method: 'POST', token: asha.token, body: { userId: neel.id, reason: 'boring' } })).status, 400);
    const first = await api('/safety/reports', { method: 'POST', token: asha.token, body: { userId: neel.id, reason: 'money', details: 'Asked for a loan' } });
    assert.equal(first.status, 201);
    assert.equal(first.data.hidden, false);
    assert.ok(!(await feedNames(asha.token)).includes('Neelan'), 'reporting also blocks');
    const other = await makeMember({ name: 'Meena', gender: 'woman', blueprint: NEAR });
    assert.ok((await feedNames(other.token)).includes('Neelan'));
    const second = await api('/safety/reports', { method: 'POST', token: other.token, body: { userId: neel.id, reason: 'fake' } });
    assert.equal(second.data.hidden, true);
    const third = await makeMember({ name: 'Lata', gender: 'woman', blueprint: NEAR });
    assert.ok(!(await feedNames(third.token)).includes('Neelan'), 'hidden from everyone');
    assert.equal((await me(neel.token)).hiddenByModeration, true);

    assert.equal((await api('/admin/reports', { token: asha.token })).status, 403);
    const reports = (await api('/admin/reports', { token: admin.token })).data;
    const mineReport = reports.find((r) => r.reason === 'money');
    assert.equal(mineReport.reported.firstName, 'Neelan');
    assert.equal(mineReport.openReportsAgainst, 2);
    reportId = mineReport.id;
    // Dismissing one leaves the other open: still hidden; dismissing both brings him back
    await api(`/admin/reports/${reportId}/resolve`, { method: 'POST', token: admin.token, body: { action: 'dismiss' } });
    assert.ok(!(await feedNames(third.token)).includes('Neelan'));
    const last = (await api('/admin/reports', { token: admin.token })).data.find((r) => r.reported.firstName === 'Neelan');
    await api(`/admin/reports/${last.id}/resolve`, { method: 'POST', token: admin.token, body: { action: 'dismiss' } });
    assert.ok((await feedNames(third.token)).includes('Neelan'));
  });

  test('admin: stats and member search; hide and unhide', async () => {
    const stats = (await api('/admin/stats', { token: admin.token })).data;
    assert.ok(stats.members > 10 && stats.onboarded > 5);
    assert.equal(stats.premium, 1);
    assert.equal(stats.signups.length, 14);
    const found = (await api('/admin/members?q=Ishan', { token: admin.token })).data;
    assert.equal(found[0].firstName, 'Ishan');
    assert.ok(found[0].phone.includes('•'), 'phones are masked');
    await api(`/admin/members/${ishan.id}/hide`, { method: 'POST', token: admin.token });
    assert.ok(!(await feedNames(asha.token)).includes('Ishan'));
    await api(`/admin/members/${ishan.id}/unhide`, { method: 'POST', token: admin.token });
    assert.ok((await feedNames(asha.token)).includes('Ishan'));
  });

  test('ID verification: private selfie, admin review, verified badge', async () => {
    const selfieForm = async () => {
      const form = new FormData();
      form.append('selfie', new Blob([await sharp({ create: { width: 400, height: 400, channels: 3, background: '#996655' } }).jpeg().toBuffer()], { type: 'image/jpeg' }), 's.jpg');
      return form;
    };
    assert.equal((await api('/me/verification', { token: dev.token })).data.verified, false);
    const sent = await api('/me/verification', { method: 'POST', token: dev.token, form: await selfieForm() });
    assert.equal(sent.status, 201, JSON.stringify(sent.data));
    assert.equal(sent.data.request.status, 'pending');
    assert.equal((await api('/me/verification', { method: 'POST', token: dev.token, form: await selfieForm() })).status, 409);
    assert.ok(!fs.readdirSync(stack.uploadDir, { recursive: true }).some((f) => String(f).includes('verifications')), 'not in public uploads');

    const queue = (await api('/admin/verifications', { token: admin.token })).data;
    const item = queue.find((v) => v.member.firstName === 'Devan');
    assert.ok(item.profilePhoto);
    const selfie = await fetch(`${base}${item.selfieUrl}`, { headers: { Authorization: `Bearer ${admin.token}` } });
    assert.equal(selfie.status, 200);
    assert.equal(selfie.headers.get('content-type'), 'image/jpeg');
    assert.equal((await fetch(`${base}${item.selfieUrl}`, { headers: { Authorization: `Bearer ${dev.token}` } })).status, 403);

    await api(`/admin/verifications/${item.id}`, { method: 'POST', token: admin.token, body: { decision: 'approved' } });
    assert.equal((await me(dev.token)).verified, true);
    assert.ok((await inbox(dev.token)).some((n) => n.type === 'account' && n.title === 'You’re verified'));
    assert.equal((await api('/matches', { token: asha.token })).data.find((c) => c.firstName === 'Devan').verified, true);
  });

  test('success stories: partner confirms, admin publishes, public page lists it', async () => {
    const thread = (await api('/conversations', { token: asha.token })).data.find((c) => c.candidateName === 'Vasanth');
    const pending = (await api('/conversations', { token: asha.token })).data.find((c) => c.status === 'requested');
    assert.equal((await api('/stories', { method: 'POST', token: asha.token, body: { conversationId: pending.id, title: 'x', story: 'y' } })).status, 400);
    const story = await api('/stories', { method: 'POST', token: asha.token, body: { conversationId: thread.id, title: 'Found each other on a trek', story: 'We matched on roots and money first.' } });
    assert.equal(story.status, 201);
    assert.equal(story.data.names, 'Asha & Vasanth');
    assert.equal((await api('/stories', { method: 'POST', token: vasanth.token, body: { conversationId: thread.id, title: 'Again', story: 'Dup' } })).status, 409);
    assert.equal((await api(`/admin/stories/${story.data.id}`, { method: 'POST', token: admin.token, body: { decision: 'published' } })).status, 409, 'needs partner first');
    const mine = (await api('/stories', { token: vasanth.token })).data;
    assert.equal(mine[0].needsMyConfirmation, true);
    await api(`/stories/${story.data.id}/confirm`, { method: 'POST', token: vasanth.token });
    assert.equal((await api('/public/stories')).data.length, 0);
    assert.equal((await api(`/admin/stories/${story.data.id}`, { method: 'POST', token: admin.token, body: { decision: 'published' } })).status, 200);
    const pub = (await api('/public/stories')).data;
    assert.equal(pub[0].names, 'Asha & Vasanth');
    assert.equal(pub[0].title, 'Found each other on a trek');
    assert.equal((await api(`/stories/${story.data.id}`, { method: 'DELETE', token: vasanth.token })).status, 200, 'either partner can withdraw');
    assert.equal((await api('/public/stories')).data.length, 0);
  });

  test('family: "unsure" votes, combined votes per profile, and a managing parent edits details', async () => {
    const link = (await api('/family/links', { method: 'POST', token: asha.token, body: { name: 'Amma', relation: 'Mother', phone: '9811122233' } })).data;
    const link2 = (await api('/family/links', { method: 'POST', token: asha.token, body: { name: 'Appa', relation: 'Father', phone: '9811122234' } })).data;
    await api('/family/shares', { method: 'POST', token: asha.token, body: { candidateIds: [dev.id], familyLinkId: link.id, expiresIn: '30d' } });
    await api('/family/shares', { method: 'POST', token: asha.token, body: { candidateIds: [dev.id], familyLinkId: link2.id, expiresIn: '30d' } });
    const portal = (await api(`/portal/${link.portalToken}`)).data;
    assert.equal(portal.canManage, false);
    assert.equal(portal.profileDetails, null);
    const res = await api(`/portal/${link.portalToken}/shares/${portal.records[0].id}/feedback`, { method: 'POST', body: { decision: 'unsure' } });
    assert.equal(res.status, 200);
    assert.equal(res.data.statusBadge, 'AMMA IS UNSURE');
    const votes = (await api('/family/votes', { token: asha.token })).data.find((v) => v.candidateName === 'Devan');
    assert.deepEqual(votes.tally, { approved: 0, unsure: 1, concern_raised: 0, awaiting: 1 });
    assert.equal(votes.votes.length, 2);

    assert.equal((await api(`/portal/${link.portalToken}/details`, { method: 'PUT', body: { college: 'IIT Madras' } })).status, 403);
    assert.equal((await api(`/family/links/${link.id}`, { method: 'PUT', token: asha.token, body: { canManage: true } })).data.canManage, true);
    const managed = (await api(`/portal/${link.portalToken}`)).data;
    assert.equal(managed.canManage, true);
    assert.equal(managed.profileDetails.firstName, 'Asha');
    assert.equal((await api(`/portal/${link.portalToken}/details`, { method: 'PUT', body: { firstName: 'Changed' } })).status, 400);
    const edited = await api(`/portal/${link.portalToken}/details`, { method: 'PUT', body: { college: 'IIT Madras' } });
    assert.equal(edited.status, 200);
    assert.equal((await me(asha.token)).details.college, 'IIT Madras');
    assert.ok((await inbox(asha.token)).some((n) => n.type === 'family_edit'));
  });

  test('jobs: morning daily-picks notification once a day; nudges for incomplete profiles every few days', async () => {
    const { runJobsOnce } = require('../src/modules/jobs');
    const morning = new Date();
    morning.setUTCHours(3, 30, 0, 0); // 09:00 IST
    const first = await runJobsOnce(morning);
    assert.ok(first.picks >= 1, JSON.stringify(first));
    assert.ok(first.nudges >= 1, JSON.stringify(first));
    const daily = (await inbox(vasanth.token)).find((n) => n.type === 'daily_picks');
    assert.ok(daily && /^Your \d picks for today$/.test(daily.title), JSON.stringify(daily));
    const nudge = (await inbox(vasanth.token)).find((n) => n.type === 'profile_nudge');
    assert.match(nudge.title, /^Your profile is \d+% complete$/);
    const again = await runJobsOnce(morning);
    assert.deepEqual(again, { picks: 0, nudges: 0 }, 'idempotent');
    const early = new Date(morning);
    early.setUTCHours(0, 0, 0, 0); // 05:30 IST: before picks time
    assert.equal((await runJobsOnce(early)).picks, 0);
  });

  test('calls: signalling is relayed only within accepted conversations; missed calls notify', async () => {
    const thread = (await api('/conversations', { token: asha.token })).data.find((c) => c.candidateName === 'Vasanth');
    const pending = (await api('/conversations', { token: asha.token })).data.find((c) => c.status === 'requested');
    const cfg = (await api('/calls/config', { token: asha.token })).data;
    assert.ok(cfg.iceServers[0].urls.length);
    const a = wsClient(asha.token);
    const v = wsClient(vasanth.token);
    try {
      await Promise.all([a.opened, v.opened]);
      a.ws.send(JSON.stringify({ type: 'call:invite', conversationId: pending.id, callId: 'c0', kind: 'video' }));
      const refused = await a.waitFor('call:error');
      assert.match(refused.error, /accepted interest/);

      a.ws.send(JSON.stringify({ type: 'call:invite', conversationId: thread.id, callId: 'c1', kind: 'video' }));
      const incoming = await v.waitFor('call:incoming');
      assert.equal(incoming.from.name, 'Asha');
      assert.equal(incoming.kind, 'video');
      a.ws.send(JSON.stringify({ type: 'call:offer', conversationId: thread.id, callId: 'c1', sdp: { type: 'offer', sdp: 'v=0' } }));
      assert.equal((await v.waitFor('call:offer')).sdp.type, 'offer');
      v.ws.send(JSON.stringify({ type: 'call:answer', conversationId: thread.id, callId: 'c1', sdp: { type: 'answer', sdp: 'v=0' } }));
      assert.equal((await a.waitFor('call:answer')).sdp.type, 'answer');
      a.ws.send(JSON.stringify({ type: 'call:end', conversationId: thread.id, callId: 'c1', reason: 'missed', kind: 'video' }));
      await v.waitFor('call:end');
      await new Promise((r) => setTimeout(r, 100));
      assert.ok((await inbox(vasanth.token)).some((n) => n.type === 'call' && n.title === 'Missed video call from Asha'));
    } finally {
      a.ws.close();
      v.ws.close();
      await new Promise((r) => setTimeout(r, 50));
    }
  });

  test('the data export includes the new records', async () => {
    const exp = (await api('/me/export', { token: asha.token })).data;
    for (const key of ['shortlisted', 'savedSearches', 'blocks', 'reportsFiled', 'payments', 'successStories', 'verifications']) {
      assert.ok(Array.isArray(exp[key]), key);
    }
    assert.ok(exp.reportsFiled.some((r) => r.reason === 'money'));
    assert.ok(exp.payments.some((p) => p.status === 'paid'));
    assert.deepEqual(exp.profile.preferences.age, { min: 28, max: 34 });
  });
});

test('migration refuses to touch legacy demo tables unless explicitly allowed', async () => {
  const { Client } = require('pg');
  const admin = new Client({ connectionString: stack.pgUrl });
  await admin.connect();
  await admin.query('CREATE DATABASE legacy_check');
  await admin.end();
  const legacyUrl = stack.pgUrl.replace(/\/sangam_test$/, '/legacy_check');
  const legacy = new Client({ connectionString: legacyUrl });
  await legacy.connect();
  await legacy.query('CREATE TABLE users (id TEXT PRIMARY KEY, is_current_user BOOLEAN)');
  await legacy.query(`INSERT INTO users VALUES ('demo', true)`);
  await legacy.end();

  const { execFileSync } = require('child_process');
  const run = (extraEnv) => execFileSync(process.execPath, [path.join(__dirname, '..', 'src', 'db', 'migrate.js')], {
    env: { ...process.env, DATABASE_URL: legacyUrl, ...extraEnv }, encoding: 'utf8', stdio: 'pipe',
  });
  assert.throws(() => run({}), /MIGRATE_DROP_LEGACY=true/);
  assert.match(run({ MIGRATE_DROP_LEGACY: 'true' }), /Migrations complete/);

  const check = new Client({ connectionString: legacyUrl });
  await check.connect();
  const cols = (await check.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'users'`)).rows.map((r) => r.column_name);
  await check.end();
  assert.ok(cols.includes('phone') && !cols.includes('is_current_user'));
});

test('unknown routes and bad JSON give clean errors; health checks the database', async () => {
  assert.equal((await api('/nope')).status, 404);
  const bad = await fetch(`${base}/api/auth/otp/send`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{bad' });
  assert.equal(bad.status, 400);
  const health = await api('/health');
  assert.equal(health.data.database, 'connected');
});
