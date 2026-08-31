import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Challenge, CohortMetrics } from '../types/database';
import { supabase } from '../lib/supabase';

export function useChallenges(includeArchived = false) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['challenges', includeArchived],
    queryFn: async () => {
      let q = supabase.from('challenges').select('*').order('created_at', { ascending: false });
      if (!includeArchived) {
        q = q.eq('is_archived', false);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data as Challenge[];
    },
  });

  const createChallenge = useMutation({
    mutationFn: async ({
      title,
      description,
      resource_url,
      difficulty_level,
      is_coding_challenge,
      assigneeIds,
    }: {
      title: string;
      description: string;
      resource_url?: string;
      difficulty_level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Hardcore';
      is_coding_challenge?: boolean;
      assigneeIds: string[];
    }) => {
      const { data: inserted, error } = await supabase
        .from('challenges')
        .insert({
          title,
          description,
          resource_url,
          difficulty_level,
          is_coding_challenge: is_coding_challenge ?? false,
        })
        .select()
        .single();

      if (error) throw error;

      if (assigneeIds.length > 0 && inserted) {
        await supabase.rpc('assign_challenge_users', {
          p_challenge_id: inserted.id,
          p_user_ids: assigneeIds,
        });
      }
      return inserted;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const toggleArchive = useMutation({
    mutationFn: async ({ id, is_archived }: { id: string; is_archived: boolean }) => {
      const { error } = await supabase
        .from('challenges')
        .update({ is_archived: !is_archived })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
    },
  });

  return {
    challenges: query.data || [],
    isLoading: query.isLoading,
    createChallenge,
    toggleArchive,
  };
}

export function useCohortMetrics() {
  return useQuery({
    queryKey: ['metrics'],
    queryFn: async (): Promise<CohortMetrics> => {
      const [
        { count: totalUserCount, error: totalUserErr },
        { count: activeUserCount, error: activeUserErr },
        { count: challengeCount, error: chalErr },
        { count: totalAsgns, error: totalAsgnErr },
        { count: completedAsgns, error: compAsgnErr }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'user'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'user').eq('account_status', 'active'),
        supabase.from('challenges').select('*', { count: 'exact', head: true }).eq('is_archived', false),
        supabase.from('assignments').select('*', { count: 'exact', head: true }),
        supabase.from('assignments').select('*', { count: 'exact', head: true }).eq('progress_status', 'complete'),
      ]);

      // DATA-01 fix: surface DB errors to TanStack Query instead of silently falling back to 0
      if (totalUserErr || activeUserErr || chalErr || totalAsgnErr || compAsgnErr) {
        console.error('Metric query failures:', { totalUserErr, activeUserErr, chalErr, totalAsgnErr, compAsgnErr });
        throw new Error('Failed to compute cohort metrics.');
      }

      const total = totalAsgns || 0;
      const completed = completedAsgns || 0;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        totalUsers: totalUserCount || 0,
        activeUsers: activeUserCount ?? (totalUserCount || 0),
        totalChallenges: challengeCount || 0,
        activeChallenges: challengeCount || 0,
        completedAssignments: completed,
        totalAssignments: total,
        completionRatePercentage: rate,
      };
    },
  });
}
