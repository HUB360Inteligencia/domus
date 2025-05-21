import { supabase } from "@/integrations/supabase/client";
import { Activity, ActivityCategory, ActivityFormData, ActivityStatus } from "@/types/activity";

/**
 * Busca todas as atividades do usuário atual
 */
export const fetchActivities = async (): Promise<Activity[]> => {
  try {
    console.log('Buscando atividades do Supabase...');
    
    const session = await supabase.auth.getSession();
    if (!session.data.session) {
      console.error('Nenhuma sessão ativa encontrada');
      throw new Error('Usuário não autenticado');
    }

    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .order('due_date', { ascending: true });

    if (error) {
      console.error('Erro ao buscar atividades:', error);
      throw { message: error.message, status: error.code === 'PGRST301' ? 401 : 500 };
    }

    console.log('Atividades buscadas com sucesso:', data?.length || 0);
    return data as Activity[] || [];
  } catch (err) {
    console.error('Falha ao buscar atividades:', err);
    throw err;
  }
};

/**
 * Busca uma atividade pelo ID
 */
export const fetchActivityById = async (id: string): Promise<Activity | null> => {
  if (!id) return null;
  
  try {
    console.log(`Buscando detalhes da atividade com ID: ${id}`);
    
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Erro ao buscar atividade ${id}:`, error);
      throw { message: error.message, status: error.code === 'PGRST301' ? 401 : 500 };
    }

    console.log('Resultado da busca de atividade:', data ? 'Sucesso' : 'Não encontrada');
    return data as Activity;
  } catch (err) {
    console.error(`Falha ao buscar atividade ${id}:`, err);
    throw err;
  }
};

/**
 * Busca atividades relacionadas a uma propriedade
 */
export const fetchActivitiesByProperty = async (propertyId: string): Promise<Activity[]> => {
  if (!propertyId) return [];
  
  try {
    console.log(`Buscando atividades para a propriedade: ${propertyId}`);
    
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('property_id', propertyId)
      .order('due_date', { ascending: true });

    if (error) {
      console.error(`Erro ao buscar atividades para propriedade ${propertyId}:`, error);
      throw new Error(error.message);
    }

    return data as Activity[] || [];
  } catch (err) {
    console.error(`Falha ao buscar atividades para propriedade ${propertyId}:`, err);
    throw err;
  }
};

/**
 * Cria uma nova atividade
 */
export const createActivity = async (activityData: ActivityFormData): Promise<Activity> => {
  const user = supabase.auth.getUser();
  if (!(await user).data.user) throw new Error('Usuário não autenticado');
  
  try {
    console.log('Criando nova atividade:', activityData);
    
    // Separar categorias dos dados da atividade
    const { categories, ...activityPayload } = activityData;
    
    // Inserir a atividade
    const { data, error } = await supabase
      .from('activities')
      .insert([
        {
          ...activityPayload,
          user_id: (await user).data.user?.id,
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar atividade:', error);
      throw new Error(error.message);
    }
    
    // Se houver categorias, criar as relações
    if (categories && categories.length > 0 && data) {
      const categoryRelations = categories.map(categoryId => ({
        activity_id: data.id,
        category_id: categoryId
      }));
      
      const { error: relError } = await supabase
        .from('activity_category_relations')
        .insert(categoryRelations);
      
      if (relError) {
        console.error('Erro ao associar categorias à atividade:', relError);
      }
    }

    return data;
  } catch (err) {
    console.error('Falha ao criar atividade:', err);
    throw err;
  }
};

/**
 * Atualiza uma atividade existente
 */
export const updateActivity = async (id: string, activityData: Partial<ActivityFormData>): Promise<Activity> => {
  if (!id) throw new Error('ID da atividade não fornecido');
  
  try {
    console.log(`Atualizando atividade ${id}:`, activityData);
    
    // Separar categorias dos dados da atividade
    const { categories, ...activityPayload } = activityData;
    
    // Atualizar a atividade
    const { data, error } = await supabase
      .from('activities')
      .update(activityPayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Erro ao atualizar atividade ${id}:`, error);
      throw new Error(error.message);
    }
    
    // Se houver categorias, atualizar as relações
    if (categories !== undefined && data) {
      // Primeiro remover todas as relações existentes
      const { error: delError } = await supabase
        .from('activity_category_relations')
        .delete()
        .eq('activity_id', id);
      
      if (delError) {
        console.error(`Erro ao remover categorias existentes da atividade ${id}:`, delError);
      }
      
      // Depois adicionar as novas relações, se houver
      if (categories.length > 0) {
        const categoryRelations = categories.map(categoryId => ({
          activity_id: data.id,
          category_id: categoryId
        }));
        
        const { error: relError } = await supabase
          .from('activity_category_relations')
          .insert(categoryRelations);
        
        if (relError) {
          console.error(`Erro ao associar novas categorias à atividade ${id}:`, relError);
        }
      }
    }

    return data;
  } catch (err) {
    console.error(`Falha ao atualizar atividade ${id}:`, err);
    throw err;
  }
};

/**
 * Atualiza apenas o status de uma atividade (útil para o drag-and-drop no Kanban)
 */
export const updateActivityStatus = async (id: string, status: ActivityStatus): Promise<Activity> => {
  try {
    console.log(`Atualizando status da atividade ${id} para ${status}`);
    
    // Se o status for "completed", definir a data de conclusão
    const completedAt = status === 'completed' ? new Date().toISOString() : null;
    
    const { data, error } = await supabase
      .from('activities')
      .update({ 
        status,
        completed_at: completedAt
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Erro ao atualizar status da atividade ${id}:`, error);
      throw new Error(error.message);
    }

    return data as Activity;
  } catch (err) {
    console.error(`Falha ao atualizar status da atividade ${id}:`, err);
    throw err;
  }
};

/**
 * Exclui uma atividade
 */
export const deleteActivity = async (id: string): Promise<void> => {
  try {
    console.log(`Excluindo atividade ${id}`);
    
    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Erro ao excluir atividade ${id}:`, error);
      throw new Error(error.message);
    }
  } catch (err) {
    console.error(`Falha ao excluir atividade ${id}:`, err);
    throw err;
  }
};

/**
 * Converte uma atividade em despesa para uma propriedade
 */
export const convertActivityToExpense = async (activityId: string): Promise<{ expenseId: string }> => {
  try {
    console.log(`Convertendo atividade ${activityId} em despesa`);
    
    // Primeiro, buscar os dados da atividade
    const { data: activity, error: fetchError } = await supabase
      .from('activities')
      .select('*')
      .eq('id', activityId)
      .single();
    
    if (fetchError || !activity) {
      console.error(`Erro ao buscar atividade ${activityId}:`, fetchError);
      throw new Error(fetchError?.message || 'Atividade não encontrada');
    }
    
    // Verificar se a atividade já tem uma despesa associada
    if (activity.expense_id) {
      console.log(`Atividade ${activityId} já foi convertida em despesa: ${activity.expense_id}`);
      return { expenseId: activity.expense_id };
    }
    
    // Verificar se a atividade tem uma propriedade associada
    if (!activity.property_id) {
      throw new Error('Esta atividade não está associada a nenhuma propriedade');
    }
    
    // Criar a nova despesa
    const { data: expense, error: expenseError } = await supabase
      .from('property_expenses')
      .insert([{
        property_id: activity.property_id,
        expense_type: activity.activity_type === 'maintenance' ? 'maintenance' : 'other',
        description: activity.title,
        maintenance_details: activity.description,
        amount: activity.actual_cost || activity.estimated_cost || 0,
        paid_at: new Date().toISOString().split('T')[0] // YYYY-MM-DD
      }])
      .select()
      .single();
    
    if (expenseError || !expense) {
      console.error('Erro ao criar despesa:', expenseError);
      throw new Error(expenseError?.message || 'Erro ao criar despesa');
    }
    
    // Atualizar a atividade com a referência à despesa criada
    const { error: updateError } = await supabase
      .from('activities')
      .update({ expense_id: expense.id })
      .eq('id', activityId);
    
    if (updateError) {
      console.error(`Erro ao atualizar atividade ${activityId} com a despesa:`, updateError);
      // Não lançar erro aqui, a despesa já foi criada
    }
    
    return { expenseId: expense.id };
  } catch (err) {
    console.error(`Falha ao converter atividade ${activityId} em despesa:`, err);
    throw err;
  }
};

/**
 * Busca categorias de atividades (padrão + do usuário)
 */
export const fetchActivityCategories = async (): Promise<ActivityCategory[]> => {
  try {
    console.log('Buscando categorias de atividades');
    
    const { data, error } = await supabase
      .from('activity_categories')
      .select('*')
      .order('name');

    if (error) {
      console.error('Erro ao buscar categorias:', error);
      throw new Error(error.message);
    }

    return data || [];
  } catch (err) {
    console.error('Falha ao buscar categorias:', err);
    throw err;
  }
};

/**
 * Cria uma nova categoria de atividade
 */
export const createActivityCategory = async (name: string, description?: string): Promise<ActivityCategory> => {
  const user = supabase.auth.getUser();
  if (!(await user).data.user) throw new Error('Usuário não autenticado');
  
  try {
    console.log(`Criando nova categoria: ${name}`);
    
    const { data, error } = await supabase
      .from('activity_categories')
      .insert([{
        name,
        description,
        is_default: false,
        user_id: (await user).data.user?.id
      }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar categoria:', error);
      throw new Error(error.message);
    }

    return data;
  } catch (err) {
    console.error('Falha ao criar categoria:', err);
    throw err;
  }
};

/**
 * Busca as categorias associadas a uma atividade específica
 */
export const fetchActivityCategoryRelations = async (activityId: string): Promise<string[]> => {
  try {
    console.log(`Buscando categorias para atividade ${activityId}`);
    
    const { data, error } = await supabase
      .from('activity_category_relations')
      .select('category_id')
      .eq('activity_id', activityId);

    if (error) {
      console.error(`Erro ao buscar categorias para atividade ${activityId}:`, error);
      throw new Error(error.message);
    }

    return (data || []).map(relation => relation.category_id);
  } catch (err) {
    console.error(`Falha ao buscar categorias para atividade ${activityId}:`, err);
    throw err;
  }
};
