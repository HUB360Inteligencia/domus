
import { 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Control } from 'react-hook-form';
import { FormValues } from './form-schema';

interface TextareaFieldProps {
  control: Control<FormValues>;
  name: keyof FormValues;
  label: string;
  placeholder: string;
  className?: string;
}

export const TextareaField = ({ 
  control, 
  name, 
  label, 
  placeholder,
  className = "min-h-32"
}: TextareaFieldProps) => {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Textarea 
              placeholder={placeholder} 
              className={className} 
              {...field} 
              value={field.value || ''}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
