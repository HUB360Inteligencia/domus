import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { PageHeader } from '@/components/ui/page-header';
import { AvatarUpload } from '@/components/profile/avatar-upload';
import { ProfileInfoForm } from '@/components/profile/profile-info-form';
import { ChangePasswordForm } from '@/components/profile/change-password-form';
import { Card, CardContent } from '@/components/ui/card';

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="container mx-auto py-6 space-y-8 max-w-4xl">
      <PageHeader
        title="Meu Perfil"
        description="Gerencie suas informações pessoais e configurações de segurança."
      />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left column: Avatar */}
        <div className="md:col-span-4 lg:col-span-3">
          <Card className="border-none shadow-none bg-transparent">
            <CardContent className="p-0 pt-2 flex justify-center md:justify-start">
              <AvatarUpload />
            </CardContent>
          </Card>
        </div>

        {/* Right column: Forms */}
        <div className="md:col-span-8 lg:col-span-9 space-y-6">
          <ProfileInfoForm />
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  );
}
