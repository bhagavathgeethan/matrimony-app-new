// Periodic jobs: the morning "daily picks" notification and gentle profile-completion nudges.
// Both are idempotent per day / per nudge window, so running them more often is harmless.
const env = require('../config/env');
const db = require('../config/db');
const { getProfile } = require('./profile');
const { dailyPicks } = require('./matches');
const { notify } = require('./notifications');
const { tx } = require('../lib/i18n');
const { VISIBLE_USER_SQL, todayIST, hourIST } = require('../lib/members');

// After DAILY_PICKS_HOUR_IST, tell each active member their picks are ready (once a day, only if there are any)
async function notifyDailyPicks(now = new Date()) {
  if (hourIST(now) < env.DAILY_PICKS_HOUR_IST) return 0;
  const day = todayIST(now);
  const due = await db.query(
    `SELECT u.id FROM users u
     WHERE ${VISIBLE_USER_SQL} AND (u.daily_picks_notified_on IS NULL OR u.daily_picks_notified_on < $1::date)
       AND u.last_active_at > NOW() - INTERVAL '30 days'
     LIMIT 500`,
    [day]
  );
  let sent = 0;
  for (const { id } of due.rows) {
    await db.query('UPDATE users SET daily_picks_notified_on = $2 WHERE id = $1', [id, day]);
    let picks;
    try {
      ({ picks } = await dailyPicks(id));
    } catch {
      continue;
    }
    if (!picks.length) continue;
    await notify(id, {
      type: 'daily_picks',
      title: tx('Your {n} picks for today', { n: picks.length }),
      body: tx('{name} and others, chosen for how closely your blueprints align.', { name: picks[0].firstName }),
      data: { day },
      groupKey: `daily:${day}`,
    });
    sent += 1;
  }
  return sent;
}

// Members who finished onboarding a while ago but whose profile is incomplete get a nudge every few days
async function nudgeIncompleteProfiles() {
  const due = await db.query(
    `SELECT u.id FROM users u
     WHERE u.onboarding_completed_at < NOW() - make_interval(hours => $1)
       AND (u.last_nudged_at IS NULL OR u.last_nudged_at < NOW() - make_interval(days => $2))
       AND u.paused_at IS NULL
     LIMIT 500`,
    [env.NUDGE_AFTER_HOURS, env.NUDGE_EVERY_DAYS]
  );
  let sent = 0;
  for (const { id } of due.rows) {
    await db.query('UPDATE users SET last_nudged_at = NOW() WHERE id = $1', [id]);
    const profile = await getProfile(id).catch(() => null);
    const c = profile?.profileCompletion;
    if (!c || c.percent >= 100) continue;
    const section = c.sections.find((s) => !s.complete);
    await notify(id, {
      type: 'profile_nudge',
      title: tx('Your profile is {n}% complete', { n: c.percent }),
      body: section
        ? tx('Add your {section} — complete profiles get more interests.', { section: section.title })
        : tx('A few small things left — complete profiles get more interests.'),
      data: { section: section?.key || null },
      groupKey: 'profile-nudge',
    });
    sent += 1;
  }
  return sent;
}

// Free members' saved-search matches go out as one digest a day, in the morning
async function savedSearchDigests(now = new Date()) {
  if (hourIST(now) < env.DAILY_PICKS_HOUR_IST) return 0;
  return require('./search').sendSavedSearchDigests();
}

async function runJobsOnce(now = new Date()) {
  const picks = await notifyDailyPicks(now);
  const nudges = await nudgeIncompleteProfiles();
  const digests = await savedSearchDigests(now);
  return { picks, nudges, digests };
}

function startJobs() {
  const run = () => runJobsOnce().catch((err) => console.error('Background jobs failed:', err.message));
  const timer = setInterval(run, env.JOBS_INTERVAL_MINUTES * 60000);
  timer.unref?.();
  setTimeout(run, 15000).unref?.();
  return timer;
}

module.exports = { startJobs, runJobsOnce, notifyDailyPicks, nudgeIncompleteProfiles };
