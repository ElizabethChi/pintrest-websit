/**
 * Topic bar. Labels and capitalisation match the reference exactly.
 *
 * Every topic maps to a handful of *short* Openverse queries. Long natural
 * language queries return nothing on Openverse (verified:
 * `q=teal luxury sports car photography` → `result_count: 0`), so topics are
 * expressed as 1–3 word searches that are then merged and deduped.
 */
export interface Topic {
  label: string;
  queries: string[];
  /** Optional Openverse category filter. */
  category?: string;
}

export const TOPICS: Topic[] = [
  { label: 'All', queries: ['portrait', 'illustration', 'streetwear', 'poster art', 'photography'] },
  { label: 'wallpaper', queries: ['wallpaper', 'background texture'] },
  { label: 'Love', queries: ['love', 'hearts'] },
  { label: 'Blue', queries: ['blue', 'blue abstract'] },
  { label: 'Blue wallpapers', queries: ['blue wallpaper', 'blue sky'] },
  { label: 'Photography techniques', queries: ['photography', 'long exposure'], category: 'photograph' },
  { label: 'Film photography tips', queries: ['film photography', '35mm film'], category: 'photograph' },
  { label: 'Black men street fashion', queries: ['street fashion', 'men fashion'], category: 'photograph' },
  { label: 'Patterns design', queries: ['pattern design', 'textile pattern'], category: 'illustration' },
  { label: 'Patterns', queries: ['pattern', 'geometric pattern'] },
  { label: 'Ankara dress styles', queries: ['ankara', 'african dress'] },
  { label: 'Diy crafts for gifts', queries: ['diy craft', 'handmade gift'] },
  { label: 'Deep questions to ask', queries: ['quotes', 'typography'] },
];

/** The topic shown on first load. */
export const DEFAULT_TOPIC = TOPICS[0].label;

export function findTopic(label: string): Topic | undefined {
  return TOPICS.find((topic) => topic.label === label);
}
