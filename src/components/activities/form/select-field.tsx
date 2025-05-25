
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
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select 
            onValueChange={(value) => {
              // If the user selects "none", set the value to null
              const finalValue = value === "none" ? null : value;
              field.onChange(finalValue);
              onChange?.(value);
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
              {options
                .filter(option => option.value && option.value.trim() !== '' && option.value !== '')
                .map(option => (
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
