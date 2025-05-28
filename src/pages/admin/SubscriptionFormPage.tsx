
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SubscriptionForm } from "@/components/subscriptions/subscription-form";

export default function SubscriptionFormPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const clientId = searchParams.get("clientId");
  
  const isEdit = !!id;
  const pageTitle = isEdit ? "Editar Assinatura" : "Nova Assinatura";

  const handleSuccess = () => {
    if (clientId) {
      navigate(`/admin/clients/${clientId}`);
    } else {
      navigate("/admin/clients");
    }
  };

  const handleCancel = () => {
    if (clientId) {
      navigate(`/admin/clients/${clientId}`);
    } else {
      navigate("/admin/clients");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCancel}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{pageTitle}</h1>
          <p className="text-muted-foreground">
            {isEdit ? "Edite os dados da assinatura" : "Crie uma nova assinatura para um cliente"}
          </p>
        </div>
      </div>

      <div className="max-w-4xl">
        <SubscriptionForm 
          subscriptionId={id}
          clientId={clientId || undefined}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
