
import { RegisterForm } from "@/components/auth/register-form";
import { Card, CardContent } from "@/components/ui/card";

export default function Register() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardContent className="pt-6">
            <RegisterForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
