export type AppRole = 'admin' | 'user';
export type AccountStatus = 'active' | 'inactive';
export type ProgressStatus = 'incomplete' | 'ongoing' | 'complete';
export type ReviewStatus = 'pending' | 'changes_requested' | 'approved';
export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Hardcore';

export interface Cohort {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_id?: string;
  role: AppRole;
  account_status: AccountStatus;
  display_name: string;
  avatar_url?: string;
  cohort_id?: string;
  // Student-specific fields
  bio?: string;
  github_username?: string;
  linkedin_url?: string;
  institution?: string; // University or Company
  created_at: string;
  updated_at: string;
  // Joined relations
  cohort?: Cohort;
}

export interface Challenge {
  id: string;
  title: string;
  description: string; // Markdown supported
  resource_url?: string;
  difficulty_level: DifficultyLevel;
  is_archived: boolean;
  is_coding_challenge: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // Joined fields for view display
  creator?: Profile;
  assigned_count?: number;
  completed_count?: number;
}

export interface Assignment {
  id: string;
  challenge_id: string;
  user_id: string;
  progress_status: ProgressStatus;
  review_status: ReviewStatus;
  mentor_feedback?: string;
  linkedin_url?: string;
  github_url?: string;
  completed_at?: string;
  submitted_code?: string;
  ai_feedback?: string;
  ai_score?: number;
  is_verified: boolean;
  verified_by?: string;
  verified_at?: string;
  created_at: string;
  updated_at: string;
  // Joined relations
  challenge?: Challenge;
  user?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  message: string;
  type: 'system' | 'video_call' | string; // extensible
  action_url?: string;
  is_read: boolean;
  created_at: string;
}

export interface CohortMetrics {
  totalUsers: number;
  activeUsers: number;
  totalChallenges: number;
  activeChallenges: number;
  completedAssignments: number;
  totalAssignments: number;
  completionRatePercentage: number;
}
