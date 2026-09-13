"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminLogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <Button
      variant="outline"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await fetch("/api/superadmin/logout", { method: "POST" });
          router.refresh();
        } finally {
          setBusy(false);
        }
      }}
      className="h-10 rounded-xl px-4 text-sm font-semibold"
    >
      <LogOut className="h-4 w-4" />
      Sign out
    </Button>
  );
}
