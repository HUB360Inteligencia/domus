
import { RegisterForm } from "@/components/auth/register-form";
import { Card, CardContent } from "@/components/ui/card";
import { BeamsBackground } from "@/components/ui/beams-background";

export default function Register() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <BeamsBackground intensity="medium" />
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card variant="glass" className="backdrop-blur-xl">
            <CardContent className="pt-6">
              <RegisterForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
