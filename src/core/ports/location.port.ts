import type { LocationReading } from '../types/geo.types';

/** Device GPS. Never throws: a failed reading is a value, so check-in/out never block. */
export interface ILocationPort {
  getCurrentPosition(): Promise<LocationReading>;
}
