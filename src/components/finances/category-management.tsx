import React, { useState } from "react";
import { ArrowDownRight, ArrowUpRight, Pencil, PlusCircle, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  CategoryFormData,
  FinancialCategory,
  useFinancialCategories,
} from "@/hooks/use-financial-categories";
import { cn } from "@/lib/utils";

export function CategoryManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<FinancialCategory | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    type: "expense",
  });

  const {
    categories,
    isLoadingCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    isCreating,
    isUpdating,
    isDeleting,
  } = useFinancialCategories();

  const handleOpenDialog = (category?: FinancialCategory) => {
    if (category) {
      setSelectedCategory(category);
      setFormData({
        name: category.name,
        type: category.type,
      });
    } else {
      setSelectedCategory(null);
      setFormData({
        name: "",
        type: "expense",
      });
    }

    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedCategory(null);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  const handleSelectChange = (value: string) => {
    if (!value.trim()) return;

    setFormData({
      ...formData,
      type: value as "income" | "expense",
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (selectedCategory) {
      await updateCategory({ ...formData, id: selectedCategory.id });
    } else {
      await createCategory(formData);
    }

    handleCloseDialog();
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("Deseja excluir esta categoria?");
    if (!confirmed) return;

    await deleteCategory(id);
  };

  const incomeCategories = categories.filter((category) => category.type === "income");
  const expenseCategories = categories.filter((category) => category.type === "expense");

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
            Plano de contas
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Categorias financeiras</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Organize receitas e despesas para que os gráficos de rentabilidade, fluxo e despesas fiquem legíveis.
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="h-11 rounded-full">
          <PlusCircle className="mr-2 h-4 w-4" />
          Nova categoria
        </Button>
      </div>

      {isLoadingCategories ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((item) => (
            <div key={item} className="h-56 animate-pulse rounded-[1.75rem] bg-muted" />
          ))}
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          <CategoryColumn
            title="Receitas"
            description="Entradas do portfólio, como aluguel e reembolsos."
            icon={ArrowUpRight}
            tone="success"
            categories={incomeCategories}
            isDeleting={isDeleting}
            onEdit={handleOpenDialog}
            onDelete={handleDelete}
          />
          <CategoryColumn
            title="Despesas"
            description="Saídas operacionais, impostos, manutenção e taxas."
            icon={ArrowDownRight}
            tone="danger"
            categories={expenseCategories}
            isDeleting={isDeleting}
            onEdit={handleOpenDialog}
            onDelete={handleDelete}
          />
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>{selectedCategory ? "Editar categoria" : "Nova categoria"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Nome da categoria
                </label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Ex.: Aluguel, IPTU, Manutenção"
                  required
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="type" className="text-sm font-medium">
                  Tipo
                </label>
                <Select value={formData.type} onValueChange={handleSelectChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Receita</SelectItem>
                    <SelectItem value="expense">Despesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isCreating || isUpdating}>
                {selectedCategory ? "Salvar alterações" : "Criar categoria"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface CategoryColumnProps {
  title: string;
  description: string;
  icon: React.ElementType;
  tone: "success" | "danger";
  categories: FinancialCategory[];
  isDeleting: boolean;
  onEdit: (category: FinancialCategory) => void;
  onDelete: (id: string) => void;
}

function CategoryColumn({
  title,
  description,
  icon: Icon,
  tone,
  categories,
  isDeleting,
  onEdit,
  onDelete,
}: CategoryColumnProps) {
  const toneClass = tone === "success"
    ? "bg-emerald-700 text-white"
    : "bg-rose-700 text-white";

  return (
    <div className="rounded-[1.75rem] border border-stone-200/70 bg-white/62 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        <div className={cn("rounded-2xl p-3", toneClass)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-5 space-y-2">
        {categories.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-stone-200 bg-white/60 p-5 text-sm text-muted-foreground">
            Nenhuma categoria cadastrada.
          </div>
        ) : (
          categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-stone-200/70 bg-white/75 px-3 py-3"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-medium">{category.name}</p>
                  {category.is_default && (
                    <Badge variant="outline" className="rounded-full text-[10px]">
                      Padrão
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(category)}
                  className="h-9 w-9 rounded-xl"
                  title="Editar categoria"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(category.id)}
                  disabled={category.is_default || isDeleting}
                  className="h-9 w-9 rounded-xl text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                  title="Excluir categoria"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
