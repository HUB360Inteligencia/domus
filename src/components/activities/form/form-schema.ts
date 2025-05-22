
import { z } from 'zod';
import { ActivityStatus } from '@/types/activity';

// Create a schema for form validation with proper types
export const formSchema = z.object({
  title: z.string().min(3, { message: 'O título deve ter pelo menos 3 caracteres' }),
  description: z.string().optional(),
  activity_type: z.enum(['maintenance', 'inspection', 'legal', 'financial', 'other']),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']),
  priority: z.enum(['low', 'medium', 'high']),
  start_date: z.date().optional().nullable(),
  due_date: z.date().optional().nullable(),
  completed_at: z.date().optional().nullable(),
  responsible_name: z.string().optional(),
  responsible_contact: z.string().optional(),
  responsible_notes: z.string().optional(),
  estimated_cost: z.number().optional().nullable(),
  actual_cost: z.number().optional().nullable(),
  property_id: z.string().optional().nullable(),
  contract_id: z.string().optional().nullable(),
});

export type FormValues = z.infer<typeof formSchema>;
