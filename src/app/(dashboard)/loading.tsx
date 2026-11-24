import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="animate-pulse text-sm font-medium text-muted-foreground">
        Loading Zprofile platform...
      </p>
    </div>
  );
}
