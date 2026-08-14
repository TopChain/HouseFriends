import { assertProductionConfiguration, config } from '@/lib/config';
import { demoRepository } from './demo';
import { supabaseRepository } from './supabase';

if (config.mode === 'production') assertProductionConfiguration();

export const repository = config.mode === 'production' ? supabaseRepository : demoRepository;
export type { HouseFriendsRepository } from './types';
