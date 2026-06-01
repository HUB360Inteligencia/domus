import { useParams } from 'react-router-dom';
import { ContactDetail } from '@/components/contacts/contact-detail';

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  if (!id) return null;
  return <ContactDetail contactId={id} />;
}
