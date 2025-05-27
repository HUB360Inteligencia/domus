
import { 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Control } from 'react-hook-form';
import { FormValues } from './form-schema';

interface Option {
  label: string;
  value: string;
}

interface SelectFieldProps {
  control: Control<FormValues>;
  name: keyof FormValues;
  label: string;
  placeholder: string;
  options: Option[];
  onChange?: (value: string) => void;
  allowEmpty?: boolean;
}

export const SelectField = ({ 
  control, 
  name, 
  label, 
  placeholder, 
  options,
  onChange,
  allowEmpty = false
}: SelectFieldProps) => {
  // More strict filtering to ensure no empty values
  const validOptions = options.filter(option => {
    // Log any problematic options for debugging
    if (!option || !option.value || !option.label) {
      console.log('Filtering out invalid option:', option);
      return false;
    }
    
    const hasValidValue = option.value && 
                         typeof option.value === 'string' && 
                         option.value.trim() !== '' && 
                         option.value !== 'undefined' &&
                         option.value !== 'null' &&
                         option.value !== 'empty';
                         
    const hasValidLabel = option.label &&
                         typeof option.label === 'string' &&
                         option.label.trim() !== '';
    
    if (!hasValidValue || !hasValidLabel) {
      console.log('Filtering out option with invalid value/label:', option);
      return false;
    }
    
    return true;
  });

  console.log('Valid options for select:', validOptions);

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select 
            onValueChange={(value) => {
              // Ensure we never pass empty strings to SelectItem
              if (value === "none" || !value || value.trim() === '') {
                field.onChange(null);
                onChange?.(allowEmpty ? "none" : "");
              } else {
                field.onChange(value);
                onChange?.(value);
              }
            }} 
            value={field.value?.toString() || undefined}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {allowEmpty && <SelectItem value="none">Nenhum</SelectItem>}
              {validOptions.length > 0 ? (
                validOptions.map(option => {
                  // Additional safety check before rendering
                  if (!option.value || option.value.trim() === '') {
                    console.error('Attempting to render SelectItem with empty value:', option);
                    return null;
                  }
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  );
                })
              ) : (
                <SelectItem value="no-options" disabled>
                  Nenhuma opção disponível
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
