import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Activity } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-6">
      <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
        <Activity className="h-8 w-8 text-primary" />
      </div>
      <div>
        <h1 className="text-4xl font-bold font-mono">404</h1>
        <p className="text-muted-foreground mt-2">Page not found in DSM-CONTROL.</p>
      </div>
      <Link href="/dashboard">
        <Button>Return to Dashboard</Button>
      </Link>
    </div>
  );
}
