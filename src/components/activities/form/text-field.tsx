
import { 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Control } from 'react-hook-form';
import { FormValues } from './form-schema';

interface TextFieldProps {
  control: Control<FormValues>;
  name: keyof FormValues;
  label: string;
  placeholder: string;
  type?: string;
}

export const TextField = ({ 
  control, 
  name, 
  label, 
  placeholder, 
  type = "text" 
}: TextFieldProps) => {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input 
              type={type} 
              placeholder={placeholder} 
              {...field} 
              value={typeof field.value === 'string' || typeof field.value === 'number' ? field.value : field.value ? String(field.value) : ''}
              onChange={(e) => {
                if (type === "number") {
                  const value = e.target.value ? parseFloat(e.target.value) : null;
                  field.onChange(value);
                } else {
                  field.onChange(e.target.value || '');
                }
              }}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
