import { useRef, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { useProfile } from '@/hooks/use-profile';
import { Camera, Loader2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export function AvatarUpload() {
  const { user } = useAuth();
  const { uploadAvatar, isUploadingAvatar, removeAvatar, isRemovingAvatar } = useProfile();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const displayName = user?.profile
    ? [user.profile.first_name, user.profile.last_name].filter(Boolean).join(' ') || 'Usuário'
    : 'Usuário';

  const initials = user?.profile
    ? [user.profile.first_name?.[0], user.profile.last_name?.[0]].filter(Boolean).join('').toUpperCase() || 'U'
    : 'U';

  const avatarUrl = preview || user?.profile?.avatar_url || '';
  const hasAvatar = !!user?.profile?.avatar_url;
  const isLoading = isUploadingAvatar || isRemovingAvatar;

  function validateAndUpload(file: File) {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      return;
    }

    // Preview
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    uploadAvatar(file).finally(() => {
      URL.revokeObjectURL(objectUrl);
      setPreview(null);
    });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) validateAndUpload(file);
    // Reset input so the same file can be selected again
    if (inputRef.current) inputRef.current.value = '';
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndUpload(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function handleRemove() {
    removeAvatar();
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Avatar with camera overlay */}
      <div
        className={cn(
          'relative group cursor-pointer rounded-full',
          'ring-4 ring-offset-4 ring-offset-background transition-all duration-300',
          isDragging
            ? 'ring-primary scale-105'
            : 'ring-border/40 hover:ring-primary/60',
        )}
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
        aria-label="Alterar foto de perfil"
      >
        <Avatar className="h-28 w-28 sm:h-32 sm:w-32">
          <AvatarImage src={avatarUrl} alt={displayName} className="object-cover" />
          <AvatarFallback className="bg-[linear-gradient(135deg,#242021,#5a3827,#c4934f)] text-white text-3xl font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>

        {/* Overlay */}
        <div className={cn(
          'absolute inset-0 rounded-full flex items-center justify-center transition-opacity duration-200',
          'bg-black/50',
          isLoading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
        )}>
          {isLoading ? (
            <Loader2 className="h-7 w-7 text-white animate-spin" />
          ) : (
            <Camera className="h-7 w-7 text-white" />
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        className="hidden"
        onChange={handleFileChange}
        disabled={isLoading}
      />

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={isLoading}
        >
          {isUploadingAvatar ? (
            <>
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              Enviando...
            </>
          ) : (
            'Alterar foto'
          )}
        </Button>

        {hasAvatar && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={isLoading}
            className="text-muted-foreground hover:text-destructive"
          >
            {isRemovingAvatar ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        JPG, PNG, WebP ou GIF · Máx. 5 MB
      </p>
    </div>
  );
}
