"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
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
          const response = await fetch("/api/superadmin/logout", { method: "POST" });
          if (!response.ok) throw new Error("Logout failed");
          router.refresh();
        } catch {
          toast.error("Could not sign out", {
            description: "Your session is still active. Please try again.",
          });
        } finally {
          setBusy(false);
        }
      }}
      aria-label={busy ? "Signing out" : "Sign out of the admin console"}
      className="h-10 w-full justify-start rounded-xl px-3 text-xs font-semibold group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
    >
      <LogOut className="h-4 w-4 shrink-0" />
      <span className="group-data-[collapsible=icon]:hidden">{busy ? "Signing out…" : "Sign out"}</span>
    </Button>
  );
}
