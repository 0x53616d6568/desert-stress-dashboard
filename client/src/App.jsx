import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider, useAuth } from "@/providers/AuthProvider";
import { WebSocketProvider } from "@/providers/WebSocketProvider";
import { Layout } from "@/components/Layout";
import { PageTransition } from "@/components/PageTransition";
import { Loader2 } from "lucide-react";

import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import MapPage from "@/pages/map";
import Subjects from "@/pages/subjects";
import Devices from "@/pages/devices";
import Alerts from "@/pages/alerts";
import Telemetry from "@/pages/telemetry";
import AiModels from "@/pages/ai-models";
import Datasets from "@/pages/datasets";
import Firmware from "@/pages/firmware";
import InferenceHealth from "@/pages/inference-health";
import Help from "@/pages/help";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function ProtectedRoute({ component: Component, ...rest }) {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <Redirect to="/login" />;
  return (
    <WebSocketProvider>
      <Layout>
        <PageTransition>
          <Component {...rest} />
        </PageTransition>
      </Layout>
    </WebSocketProvider>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" component={() => <Redirect to="/dashboard" />} />
      <Route path="/dashboard"><ProtectedRoute component={Dashboard} /></Route>
      <Route path="/map"><ProtectedRoute component={MapPage} /></Route>
      <Route path="/telemetry"><ProtectedRoute component={Telemetry} /></Route>
      <Route path="/subjects"><ProtectedRoute component={Subjects} /></Route>
      <Route path="/devices"><ProtectedRoute component={Devices} /></Route>
      <Route path="/alerts"><ProtectedRoute component={Alerts} /></Route>
      <Route path="/admin/ai-models"><ProtectedRoute component={AiModels} /></Route>
      <Route path="/admin/datasets"><ProtectedRoute component={Datasets} /></Route>
      <Route path="/admin/firmware"><ProtectedRoute component={Firmware} /></Route>
      <Route path="/admin/inference-health"><ProtectedRoute component={InferenceHealth} /></Route>
      <Route path="/help"><ProtectedRoute component={Help} /></Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="dsm-theme">
        <WouterRouter>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
