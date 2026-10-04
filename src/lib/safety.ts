/**
 * Content safety.
 *
 * Every image on this site comes from the Openverse API, an open index that
 * also contains material a discovery feed should never surface. Safety is
 * applied in four layers, all always on (there is no UI toggle to weaken it):
 *
 *  1. Request level – `unstable__include_sensitive_results=false` is sent on
 *     every request (see lib/openverse.ts). `mature` is deliberately NOT sent:
 *     the API answers 400 when both parameters are defined.
 *  2. Query level   – user-typed queries are screened before they are sent, so
 *     a request for explicit or horror material is never issued.
 *  3. Result level  – every returned record is screened on `mature`,
 *     `unstable__sensitivity`, title, creator and tags.
 *  4. Source level  – records without a usable image URL are dropped.
 */

export type SafetyCategory = 'explicit' | 'horror' | 'violence' | 'drugs' | 'flagged';

const EXPLICIT = [
  'nsfw', 'nude', 'nudity', 'nudes', 'naked', 'topless', 'bottomless', 'undressed',
  'unclothed', 'sex', 'sexy', 'sexual', 'erotic', 'erotica', 'porn', 'porno',
  'pornstar', 'xxx', 'bdsm', 'fetish', 'kink', 'lingerie', 'thong', 'panties',
  'busty', 'boobs', 'boob', 'breasts', 'nipples', 'nipple', 'genitals', 'genital',
  'penis', 'vagina', 'buttocks', 'hentai', 'ecchi', 'pinup', 'burlesque', 'stripper',
  'orgasm', 'masturbation', 'incest', 'bestiality', 'rape', 'raping', 'playboy',
  'onlyfans', 'xrated',
] as const;

const HORROR = [
  'gore', 'gory', 'blood', 'bloody', 'bloodshed', 'bloodbath', 'corpse', 'corpses',
  'cadaver', 'autopsy', 'morgue', 'mortuary', 'zombie', 'zombies', 'undead', 'ghoul',
  'ghouls', 'demon', 'demons', 'demonic', 'satan', 'satanic', 'devil', 'devils',
  'horror', 'terrifying', 'creepy', 'creepypasta', 'slasher', 'haunted', 'ghost',
  'ghosts', 'specter', 'spectre', 'poltergeist', 'occult', 'pentagram', 'witchcraft',
  'monster', 'monsters', 'scary', 'nightmare', 'nightmares', 'grave', 'graves',
  'gravestone', 'tomb', 'tombs', 'coffin', 'coffins', 'crypt', 'cemetery', 'graveyard',
  'skull', 'skulls', 'skeleton', 'skeletons', 'bones', 'mutilation', 'dismemberment',
  'decapitation', 'cannibal', 'cannibalism', 'guts', 'intestines', 'amputation',
] as const;

const VIOLENCE = [
  'gun', 'guns', 'firearm', 'firearms', 'rifle', 'rifles', 'pistol', 'pistols',
  'revolver', 'shotgun', 'handgun', 'ammunition', 'bullet', 'bullets', 'weapon',
  'weapons', 'machete', 'grenade', 'murder', 'murderer', 'homicide', 'killer',
  'killers', 'torture', 'suicide', 'selfharm', 'wounds', 'injury', 'injuries',
] as const;

const DRUGS = [
  'heroin', 'cocaine', 'meth', 'methamphetamine', 'opium', 'lsd', 'crackpipe',
  'drugs', 'drug', 'overdose',
] as const;

const BLOCKED_WORDS: ReadonlyMap<string, SafetyCategory> = new Map([
  ...EXPLICIT.map((word) => [word, 'explicit'] as const),
  ...HORROR.map((word) => [word, 'horror'] as const),
  ...VIOLENCE.map((word) => [word, 'violence'] as const),
  ...DRUGS.map((word) => [word, 'drugs'] as const),
]);

/** Prefix matches, for inflected forms (`mutilated`, `torturing`, …). */
const BLOCKED_STEMS: readonly (readonly [string, SafetyCategory])[] = [
  ['mutilat', 'horror'],
  ['dismember', 'horror'],
  ['decapitat', 'horror'],
  ['eviscerat', 'horror'],
  ['tortur', 'violence'],
  ['pornograph', 'explicit'],
  ['necroph', 'horror'],
];

/** Substring matches, for compound tokens (`nsfw_art`, `blood_splatter`, …). */
const BLOCKED_SUBSTRINGS: readonly (readonly [string, SafetyCategory])[] = [
  ['nsfw', 'explicit'],
  ['nude', 'explicit'],
  ['erotic', 'explicit'],
  ['gore', 'horror'],
  ['zombie', 'horror'],
  ['chainsaw', 'violence'],
  ['splatter', 'horror'],
];

export interface SafetyVerdict {
  safe: boolean;
  /** The term that caused the rejection, when rejected. */
  term?: string;
  category?: SafetyCategory;
}

const SAFE: SafetyVerdict = Object.freeze({ safe: true });

/** Lower-case and collapse everything that is not a letter or digit. */
export function normalizeText(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function reject(term: string, category: SafetyCategory): SafetyVerdict {
  return { safe: false, term, category };
}

/** Screen any free text (query, title, tag list, creator name). */
export function findBlockedTerm(input: string): SafetyVerdict {
  if (!input) return SAFE;
  const normalized = normalizeText(input);
  if (!normalized) return SAFE;

  for (const [needle, category] of BLOCKED_SUBSTRINGS) {
    if (normalized.includes(needle)) return reject(needle, category);
  }
  for (const token of normalized.split(' ')) {
    if (!token) continue;
    const exact = BLOCKED_WORDS.get(token);
    if (exact) return reject(token, exact);
    for (const [stem, category] of BLOCKED_STEMS) {
      if (token.startsWith(stem)) return reject(token, category);
    }
  }
  return SAFE;
}

export interface QueryScreening {
  ok: boolean;
  /** Trimmed, length-capped query that is safe to send. */
  query: string;
  reason?: string;
}

/**
 * Screen a user-typed query before it is ever sent to the API.
 * The API caps `q` at 200 characters.
 */
export function screenQuery(raw: string): QueryScreening {
  const query = raw.trim().replace(/\s+/g, ' ').slice(0, 200);
  if (!query) return { ok: false, query: '', reason: 'Type something to search for.' };
  const verdict = findBlockedTerm(query);
  if (!verdict.safe) {
    return {
      ok: false,
      query,
      reason: `This feed is filtered to exclude explicit and horror content, so searches for “${verdict.term}” are not run.`,
    };
  }
  return { ok: true, query };
}

/** The fields the result-level screen reads from an API record. */
export interface Screenable {
  mature?: boolean | null;
  unstable__sensitivity?: string[] | null;
  title?: string | null;
  creator?: string | null;
  tags?: { name?: string | null }[] | null;
}

/** Screen a single API record. Layer 3 of the safety stack. */
export function screenResult(result: Screenable): SafetyVerdict {
  if (result.mature === true) return reject('mature', 'explicit');
  const sensitivity = result.unstable__sensitivity ?? [];
  if (sensitivity.length > 0) {
    // Openverse flags `sensitive_text`, `shared_vision`, `blur`, `user_report`, …
    // Anything flagged at all is dropped: this feed is safe-only.
    return reject(sensitivity.join(','), 'flagged');
  }
  const haystack = [result.title ?? '', result.creator ?? '']
    .concat((result.tags ?? []).map((tag) => tag.name ?? ''))
    .join(' ');
  return findBlockedTerm(haystack);
}

export const SAFETY_LABEL =
  'Safe results only — Openverse sensitive-content filtering plus a local explicit- and horror-content blocklist.';
