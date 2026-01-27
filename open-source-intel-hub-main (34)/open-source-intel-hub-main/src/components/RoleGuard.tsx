import { useEffect, useState } from "react";
import { getCurrentUserRole } from "@/services/adminService";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: ("admin" | "soc" | "user")[];
}

export const RoleGuard = ({ children, allowedRoles }: RoleGuardProps) => {
  const [role, setRole] = useState<"admin" | "soc" | "user" | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkRole = async () => {
      try {
        const currentRole = await getCurrentUserRole();
        setRole(currentRole);
      } catch (error) {
        console.error("Error fetching role:", error);
        setRole("user"); // Default to lowest privilege on error
      } finally {
        setLoading(false);
      }
    };

    checkRole();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Verifying access permissions...</p>
        </div>
      </div>
    );
  }

  if (role && !allowedRoles.includes(role)) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center animate-fade-in">
        <div className="relative mb-6">
          <div className="absolute inset-0 animate-pulse rounded-full bg-destructive/20 blur-xl" />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-destructive/10 border border-destructive/30">
            <ShieldAlert className="h-12 w-12 text-destructive" />
          </div>
        </div>
        
        <h1 className="mb-2 text-2xl font-bold tracking-tight text-foreground">
          Access Denied
        </h1>
        <p className="mb-6 max-w-md text-muted-foreground">
          You do not have permission to access this resource. This area is restricted to{" "}
          <span className="font-semibold text-primary">{errorRoleName || "SOC Analysts"}</span> only.
        </p>

        <div className="flex gap-4">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Go Back
          </Button>
          <Button onClick={() => navigate("/dashboard")}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
