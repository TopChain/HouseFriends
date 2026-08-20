import { assertProductionConfiguration, config } from '@/lib/config';
import { demoRepository } from './demo';
import { neonRepository } from './neon';

if (config.mode === 'production') assertProductionConfiguration();

export const repository = config.mode === 'production' ? neonRepository : demoRepository;
export type { HouseFriendsRepository } from './types';
