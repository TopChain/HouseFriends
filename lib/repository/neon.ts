import type { HouseFriendsRepository } from './types';
import type { DraftExperience, Experience, Provider, SafeAnchor, TrustRelationship } from '@/types/domain';
import { config } from '@/lib/config';
import { neon } from '@/lib/neon';

export const neonRepository: HouseFriendsRepository = {
  async listAnchors() {
    const { data, error } = await neon.from('safe_anchor_public').select('*').limit(5);
    if (error) throw error;
    return (data ?? []) as unknown as SafeAnchor[];
  },
  async searchExperiences(filters) {
    let query = neon.from('experience_cards').select('*').eq('status', 'published').limit(50);
    if (filters.categoryId) query = query.eq('categoryId', filters.categoryId);
    if (filters.serviceAreaId) query = query.eq('serviceAreaId', filters.serviceAreaId);
    if (filters.query) query = query.textSearch('search_document', filters.query, { type: 'websearch' });
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as unknown as Experience[];
  },
  async listProviders(filters) {
    const { data, error } = await neon.rpc('search_provider_cards', {
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
    const { data, error } = await neon.from('experience_cards').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data as unknown as Experience | null;
  },
  async getProvider(id) {
    const { data, error } = await neon.from('provider_cards').select('*').eq('id', id).limit(1).maybeSingle();
    if (error) throw error;
    return data as unknown as Provider | null;
  },
  async publishExperience(draft) {
    const mediaPaths = await uploadPendingMedia(draft);
    const payload = { ...draft, mediaUrls: [], mediaPaths };
    const { data, error } = await neon.rpc('publish_experience', { p_payload: payload });
    if (error) {
      if (mediaPaths.length) await removePendingMedia(mediaPaths);
      throw error;
    }
    return data as unknown as Experience;
  },
  async saveExperience(userId, experienceId) {
    const { error } = await neon.from('saved_experiences').upsert({ user_id: userId, experience_id: experienceId });
    if (error) throw error;
  },
  async listSaved(userId) {
    const { data, error } = await neon.from('saved_experience_cards').select('*').eq('user_id', userId);
    if (error) throw error;
    return (data ?? []) as unknown as Experience[];
  },
  async markHelpful(_userId, experienceId) {
    const { data, error } = await neon.rpc('mark_recommendation_helpful', { p_experience_id: experienceId });
    if (error) throw error;
    return data as unknown as TrustRelationship;
  },
  async confirmReferral(_userId, experienceId) {
    const { data, error } = await neon.rpc('confirm_verified_referral', { p_experience_id: experienceId });
    if (error) throw error;
    return data as unknown as TrustRelationship;
  },
  async reportContent(userId, targetType, targetId, reason, details) {
    const { error } = await neon.from('reports').insert({ reporter_user_id: userId, target_type: targetType, target_id: targetId, reason, details });
    if (error) throw error;
  },
  async blockUser(userId, blockedUserId) {
    const { error } = await neon.from('provider_blocks').insert({ user_id: userId, provider_id: blockedUserId });
    if (error) throw error;
  },
};

async function uploadPendingMedia(draft: DraftExperience): Promise<string[]> {
  if (!draft.mediaUrls.length) return [];
  if (!config.mediaApiUrl) throw new Error('The production media service is not configured.');
  const { data } = await neon.auth.getSession();
  const token = data.session?.access_token;
  if (!token || !data.session?.user) throw new Error('Authentication required for media upload.');
  const uploaded: string[] = [];
  try {
    for (const uri of draft.mediaUrls) {
      const blob = await fetch(uri).then((response) => response.blob());
      const ticketResponse = await fetch(`${config.mediaApiUrl.replace(/\/$/, '')}/uploads`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType: 'image/jpeg', contentLength: blob.size }),
      });
      if (!ticketResponse.ok) throw new Error(`Media upload authorization failed (${ticketResponse.status}).`);
      const ticket = await ticketResponse.json() as { path?: string; uploadUrl?: string; headers?: Record<string, string> };
      if (!ticket.path || !ticket.uploadUrl) throw new Error('The media service returned an incomplete upload ticket.');
      const uploadResponse = await fetch(ticket.uploadUrl, { method: 'PUT', headers: ticket.headers, body: blob });
      if (!uploadResponse.ok) throw new Error(`Media upload failed (${uploadResponse.status}).`);
      uploaded.push(ticket.path);
    }
    return uploaded;
  } catch (error) {
    if (uploaded.length) await removePendingMedia(uploaded);
    throw error;
  }
}

async function removePendingMedia(paths: string[]): Promise<void> {
  if (!paths.length || !config.mediaApiUrl) return;
  const { data } = await neon.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return;
  await fetch(`${config.mediaApiUrl.replace(/\/$/, '')}/uploads`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ paths }),
  });
}
