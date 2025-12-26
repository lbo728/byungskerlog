"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Product {
  name: string;
  description: string;
  url: string;
  status?: "released" | "in-progress";
}

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const handleClick = () => {
    if (product.status === "released") {
      window.open(product.url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <Card
      className="product-card hover:shadow-lg transition-shadow cursor-pointer"
      onClick={handleClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{product.name}</CardTitle>
          {product.status === "in-progress" && (
            <span className="status-badge text-xs px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
              작업중
            </span>
          )}
        </div>
        <CardDescription className="mt-2">{product.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {product.status === "released" ? (
          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            className="product-link text-sm text-primary hover:underline inline-flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            바로가기
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        ) : (
          <span className="text-sm text-muted-foreground">곧 출시 예정</span>
        )}
      </CardContent>
    </Card>
  );
}
