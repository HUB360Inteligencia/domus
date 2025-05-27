
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface FinancialCategory {
  id: string;
  name: string;
  type: 'income' | 'expense';
  is_default: boolean;
  user_id?: string;
  created_at: string;
}

export interface CategoryFormData {
  name: string;
  type: 'income' | 'expense';
}

// Categorias padrão de receita para imóveis
const DEFAULT_INCOME_CATEGORIES = [
  'Aluguel',
  'Reembolso',
  'Desapropriação',
  'Participação de Dividendos',
  'Multas por Atraso',
  'Taxa de Transferência',
  'Venda de Imóvel',
  'Seguro de Imóvel',
  'Valorização de Capital',
  'Outros'
];

// Categorias padrão de despesa para imóveis
const DEFAULT_EXPENSE_CATEGORIES = [
  'Manutenção',
  'Reforma',
  'IPTU',
  'Taxa de Condomínio',
  'Seguro',
  'Corretagem',
  'Documentação',
  'Taxas Bancárias',
  'Impostos',
  'Advocacia',
  'Contabilidade',
  'Energia Elétrica',
  'Água',
  'Gás',
  'Internet',
  'Limpeza',
  'Jardinagem',
  'Portaria',
  'Outros'
];

export const useFinancialCategories = () => {
  const queryClient = useQueryClient();

  // Fetch categories
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ['financial-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_categories')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching categories:', error);
        throw error;
      }

      return data || [];
    }
  });

  // Initialize default categories if none exist
  const { mutateAsync: initializeDefaultCategories } = useMutation({
    mutationFn: async () => {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('User not authenticated');

      // Check if categories already exist
      const { data: existingCategories } = await supabase
        .from('financial_categories')
        .select('id')
        .limit(1);

      if (existingCategories && existingCategories.length > 0) {
        return; // Categories already exist
      }

      // Create default income categories
      const incomeCategories = DEFAULT_INCOME_CATEGORIES.map(name => ({
        name,
        type: 'income' as const,
        is_default: true,
        user_id: user.data.user.id
      }));

      // Create default expense categories
      const expenseCategories = DEFAULT_EXPENSE_CATEGORIES.map(name => ({
        name,
        type: 'expense' as const,
        is_default: true,
        user_id: user.data.user.id
      }));

      const allCategories = [...incomeCategories, ...expenseCategories];

      const { error } = await supabase
        .from('financial_categories')
        .insert(allCategories);

      if (error) {
        console.error('Error creating default categories:', error);
        throw error;
      }

      return allCategories;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-categories'] });
      toast.success('Categorias padrão criadas com sucesso');
    },
    onError: (error) => {
      console.error('Failed to create default categories:', error);
      toast.error('Erro ao criar categorias padrão');
    }
  });

  // Create category
  const { mutateAsync: createCategory, isPending: isCreating } = useMutation({
    mutationFn: async (category: CategoryFormData) => {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('financial_categories')
        .insert([{
          ...category,
          is_default: false,
          user_id: user.data.user.id
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating category:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-categories'] });
      toast.success('Categoria criada com sucesso');
    },
    onError: (error) => {
      console.error('Failed to create category:', error);
      toast.error('Erro ao criar categoria');
    }
  });

  // Update category
  const { mutateAsync: updateCategory, isPending: isUpdating } = useMutation({
    mutationFn: async ({ id, ...category }: CategoryFormData & { id: string }) => {
      const { data, error } = await supabase
        .from('financial_categories')
        .update(category)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating category:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-categories'] });
      toast.success('Categoria atualizada com sucesso');
    },
    onError: (error) => {
      console.error('Failed to update category:', error);
      toast.error('Erro ao atualizar categoria');
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
      toast.success('Categoria excluída com sucesso');
    },
    onError: (error) => {
      console.error('Failed to delete category:', error);
      toast.error('Erro ao excluir categoria');
    }
  });

  // Get filtered categories by type
  const getIncomeCategories = () => {
    return categories.filter(cat => cat.type === 'income');
  };

  const getExpenseCategories = () => {
    return categories.filter(cat => cat.type === 'expense');
  };

  // Category options for dropdowns
  const categoryOptions = categories.map(category => ({
    label: category.name,
    value: category.id,
    type: category.type
  }));

  const incomeCategoryOptions = getIncomeCategories().map(category => ({
    label: category.name,
    value: category.id,
    type: category.type
  }));

  const expenseCategoryOptions = getExpenseCategories().map(category => ({
    label: category.name,
    value: category.id,
    type: category.type
  }));

  return {
    categories,
    isLoading: isLoadingCategories,
    isLoadingCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    initializeDefaultCategories,
    isCreating,
    isUpdating,
    isDeleting,
    categoryOptions,
    incomeCategoryOptions,
    expenseCategoryOptions,
    getIncomeCategories,
    getExpenseCategories
  };
};
