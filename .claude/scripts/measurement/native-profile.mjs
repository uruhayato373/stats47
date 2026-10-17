import { lstatSync } from 'node:fs';
import { join } from 'node:path';

/** An open native Chrome may hold new authentication cookies only in memory. */
export function assertClosedNativeProfile(profile) {
  try { lstatSync(join(profile, 'SingletonLock')); }
  catch (error) { if (error.code === 'ENOENT') return; throw error; }
  throw new Error('native_profile_open: close the dedicated Chrome before export; login cookies may not have been saved. A stale SingletonLock also requires checking that Chrome has exited.');
}
