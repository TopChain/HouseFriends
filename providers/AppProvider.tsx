import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { demoProfiles } from '@/data/demo';
import { config } from '@/lib/config';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { AppRole, PublicProfile } from '@/types/domain';

type AppContextValue = {
  session: Session | null;
  profile: PublicProfile | null;
  role: AppRole;
  loading: boolean;
  language: 'en' | 'zh-Hant';
  setLanguage(language: 'en' | 'zh-Hant'): void;
  setDemoRole(role: AppRole): void;
  refreshProfile(): Promise<void>;
  signOut(): Promise<void>;
};

const AppContext = createContext<AppContextValue | null>(null);

const demoRoleProfile: Record<AppRole, keyof typeof demoProfiles> = {
  sharer: 'sharer',
  searcher: 'searcher',
  individual_provider: 'provider',
  company_provider: 'company',
  admin: 'admin',
};

export function AppProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole>('searcher');
  const [profile, setProfile] = useState<PublicProfile | null>(config.enableDemoMode ? demoProfiles.searcher! : null);
  const [loading, setLoading] = useState(isSupabaseConfigured && config.mode === 'production');
  const [language, setLanguage] = useState<'en' | 'zh-Hant'>('en');

  const refreshProfile = useCallback(async () => {
    if (!session) return;
    const [{ data: publicProfile, error: profileError }, { data: roleRows, error: rolesError }] = await Promise.all([
      supabase.from('public_profiles').select('id, alias, hf_id').eq('id', session.user.id).maybeSingle(),
      supabase.from('user_roles').select('role').eq('user_id', session.user.id),
    ]);
    if (profileError) throw profileError;
    if (rolesError) throw rolesError;
    if (publicProfile) {
      setProfile({
        id: publicProfile.id,
        alias: publicProfile.alias ?? '',
        hfId: publicProfile.hf_id,
        trustRelationships: 0,
        verifiedReferrals: 0,
      });
    } else setProfile(null);
    const nextRole = roleRows?.[0]?.role as AppRole | undefined;
    if (nextRole) setRole(nextRole);
  }, [session]);

  useEffect(() => {
    if (!isSupabaseConfigured || config.mode !== 'production') return;
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (session) void Promise.resolve().then(refreshProfile);
  }, [session, refreshProfile]);

  const value = useMemo<AppContextValue>(() => ({
    session,
    profile,
    role,
    loading,
    language,
    setLanguage,
    setDemoRole(nextRole) {
      if (!config.enableDemoMode) return;
      setRole(nextRole);
      setProfile(demoProfiles[demoRoleProfile[nextRole]]!);
    },
    refreshProfile,
    async signOut() {
      if (session) await supabase.auth.signOut({ scope: 'local' });
      setSession(null);
      if (config.enableDemoMode) {
        setRole('searcher');
        setProfile(demoProfiles.searcher!);
      } else setProfile(null);
    },
  }), [language, loading, profile, refreshProfile, role, session]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp must be used inside AppProvider.');
  return value;
}
