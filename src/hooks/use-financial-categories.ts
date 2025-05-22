
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface FinancialCategory {
  id: string;
  name: string;
  type: 'income' | 'expense';
  is_default: boolean;
  user_id: string | null;
  created_at: string;
}

export interface CategoryFormData {
  name: string;
  type: 'income' | 'expense';
}

export const useFinancialCategories = () => {
  const queryClient = useQueryClient();

  // Fetch all categories
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ['financial-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_categories')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching financial categories:', error);
        toast.error('Failed to fetch categories');
        return [];
      }

      // Ensure proper typing of category type field
      return (data || []).map(category => ({
        ...category,
        type: category.type === 'income' ? 'income' : 'expense' 
      })) as FinancialCategory[];
    }
  });

  // Create category
  const { mutateAsync: createCategory, isPending: isCreating } = useMutation({
    mutationFn: async (category: CategoryFormData) => {
      const { data, error } = await supabase
        .from('financial_categories')
        .insert([{
          ...category,
          user_id: (await supabase.auth.getUser()).data.user?.id
        }])
        .select();

      if (error) {
        console.error('Error creating category:', error);
        throw error;
      }

      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-categories'] });
      toast.success('Category created successfully');
    },
    onError: (error) => {
      console.error('Failed to create category:', error);
      toast.error('Failed to create category');
    }
  });

  // Update category
  const { mutateAsync: updateCategory, isPending: isUpdating } = useMutation({
    mutationFn: async ({ id, ...category }: CategoryFormData & { id: string }) => {
      const { data, error } = await supabase
        .from('financial_categories')
        .update(category)
        .eq('id', id)
        .select();

      if (error) {
        console.error('Error updating category:', error);
        throw error;
      }

      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-categories'] });
      toast.success('Category updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update category:', error);
      toast.error('Failed to update category');
    }
  });

  // Delete category
  const { mutateAsync: deleteCategory, isPending: isDeleting } = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('financial_categories')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting category:', error);
        throw error;
      }

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-categories'] });
      toast.success('Category deleted successfully');
    },
    onError: (error) => {
      console.error('Failed to delete category:', error);
      toast.error('Failed to delete category');
    }
  });

  // Format categories for select inputs
  const categoryOptions = Array.isArray(categories) ? categories.map((cat) => ({
    label: cat.name,
    value: cat.id, // Use ID instead of name for value to ensure uniqueness
    type: cat.type,
  })) : [];

  const incomeCategories = categoryOptions.filter((cat) => cat.type === 'income');
  const expenseCategories = categoryOptions.filter((cat) => cat.type === 'expense');

  return {
    categories,
    categoryOptions,
    incomeCategories,
    expenseCategories,
    isLoadingCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    isCreating,
    isUpdating,
    isDeleting
  };
};
