import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Assignment, Profile, ProgressStatus } from '../types/database';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

// ---------------------------------------------------------------------------
// User: own assignments list + submission update
// ---------------------------------------------------------------------------

export function useUserAssignments() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['assignments', user?.id],
    queryFn: async (): Promise<Assignment[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('assignments')
        .select('*, challenge:challenges(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Assignment[];
    },
    enabled: Boolean(user),
  });

  const updateSubmission = useMutation({
    mutationFn: async ({
      assignmentId,
      progress_status,
      linkedin_url,
      github_url,
    }: {
      assignmentId: string;
      progress_status: ProgressStatus;
      linkedin_url?: string;
      github_url?: string;
    }) => {
      const completed_at = progress_status === 'complete' ? new Date().toISOString() : null;

      const { data, error } = await supabase
        .from('assignments')
        .update({
          progress_status,
          linkedin_url,
          github_url,
          completed_at,
          updated_at: new Date().toISOString(),
        })
        .eq('id', assignmentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
      queryClient.invalidateQueries({ queryKey: ['assignment-detail', variables.assignmentId] });
    },
    onError: (error) => {
      console.error('Failed to update submission:', error);
    },
  });

  return {
    assignments: query.data || [],
    isLoading: query.isLoading,
    updateSubmission,
  };
}

// ---------------------------------------------------------------------------
// User: single assignment detail
// ---------------------------------------------------------------------------

export function useAssignmentDetail(assignmentId: string) {
  return useQuery({
    queryKey: ['assignment-detail', assignmentId],
    queryFn: async (): Promise<Assignment | null> => {
      const { data, error } = await supabase
        .from('assignments')
        .select('*, challenge:challenges(*)')
        .eq('id', assignmentId)
        .single();

      if (error) throw error;
      return data as Assignment;
    },
    enabled: Boolean(assignmentId),
  });
}

// ---------------------------------------------------------------------------
// Admin: per-user assignment detail (CODE-01 fix — standalone top-level hook)
// ---------------------------------------------------------------------------

export function useUserAssignmentDetail(userId: string | null) {
  return useQuery({
    queryKey: ['admin-user-assignments', userId],
    queryFn: async (): Promise<Assignment[]> => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('assignments')
        .select('*, challenge:challenges(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Assignment[];
    },
    enabled: Boolean(userId),
  });
}

// ---------------------------------------------------------------------------
// Admin: Manage Cohorts
// ---------------------------------------------------------------------------

export function useAdminCohorts() {
  const queryClient = useQueryClient();

  const membersQuery = useQuery({
    queryKey: ['cohort-members'],
    queryFn: async (): Promise<Profile[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'user')
        .eq('account_status', 'active')
        .not('cohort_id', 'is', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Profile[];
    },
  });

  const removeFromCohort = useMutation({
    mutationFn: async (userId: string) => {
      if (!userId) throw new Error('User ID is required to remove from cohort.');

      // Attempt hard delete first with .select() to verify affected rows
      const { data: deleteData, error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)
        .select();

      const isDeleteBlocked = deleteError || !deleteData || deleteData.length === 0;

      // Catch any constraint, permission error, or 0 rows affected and fall back to soft-delete
      if (isDeleteBlocked) {
        console.warn(
          'Hard delete blocked by FK constraint or security policies. Falling back to soft delete.',
          deleteError || '0 rows affected'
        );

        const { data: updateData, error: updateError } = await supabase
          .from('profiles')
          .update({ account_status: 'inactive', cohort_id: null, updated_at: new Date().toISOString() })
          .eq('id', userId)
          .select();

        if (updateError) {
          throw new Error(updateError.message || 'Failed to remove user completely.');
        }

        if (!updateData || updateData.length === 0) {
          throw new Error('Action blocked by database security policies (0 rows affected).');
        }
      }
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['cohort-members'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-cohort-members'] }),
        queryClient.invalidateQueries({ queryKey: ['metrics'] }),
      ]);
    },
  });

  return {
    members: membersQuery.data || [],
    isLoading: membersQuery.isLoading,
    removeFromCohort,
  };
}

// ---------------------------------------------------------------------------
// Admin: Review Submissions
// ---------------------------------------------------------------------------

export function useAdminReviews() {
  const queryClient = useQueryClient();

  const reviewsQuery = useQuery({
    queryKey: ['admin-pending-reviews'],
    queryFn: async (): Promise<Assignment[]> => {
      const { data, error } = await supabase
        .from('assignments')
        .select('*, challenge:challenges(*), user:profiles(*)')
        .eq('progress_status', 'complete')
        .eq('is_verified', false)
        .order('completed_at', { ascending: true });
      if (error) throw error;
      return data as Assignment[];
    },
  });

  const submitReview = useMutation({
    mutationFn: async ({
      assignmentId,
      action,
      mentorFeedback,
      adminId,
    }: {
      assignmentId: string;
      action: 'approve' | 'request_changes';
      mentorFeedback: string;
      adminId: string;
    }) => {
      const now = new Date().toISOString();
      const payload =
        action === 'approve'
          ? {
              is_verified: true,
              verified_by: adminId,
              verified_at: now,
              review_status: 'approved',
              mentor_feedback: mentorFeedback || null,
              updated_at: now,
            }
          : {
              review_status: 'changes_requested',
              progress_status: 'ongoing',
              mentor_feedback: mentorFeedback || null,
              completed_at: null,
              updated_at: now,
            };

      const { error } = await supabase
        .from('assignments')
        .update(payload)
        .eq('id', assignmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
    },
  });

  return {
    reviews: reviewsQuery.data || [],
    isLoading: reviewsQuery.isLoading,
    submitReview,
  };
}
