import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Settings</h1>
        <p className="text-muted-foreground">
          System configurations, roles, and global parameters.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-blue-600" />
            Role & Access Management
          </CardTitle>
          <CardDescription>
            Configured with Administrator, Manager, Engineer, and Partner RBAC policies.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p>
            This section is restricted to <strong>Administrators</strong> via NextAuth
            middleware and server controllers.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
