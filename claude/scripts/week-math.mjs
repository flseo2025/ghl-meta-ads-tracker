#!/usr/bin/env node
// Deterministic helpers for the stat tracker: week bounds in the member's own
// timezone, UTM normalization, and counting submissions and calls per week.
// No dependencies. Uses Intl for timezone math, never the machine's clock zone.
//
// Usage:
//   node week-math.mjs week    <sunday YYYY-MM-DD> <IANA tz>
//   node week-math.mjs weeks   <first sunday> <last sunday> <IANA tz>
//   node week-math.mjs norm    "<utm string>"
//   node week-math.mjs tally   <sunday> <tz> <submissions.json> [--exclude "a,b"] [--formId ID | --surveyId ID]
//                              [--utmMap {"adSet":"utm_medium",...}]  (only if the member tags ads differently)
//   node week-math.mjs calls   <sunday> <tz> <events.json> [--now <ISO>]
//   node week-math.mjs selftest

import { readFileSync } from 'node:fs';

// ---------- timezone math ----------

// Offset (ms) of tz at a given UTC instant: local wall time minus UTC.
function tzOffsetMs(tz, utcMs) {
  const f = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const p = Object.fromEntries(f.formatToParts(new Date(utcMs)).map(x => [x.type, x.value]));
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return asUtc - Math.floor(utcMs / 1000) * 1000;
}

// UTC ms of local wall-clock time y-m-d h:mi:s in tz.
function zonedToUtcMs(tz, y, m, d, h = 0, mi = 0, s = 0) {
  const guess = Date.UTC(y, m - 1, d, h, mi, s);
  let off = tzOffsetMs(tz, guess);
  let utc = guess - off;
  const off2 = tzOffsetMs(tz, utc);
  if (off2 !== off) utc = guess - off2;
  return utc;
}

function parseYmd(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
  if (!m) throw new Error(`Expected a date like 2026-10-11, got "${s}"`);
  return [+m[1], +m[2], +m[3]];
}

function ymdAdd([y, m, d], days) {
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return [t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate()];
}

const p2 = n => String(n).padStart(2, '0');
const ymdStr = ([y, m, d]) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

function assertTz(tz) {
  try { new Intl.DateTimeFormat('en-US', { timeZone: tz }); }
  catch { throw new Error(`Unknown timezone "${tz}". Use an IANA name like America/Chicago.`); }
}

export function week(sunday, tz) {
  assertTz(tz);
  const s = parseYmd(sunday);
  const dow = new Date(Date.UTC(s[0], s[1] - 1, s[2])).getUTCDay();
  if (dow !== 0) throw new Error(`${sunday} is not a Sunday. Weeks run Sunday to Saturday.`);
  const sat = ymdAdd(s, 6);
  const startMs = zonedToUtcMs(tz, ...s, 0, 0, 0);
  const endMs = zonedToUtcMs(tz, ...ymdAdd(s, 7), 0, 0, 0) - 1; // Saturday 23:59:59.999
  return {
    label: `${p2(s[1])}/${p2(s[2])} - ${p2(sat[1])}/${p2(sat[2])}`,
    sunday: ymdStr(s),
    saturday: ymdStr(sat),
    timezone: tz,
    startUtc: new Date(startMs).toISOString(),
    endUtc: new Date(endMs).toISOString(),
    startMs,
    endMs,
    // Submission endpoints filter by UTC date, so query one day wider each side.
    queryStartAt: ymdStr(ymdAdd(s, -1)),
    queryEndAt: ymdStr(ymdAdd(sat, 1)),
  };
}

export function weeks(first, last, tz) {
  const out = [];
  let cur = parseYmd(first);
  const end = Date.UTC(...(([y, m, d]) => [y, m - 1, d])(parseYmd(last)));
  while (Date.UTC(cur[0], cur[1] - 1, cur[2]) <= end) {
    out.push(week(ymdStr(cur), tz));
    cur = ymdAdd(cur, 7);
  }
  return out;
}

const inWeek = (iso, w) => {
  const t = Date.parse(iso);
  return Number.isFinite(t) && t >= w.startMs && t <= w.endMs;
};

// ---------- UTM normalization ----------

export function norm(s) {
  if (s == null) return '';
  let v = String(s);
  try { v = decodeURIComponent(v.replace(/\+/g, ' ')); } catch { v = v.replace(/\+/g, ' '); }
  return v.replace(/\s+/g, ' ').trim().toLowerCase();
}

// ---------- tally submissions ----------

function loadJson(path) {
  const raw = JSON.parse(readFileSync(path, 'utf8'));
  // Accept a bare array, {submissions:[...]}, {events:[...]}, or an MCP wrapper {data:{...}}.
  const d = raw.data ?? raw;
  return d.submissions ?? d.events ?? (Array.isArray(d) ? d : []);
}

// Which URL parameter carries which Meta name. The Rebels ad template is
// utm_source={{campaign.name}}&utm_medium={{adset.name}}&utm_campaign={{ad.name}}&utm_content={{placement}}
export const DEFAULT_UTM_MAP = { campaign: "utm_source", adSet: "utm_medium", ad: "utm_campaign", placement: "utm_content" };

function utmOf(sub, map = DEFAULT_UTM_MAP) {
  const ev = sub?.others?.eventData ?? {};
  const p = ev.url_params ?? ev.urlParams ?? {};
  return {
    adSet: p[map.adSet] ?? null,
    campaign: p[map.campaign] ?? null,
    ad: p[map.ad] ?? null,
    placement: p[map.placement] ?? null,
  };
}

export function tally(sunday, tz, file, { exclude = [], formId = null, surveyId = null, utmMap = DEFAULT_UTM_MAP } = {}) {
  const w = week(sunday, tz);
  const ex = exclude.map(x => x.trim().toLowerCase()).filter(Boolean);
  const all = loadJson(file);
  const kept = [], excluded = [], outside = [];
  for (const s of all) {
    if (formId && s.formId && s.formId !== formId) continue;
    if (surveyId && s.surveyId && s.surveyId !== surveyId) continue;
    if (!inWeek(s.createdAt, w)) { outside.push(s.id); continue; }
    const who = `${s.name ?? ''} ${s.email ?? ''}`.toLowerCase();
    if (ex.some(x => who.includes(x))) { excluded.push({ id: s.id, name: s.name, email: s.email }); continue; }
    kept.push(s);
  }
  const byAd = {};
  const noUtm = [];
  const contactAd = {};
  for (const s of kept) {
    const u = utmOf(s, utmMap);
    const key = norm(u.adSet);
    if (!key) { noUtm.push({ id: s.id, contactId: s.contactId, name: s.name, createdAt: s.createdAt }); continue; }
    byAd[key] ??= { submissions: 0, contacts: new Set(), spellings: new Set(), campaigns: new Set(), ads: new Set(), placements: new Set() };
    byAd[key].submissions++;
    byAd[key].contacts.add(s.contactId);
    byAd[key].spellings.add(u.adSet);
    if (u.campaign) byAd[key].campaigns.add(u.campaign);
    if (u.ad) byAd[key].ads.add(u.ad);
    if (u.placement) byAd[key].placements.add(u.placement);
    contactAd[s.contactId] = key;
  }
  const ads = Object.fromEntries(Object.entries(byAd).map(([k, v]) => [k, {
    submissions: v.submissions,
    people: v.contacts.size,
    spellingsSeen: [...v.spellings],
    campaigns: [...v.campaigns],
    adNames: [...v.ads],
    placements: [...v.placements],
  }]));
  const contacts = [...new Set(kept.map(s => s.contactId))];
  return {
    week: w.label,
    totalSubmissions: kept.length,
    totalPeople: contacts.length,
    perAdSet: ads,
    noUtm,
    excludedTestRecords: excluded,
    contactIds: contacts,
    contactAdSet: contactAd,
    droppedOutsideWeek: outside.length,
    rawCount: all.length,
  };
}

// ---------- calls ----------

export function calls(sunday, tz, file, { now = new Date().toISOString() } = {}) {
  const w = week(sunday, tz);
  const nowMs = Date.parse(now);
  const evs = loadJson(file).filter(e => !e.deleted);
  const status = e => (e.appointmentStatus ?? e.appoinmentStatus ?? '').toLowerCase();
  // Booked = the booking was made this week (dateAdded). Attended = the call happened this week.
  const booked = evs.filter(e => inWeek(e.dateAdded, w) && status(e) !== 'cancelled' && status(e) !== 'invalid')
    .map(e => ({ id: e.id, contactId: e.contactId, title: e.title, dateAdded: e.dateAdded, startTime: e.startTime, status: status(e) }));
  const held = evs.filter(e => inWeek(e.startTime, w) && status(e) !== 'cancelled' && status(e) !== 'invalid');
  const attended = [], noShow = [], unmarked = [], upcoming = [];
  for (const e of held) {
    const row = { id: e.id, contactId: e.contactId, title: e.title, startTime: e.startTime, status: status(e) };
    if (status(e) === 'showed') attended.push(row);
    else if (status(e) === 'noshow') noShow.push(row);
    else if (Date.parse(e.startTime) > nowMs) upcoming.push(row);
    else unmarked.push(row); // past call still "confirmed": ask the member
  }
  return { week: w.label, booked, attended, noShow, unmarkedPastCalls: unmarked, notYetHeld: upcoming };
}

// ---------- self test ----------

function selftest() {
  const assert = (c, m) => { if (!c) { console.error('FAIL', m); process.exitCode = 1; } else console.log('ok  ', m); };
  // 2026-10-11 is a Sunday; Chicago is on CDT (UTC-5) that day.
  const w = week('2026-10-11', 'America/Chicago');
  assert(w.startUtc === '2026-10-11T05:00:00.000Z', `CDT week start ${w.startUtc}`);
  assert(w.endUtc === '2026-10-18T04:59:59.999Z', `CDT week end ${w.endUtc}`);
  assert(w.label === '10/11 - 10/17', `label ${w.label}`);
  assert(w.queryStartAt === '2026-10-10' && w.queryEndAt === '2026-10-18', 'widened query window');
  // Week containing the November DST change: starts CDT, ends CST.
  const d = week('2026-11-01', 'America/Chicago');
  assert(d.startUtc === '2026-11-01T05:00:00.000Z', `DST week start ${d.startUtc}`);
  assert(d.endUtc === '2026-11-08T05:59:59.999Z', `DST week end ${d.endUtc}`);
  const n = week('2026-10-11', 'America/Denver');
  assert(n.startUtc === '2026-10-11T06:00:00.000Z', `Denver start ${n.startUtc}`);
  let threw = false; try { week('2026-10-12', 'America/Chicago'); } catch { threw = true; }
  assert(threw, 'rejects a non-Sunday');
  assert(norm('Portable Income - Broad - FB+IG - 29AUG2026') === norm('Portable  income - Broad - FB IG - 29AUG2026'), 'plus and case normalize');
  assert(norm('Ad%202') === 'ad 2', 'percent-decoding');
  assert(week('2026-08-23', 'America/Chicago').label === '08/23 - 08/29', 'zero-padded label');
  assert(weeks('2026-08-23', '2026-10-11', 'America/Chicago').length === 8, 'eight backfill weeks');
}

// ---------- CLI ----------

function flag(args, name) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop());
if (isMain) {
  const [cmd, ...a] = process.argv.slice(2);
  const out = x => console.log(JSON.stringify(x, null, 2));
  try {
    switch (cmd) {
      case 'week': out(week(a[0], a[1])); break;
      case 'weeks': out(weeks(a[0], a[1], a[2])); break;
      case 'norm': out(norm(a[0])); break;
      case 'tally': out(tally(a[0], a[1], a[2], {
        exclude: (flag(a, '--exclude') ?? '').split(','),
        formId: flag(a, '--formId') ?? null,
        surveyId: flag(a, '--surveyId') ?? null,
        utmMap: flag(a, '--utmMap') ? { ...DEFAULT_UTM_MAP, ...JSON.parse(flag(a, '--utmMap')) } : DEFAULT_UTM_MAP,
      })); break;
      case 'calls': out(calls(a[0], a[1], a[2], { now: flag(a, '--now') })); break;
      case 'selftest': selftest(); break;
      default:
        console.error('Commands: week, weeks, norm, tally, calls, selftest. See the header of this file.');
        process.exitCode = 2;
    }
  } catch (e) {
    console.error(`Error: ${e.message}`);
    process.exitCode = 1;
  }
}
