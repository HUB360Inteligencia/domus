
import { useState } from "react";
import { CalendarIcon, Plus, Trash2, CheckSquare, Square } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCurrency, parseCurrencyToNumber } from "@/lib/format";
import { VariableRentValue } from "@/types/contract";

interface VariableRentInputProps {
  values: VariableRentValue[];
  onChange: (values: VariableRentValue[]) => void;
}

export function VariableRentInput({ values, onChange }: VariableRentInputProps) {
  const [initialValues] = useState(() => values || []);
  
  const addNewRentValue = () => {
    // Get current date to suggest a month/year
    const now = new Date();
    const existingValues = [...values];
    
    const newValue: VariableRentValue = {
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      value: existingValues.length > 0 
        ? existingValues[existingValues.length - 1].value 
        : 0,
      applyUntilEnd: false
    };
    
    onChange([...existingValues, newValue]);
  };

  const updateValueAtIndex = (index: number, field: keyof VariableRentValue, newValue: any) => {
    const updatedValues = [...values];
    updatedValues[index] = {
      ...updatedValues[index],
      [field]: newValue
    };
    
    onChange(updatedValues);
  };
  
  const handleInputChange = (index: number, field: string, value: string) => {
    if (field === 'value') {
      // Parse the currency value using the fixed function
      const numValue = parseCurrencyToNumber(value);
      updateValueAtIndex(index, 'value', numValue);
    } else if (field === 'month') {
      // Ensure month is between 1-12
      const numValue = parseInt(value);
      if (numValue >= 1 && numValue <= 12) {
        updateValueAtIndex(index, 'month', numValue);
      }
    } else if (field === 'year') {
      // Basic year validation
      const numValue = parseInt(value);
      if (numValue >= 2000 && numValue <= 2100) {
        updateValueAtIndex(index, 'year', numValue);
      }
    }
  };
  
  const toggleApplyUntilEnd = (index: number) => {
    updateValueAtIndex(index, 'applyUntilEnd', !values[index].applyUntilEnd);
  };
  
  const removeValue = (index: number) => {
    const updatedValues = [...values];
    updatedValues.splice(index, 1);
    onChange(updatedValues);
  };
  
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-medium text-muted-foreground">Valores variáveis de aluguel</h4>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={addNewRentValue}
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar valor
        </Button>
      </div>
      
      {values.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">
          Nenhum valor variável definido. Adicione um valor para começar.
        </p>
      ) : (
        <div className="space-y-3">
          {values.map((item, index) => (
            <Card key={index} className="p-3">
              <div className="grid grid-cols-12 gap-3 items-center">
                <div className="col-span-3 flex flex-col">
                  <span className="text-xs text-muted-foreground">Mês</span>
                  <select
                    className="mt-1 border rounded px-2 py-1"
                    value={item.month}
                    onChange={(e) => handleInputChange(index, 'month', e.target.value)}
                  >
                    {monthNames.map((name, i) => (
                      <option key={i} value={i + 1}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="col-span-2 flex flex-col">
                  <span className="text-xs text-muted-foreground">Ano</span>
                  <Input
                    type="number"
                    min="2000"
                    max="2100"
                    value={item.year}
                    onChange={(e) => handleInputChange(index, 'year', e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                <div className="col-span-4 flex flex-col">
                  <span className="text-xs text-muted-foreground">Valor</span>
                  <Input
                    type="text"
                    value={formatCurrency(item.value)}
                    onChange={(e) => handleInputChange(index, 'value', e.target.value)}
                    className="mt-1"
                    placeholder="R$ 0,00"
                  />
                </div>
                
                <div className="col-span-2 flex items-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="p-1"
                    onClick={() => toggleApplyUntilEnd(index)}
                  >
                    {item.applyUntilEnd ? (
                      <CheckSquare className="h-4 w-4 mr-1" />
                    ) : (
                      <Square className="h-4 w-4 mr-1" />
                    )}
                    <span className="text-xs">Até o fim</span>
                  </Button>
                </div>
                
                <div className="col-span-1 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeValue(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
