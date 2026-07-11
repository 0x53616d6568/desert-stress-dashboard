import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useLocation } from "wouter";
import { login as apiLogin } from "@/services/api";
import anime from "animejs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Activity, Loader2, Radio, HeartPulse, BrainCircuit, MapPin, Wifi, ArrowRight } from "lucide-react";

function OrbitingRings({ containerRef }) {
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const ringCount = 4;
    for (let i = 0; i < ringCount; i++) {
      const ring = document.createElement("div");
      ring.className = "orbit-ring";
      const size = 200 + i * 120;
      ring.style.width = `${size}px`;
      ring.style.height = `${size}px`;
      ring.style.border = "1px solid hsl(var(--primary) / 0.15)";
      ring.style.borderRadius = "50%";
      ring.style.position = "absolute";
      ring.style.top = "50%";
      ring.style.left = "50%";
      ring.style.marginTop = `-${size / 2}px`;
      ring.style.marginLeft = `-${size / 2}px`;
      ring.style.pointerEvents = "none";
      container.appendChild(ring);

      anime({
        targets: ring,
        rotate: i % 2 === 0 ? 360 : -360,
        duration: 20000 + i * 5000,
        easing: "linear",
        loop: true,
      });

      const dotCount = 3 + i;
      for (let d = 0; d < dotCount; d++) {
        const dot = document.createElement("div");
        dot.className = "orbit-dot";
        dot.style.width = "6px";
        dot.style.height = "6px";
        dot.style.backgroundColor = i === 0 ? "hsl(var(--primary))" : "hsl(var(--primary) / 0.5)";
        dot.style.borderRadius = "50%";
        dot.style.position = "absolute";
        dot.style.top = "0";
        dot.style.left = "50%";
        dot.style.transform = "translate(-50%, -50%)";
        dot.style.boxShadow = `0 0 10px hsl(var(--primary) / 0.6)`;
        ring.appendChild(dot);
      }
    }

    const pulse = document.createElement("div");
    pulse.className = "center-pulse";
    pulse.style.width = "20px";
    pulse.style.height = "20px";
    pulse.style.backgroundColor = "hsl(var(--primary))";
    pulse.style.borderRadius = "50%";
    pulse.style.position = "absolute";
    pulse.style.top = "50%";
    pulse.style.left = "50%";
    pulse.style.transform = "translate(-50%, -50%)";
    pulse.style.boxShadow = "0 0 30px hsl(var(--primary) / 0.8)";
    container.appendChild(pulse);

    anime({
      targets: pulse,
      scale: [1, 1.8],
      opacity: [1, 0.2],
      duration: 2000,
      easing: "easeInOutSine",
      loop: true,
      direction: "alternate",
    });

    return () => {
      while (container.firstChild) container.removeChild(container.firstChild);
    };
  }, [containerRef]);
  return null;
}

const featureCards = [
  { icon: Radio, label: "LoRa telemetry", sub: "915 MHz long-range" },
  { icon: HeartPulse, label: "Live stress scores", sub: "ML inference on-edge" },
  { icon: BrainCircuit, label: "Tcore AI estimation", sub: "FEM-corrected MAE" },
  { icon: MapPin, label: "GPS hires tracking", sub: "~1m ublox_m9" },
];

export default function Login() {
  const { login: setAuthToken } = useAuth();
  const [, setLocation] = useLocation();
  const orbitRef = useRef(null);
  const pageRef = useRef(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!pageRef.current) return;
    anime({
      targets: pageRef.current.querySelectorAll(".login-animate-in"),
      translateY: [30, 0],
      opacity: [0, 1],
      delay: anime.stagger(80),
      duration: 800,
      easing: "easeOutCubic",
    });
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await apiLogin({ email, password });
      setAuthToken(data.token);
      setLocation("/dashboard");
    } catch (err) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div ref={pageRef} className="relative min-h-screen w-full flex bg-background overflow-hidden">
      <div className="hidden lg:flex flex-1 flex-col justify-center p-12 relative z-10">
        <div className="login-animate-in max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight font-mono">Desert Stress Monitor</h2>
              <p className="text-xs text-muted-foreground font-mono">915 MHz private LoRa packet</p>
            </div>
          </div>

          <h1 className="text-4xl font-bold tracking-tight mb-4 leading-tight">
            Real-time camel &<br />human stress tracking
          </h1>
          <p className="text-muted-foreground text-sm mb-10 max-w-sm leading-relaxed">
            AI-powered monitoring in harsh desert environments. LoRa 915MHz, on-device ML inference, Tcore estimation with corrected scalers.
          </p>

          <div className="grid grid-cols-1 gap-3">
            {featureCards.map((feat, i) => (
              <div
                key={i}
                className="login-animate-in flex items-center gap-3 p-3 rounded-lg bg-card/40 border border-border/30 backdrop-blur-sm hover:border-primary/30 transition-colors duration-300"
              >
                <feat.icon className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <div className="text-sm font-semibold">{feat.label}</div>
                  <div className="text-xs text-muted-foreground">{feat.sub}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 text-xs text-muted-foreground font-mono">
            <span className="inline-flex items-center gap-1">
              <Wifi className="h-3 w-3 text-emerald-500" />
              Firmware: verified | Device connectivity: verified | Ports: v2 passthrough
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 relative">
        <div ref={orbitRef} className="absolute inset-0 z-0 pointer-events-none overflow-hidden" />
        <OrbitingRings containerRef={orbitRef} />

        <div className="login-animate-in relative z-10 w-full max-w-sm">
          <Card className="border-border/40 shadow-2xl bg-card/80 backdrop-blur-xl">
            <CardHeader className="space-y-1 pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                  <Activity className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold font-mono">Operator Login</CardTitle>
                  <p className="text-xs text-muted-foreground">Desert Stress Monitor</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-xs font-mono text-muted-foreground">Email address</Label>
                  <Input
                    type="email"
                    placeholder="operator@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="font-mono bg-background/50 text-sm"
                    autoComplete="email"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-mono text-muted-foreground">Password</Label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="font-mono bg-background/50 text-sm"
                    autoComplete="current-password"
                    required
                  />
                </div>

                {error && (
                  <div className="p-2.5 rounded bg-destructive/10 text-destructive text-xs font-mono border border-destructive/20">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full font-mono font-semibold text-sm bg-primary hover:bg-primary/90 transition-all duration-200 group"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ArrowRight className="h-4 w-4 mr-2 group-hover:translate-x-0.5 transition-transform" />}
                  Sign in
                </Button>

                <p className="text-center text-[10px] text-muted-foreground font-mono pt-1">
                  Check server log for generated development credentials
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
