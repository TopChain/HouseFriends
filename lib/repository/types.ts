import type { DraftExperience, Experience, Provider, ReportReason, SafeAnchor, SearchFilters, TrustRelationship } from '@/types/domain';

export interface HouseFriendsRepository {
  listAnchors(): Promise<SafeAnchor[]>;
  searchExperiences(filters: SearchFilters): Promise<Experience[]>;
  listProviders(filters: SearchFilters): Promise<Provider[]>;
  getExperience(id: string): Promise<Experience | null>;
  getProvider(id: string): Promise<Provider | null>;
  publishExperience(draft: DraftExperience): Promise<Experience>;
  saveExperience(userId: string, experienceId: string): Promise<void>;
  listSaved(userId: string): Promise<Experience[]>;
  markHelpful(userId: string, experienceId: string): Promise<TrustRelationship>;
  confirmReferral(userId: string, experienceId: string): Promise<TrustRelationship>;
  reportContent(userId: string, targetType: string, targetId: string, reason: ReportReason, details: string): Promise<void>;
  blockUser(userId: string, blockedUserId: string): Promise<void>;
}
