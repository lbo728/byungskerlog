'use client';

import { useRouter } from 'next/navigation';
import { useUser } from '@stackframe/stack';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';

export function AboutPageActions() {
  const user = useUser();
  const router = useRouter();

  if (!user) {
    return null;
  }

  const handleEdit = () => {
    router.push('/admin/about');
  };

  return (
    <Button variant="outline" size="sm" onClick={handleEdit} className="gap-2">
      <Pencil className="h-4 w-4" />
      편집하기
    </Button>
  );
}
