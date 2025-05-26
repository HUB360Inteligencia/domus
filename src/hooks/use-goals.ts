
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Goal {
  id: string;
  user_id: string;
  goal_type: 'occupancy' | 'revenue' | 'active_contracts';
  target_value: number;
  current_period: string;
  created_at: string;
  updated_at: string;
}

export interface GoalFormData {
  goal_type: 'occupancy' | 'revenue' | 'active_contracts';
  target_value: number;
  current_period: string;
}

export const useGoals = () => {
  return useQuery({
    queryKey: ['goals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .order('goal_type');

      if (error) throw error;
      return data as Goal[];
    },
  });
};

export const useCreateGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (goalData: GoalFormData) => {
      const { data, error } = await supabase
        .from('goals')
        .insert([goalData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
};

export const useUpdateGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...goalData }: { id: string } & Partial<GoalFormData>) => {
      const { data, error } = await supabase
        .from('goals')
        .update(goalData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
};
