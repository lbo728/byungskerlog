export interface Post {
  id: string;
  slug: string;
  title: string;
  content: string;
  excerpt: string | null;
  tags: string[];
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PostPreview {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  createdAt: Date;
  updatedAt: Date;
}
