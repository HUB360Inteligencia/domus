import { useParams, useNavigate } from 'react-router-dom';
import { ContactForm } from '@/components/contacts/contact-form';
import { useContactQueries } from '@/hooks/use-contact-queries';
import { useContactMutations } from '@/hooks/use-contact-mutations';
import { ContactFormData } from '@/types/contact';
import { Skeleton } from '@/components/ui/skeleton';

export default function ContactFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const { selectedContact, isLoadingSelectedContact } = useContactQueries({}, id ?? null);
  const { createContact, updateContact, isCreating, isUpdating } = useContactMutations();

  const handleSubmit = async (data: ContactFormData) => {
    if (isEdit && id) {
      await updateContact({ id, form: data });
      navigate(`/contacts/${id}`);
    } else {
      const created = await createContact(data);
      navigate(`/contacts/${created.id}`);
    }
  };

  if (isEdit && isLoadingSelectedContact) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full rounded-[2rem]" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">{isEdit ? 'Editar contato' : 'Novo contato'}</h1>
      <ContactForm
        initialContact={isEdit ? selectedContact : null}
        isSubmitting={isCreating || isUpdating}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
