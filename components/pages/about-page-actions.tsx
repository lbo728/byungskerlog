"use client";

import { useState } from "react";
import { useUser } from "@stackframe/stack";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { AboutEditModal } from "@/components/modals";

export function AboutPageActions() {
  const user = useUser();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!user) {
    return null;
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setIsModalOpen(true)} className="gap-2">
        <Pencil className="h-4 w-4" />
        편집하기
      </Button>
      <AboutEditModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  );
}
