'use client';

import { useRouter } from 'next/navigation';
import { useUser } from '@stackframe/stack';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';

interface PostActionsProps {
  postId: string;
  postTitle: string;
}

export function PostActions({ postId, postTitle }: PostActionsProps) {
  const user = useUser();
  const router = useRouter();

  if (!user) {
    return null;
  }

  const handleEdit = () => {
    router.push(`/admin/write?id=${postId}`);
  };

  const handleDelete = async () => {
    if (!confirm(`"${postTitle}" 포스트를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete post');
      }

      alert('포스트가 삭제되었습니다.');
      router.push('/posts');
      router.refresh();
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('포스트 삭제 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={handleEdit} className="gap-2">
        <Pencil className="h-4 w-4" />
        수정하기
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleDelete}
        className="gap-2 text-destructive hover:bg-destructive hover:text-destructive-foreground"
      >
        <Trash2 className="h-4 w-4" />
        삭제하기
      </Button>
    </div>
  );
}
