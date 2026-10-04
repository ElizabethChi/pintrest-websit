import type { Pin } from '../lib/types';

/**
 * A handful of real Openverse records bundled with the app.
 *
 * These are used as the first fallback layer when a live search fails or is
 * rate limited (before the locally generated artwork). They are genuine API
 * records — id, creator, license and source page are exactly what the API
 * returned — so attribution stays correct even offline.
 *
 * All three were retrieved with `unstable__include_sensitive_results=false`
 * and passed the same safety screen the live results go through.
 * `width`/`height` are 0 where the API returned null, in which case the
 * masonry falls back to a 3:4 estimate.
 */
export const BUNDLED_PINS: Pin[] = [
  {
    id: 'e365516f-a228-4f96-a78c-9dc1641a9527',
    title: 'Teenager with blank white shirt',
    imageUrl: 'https://api.openverse.org/v1/images/e365516f-a228-4f96-a78c-9dc1641a9527/thumb/',
    originalUrl: 'https://live.staticflickr.com/65535/52064464165_474aa8614b_b.jpg',
    thumbnailUrl: 'https://api.openverse.org/v1/images/e365516f-a228-4f96-a78c-9dc1641a9527/thumb/',
    width: 809,
    height: 1024,
    creator: 'Josh Matthew',
    creatorUrl: 'https://www.flickr.com/photos/195587980@N04',
    sourceUrl: 'https://www.flickr.com/photos/195587980@N04/52064464165',
    license: 'pdm',
    licenseVersion: '1.0',
    licenseUrl: 'https://creativecommons.org/publicdomain/mark/1.0/',
    provider: 'flickr',
    category: 'photograph',
    attribution:
      '"Teenager with blank white shirt" by Josh Matthew is marked with Public Domain Mark 1.0. To view the terms, visit https://creativecommons.org/publicdomain/mark/1.0/.',
  },
  {
    id: '6f80c6fd-5708-4e47-9a7b-719c9fc0ba7a',
    title: "'Big Ears' and smart shoes.",
    imageUrl: 'https://api.openverse.org/v1/images/6f80c6fd-5708-4e47-9a7b-719c9fc0ba7a/thumb/',
    originalUrl: 'https://live.staticflickr.com/65535/51711865405_002e2ce99e_b.jpg',
    thumbnailUrl: 'https://api.openverse.org/v1/images/6f80c6fd-5708-4e47-9a7b-719c9fc0ba7a/thumb/',
    width: 0,
    height: 0,
    creator: 'Neil. Moralee',
    creatorUrl: 'https://www.flickr.com/photos/62586117@N05',
    sourceUrl: 'https://www.flickr.com/photos/62586117@N05/51711865405',
    license: 'by-nc-nd',
    licenseVersion: '2.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-nc-nd/2.0/',
    provider: 'flickr',
    category: 'photograph',
    attribution:
      '"Big Ears and smart shoes." by Neil. Moralee is licensed under CC BY-NC-ND 2.0. To view a copy of this license, visit https://creativecommons.org/licenses/by-nc-nd/2.0/.',
    badge: '3/9',
  },
  {
    id: '0b7e70bd-53dd-4b14-8a25-b2e3d25cd977',
    title: 'Me',
    imageUrl: 'https://api.openverse.org/v1/images/0b7e70bd-53dd-4b14-8a25-b2e3d25cd977/thumb/',
    originalUrl: 'https://live.staticflickr.com/65535/52579822407_5be22258a9_b.jpg',
    thumbnailUrl: 'https://api.openverse.org/v1/images/0b7e70bd-53dd-4b14-8a25-b2e3d25cd977/thumb/',
    width: 0,
    height: 0,
    creator: '#Sacho#',
    creatorUrl: 'https://www.flickr.com/photos/189108616@N08',
    sourceUrl: 'https://www.flickr.com/photos/189108616@N08/52579822407',
    license: 'by-nc-sa',
    licenseVersion: '2.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-nc-sa/2.0/',
    provider: 'flickr',
    category: 'photograph',
    attribution:
      '"Me" by #Sacho# is licensed under CC BY-NC-SA 2.0. To view a copy of this license, visit https://creativecommons.org/licenses/by-nc-sa/2.0/.',
  },
];

/** Portrait used for the account avatar, with an initials fallback on error. */
export const AVATAR_PIN = BUNDLED_PINS[0];
