import type { HouseFriendsRepository } from './types';
import type { DraftExperience, Experience, Provider, SafeAnchor, TrustRelationship } from '@/types/domain';
import { supabase } from '@/lib/supabase';

export const supabaseRepository: HouseFriendsRepository = {
  async listAnchors() {
    const { data, error } = await supabase.from('safe_anchor_public').select('*').limit(5);
    if (error) throw error;
    return (data ?? []) as unknown as SafeAnchor[];
  },
  async searchExperiences(filters) {
    let query = supabase.from('experience_cards').select('*').eq('status', 'published').limit(50);
    if (filters.categoryId) query = query.eq('categoryId', filters.categoryId);
    if (filters.serviceAreaId) query = query.eq('serviceAreaId', filters.serviceAreaId);
    if (filters.query) query = query.textSearch('search_document', filters.query, { type: 'websearch' });
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as unknown as Experience[];
  },
  async listProviders(filters) {
    const { data, error } = await supabase.rpc('search_provider_cards', {
      p_service_area_id: filters.serviceAreaId ?? null,
      p_category_id: filters.categoryId ?? null,
      p_query: filters.query ?? null,
    });
    if (error) throw error;
    return (data ?? []).map((row: Record<string, unknown>) => ({
      id: String(row.provider_id), kind: row.provider_kind as Provider['kind'], publicName: String(row.public_name),
      alias: row.alias as string | undefined, hfId: row.hf_id as string | undefined, tradeName: row.trade_name as string | undefined,
      branchId: row.branch_id as string | undefined, branchName: row.branch_name as string | undefined, categoryIds: (row.category_ids as string[] | null) ?? [], serviceAreaIds: (row.service_area_ids as string[] | null) ?? [],
      listingSource: row.listing_source as Provider['listingSource'], placement: row.placement as Provider['placement'], rating: Number(row.rating ?? 0),
      ratingCount: Number(row.rating_count ?? 0), verified: Boolean(row.verified), phone: row.phone as string | undefined,
    }));
  },
  async getExperience(id) {
    const { data, error } = await supabase.from('experience_cards').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data as unknown as Experience | null;
  },
  async getProvider(id) {
    const { data, error } = await supabase.from('provider_cards').select('*').eq('id', id).limit(1).maybeSingle();
    if (error) throw error;
    return data as unknown as Provider | null;
  },
  async publishExperience(draft) {
    const mediaPaths = await uploadPendingMedia(draft);
    const payload = { ...draft, mediaUrls: [], mediaPaths };
    const { data, error } = await supabase.rpc('publish_experience', { p_payload: payload });
    if (error) {
      if (mediaPaths.length) await supabase.storage.from('experience-media-pending').remove(mediaPaths);
      throw error;
    }
    return data as unknown as Experience;
  },
  async saveExperience(userId, experienceId) {
    const { error } = await supabase.from('saved_experiences').upsert({ user_id: userId, experience_id: experienceId });
    if (error) throw error;
  },
  async listSaved(userId) {
    const { data, error } = await supabase.from('saved_experience_cards').select('*').eq('user_id', userId);
    if (error) throw error;
    return (data ?? []) as unknown as Experience[];
  },
  async markHelpful(_userId, experienceId) {
    const { data, error } = await supabase.rpc('mark_recommendation_helpful', { p_experience_id: experienceId });
    if (error) throw error;
    return data as unknown as TrustRelationship;
  },
  async confirmReferral(_userId, experienceId) {
    const { data, error } = await supabase.rpc('confirm_verified_referral', { p_experience_id: experienceId });
    if (error) throw error;
    return data as unknown as TrustRelationship;
  },
  async reportContent(_userId, targetType, targetId, reason, details) {
    const { error } = await supabase.from('reports').insert({ target_type: targetType, target_id: targetId, reason, details });
    if (error) throw error;
  },
  async blockUser(userId, blockedUserId) {
    const { error } = await supabase.from('provider_blocks').insert({ user_id: userId, provider_id: blockedUserId });
    if (error) throw error;
  },
};

async function uploadPendingMedia(draft: DraftExperience): Promise<string[]> {
  if (!draft.mediaUrls.length) return [];
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error('Authentication required for media upload.');
  const uploaded: string[] = [];
  try {
    for (const uri of draft.mediaUrls) {
      const blob = await fetch(uri).then((response) => response.blob());
      const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
      const path = `${data.user.id}/${uniqueName}.jpg`;
      const { error } = await supabase.storage.from('experience-media-pending').upload(path, blob, { contentType: 'image/jpeg', upsert: false });
      if (error) throw error;
      uploaded.push(path);
    }
    return uploaded;
  } catch (error) {
    if (uploaded.length) await supabase.storage.from('experience-media-pending').remove(uploaded);
    throw error;
  }
}
