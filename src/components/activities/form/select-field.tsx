
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
  // Filter options more strictly to prevent empty values
  const validOptions = options.filter(option => 
    option && 
    option.value && 
    typeof option.value === 'string' && 
    option.value.trim() !== '' && 
    option.label &&
    typeof option.label === 'string' &&
    option.label.trim() !== ''
  );

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
            defaultValue={field.value?.toString() || undefined}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {allowEmpty && <SelectItem value="none">Nenhum</SelectItem>}
              {validOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
