import { useQuery } from "@tanstack/react-query";
import { getInferenceHealth, listInferenceLogs } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Stethoscope, Activity, Loader2, BrainCircuit, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

function Metric({ icon: Icon, label, value, sub, color }) {
  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <Icon className={`h-5 w-5 ${color}`} />
          <span className="text-[10px] uppercase text-muted-foreground font-mono">{label}</span>
        </div>
        <div className="mt-3 text-2xl font-mono font-bold">{value}</div>
        {sub && <div className="text-xs text-muted-foreground font-mono mt-1">{sub}</div>}
      </CardContent>
    </Card>
  );
}

export default function InferenceHealth() {
  const { data: health, isLoading: hLoading } = useQuery({ queryKey: ["inference-health"], queryFn: getInferenceHealth, refetchInterval: 15000 });
  const { data: logs, isLoading: lLoading } = useQuery({ queryKey: ["inference-logs"], queryFn: listInferenceLogs, refetchInterval: 15000 });

  const chartData = logs?.map((l) => ({
    timestamp: l.timestamp,
    confidence: l.confidence,
    latency: l.latencyMs,
    stressProb: l.stressProb,
  })) || [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 anime-fade-in">
      <div>
        <h1 className="text-3xl font-mono font-bold tracking-tight">INFERENCE HEALTH</h1>
        <p className="text-muted-foreground font-mono text-sm">Model runtime diagnostics and latency</p>
      </div>

      {hLoading ? (
        <div className="text-center py-12"><Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Metric icon={Clock} label="Avg Latency" value={`${health?.avgLatencyMs ?? 0} ms`} sub={(health?.avgLatencyMs ?? 0) < 50 ? "Healthy" : "Elevated"} color="text-primary" />
            <Metric icon={AlertTriangle} label="Stress 24h" value={health?.stressDetectionsLast24h ?? 0} sub="High/critical events" color="text-amber-500" />
            <Metric icon={CheckCircle} label="False Positive Rate" value={`${((health?.falsePositiveRate ?? 0) * 100).toFixed(1)}%`} sub="< 5% target" color="text-emerald-500" />
            <Metric icon={BrainCircuit} label="7d Accuracy" value={`${((health?.modelAccuracy7d ?? 0) * 100).toFixed(1)}%`} sub={health?.activeModelVersion ? `Model ${health.activeModelVersion}` : "No active model"} color="text-blue-500" />
          </div>

          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle className="font-mono text-lg flex items-center gap-2"><Activity className="h-5 w-5" /> Recent Inference Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="timestamp" tickFormatter={(t) => t ? new Date(t).toLocaleTimeString() : ''} minTickGap={30} />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="confidence" name="Confidence" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="stressProb" name="Stress Prob" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="font-mono">TIME</TableHead>
                      <TableHead className="font-mono">DEVICE</TableHead>
                      <TableHead className="font-mono">EST TCORE</TableHead>
                      <TableHead className="font-mono">STRESS PROB</TableHead>
                      <TableHead className="font-mono">STRESS LEVEL</TableHead>
                      <TableHead className="font-mono">CONFIDENCE</TableHead>
                      <TableHead className="font-mono">LATENCY</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lLoading ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
                    ) : logs?.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground font-mono">No inference logs.</TableCell></TableRow>
                    ) : (
                      logs?.map((l) => (
                        <TableRow key={l.id} className="font-mono">
                          <TableCell className="text-xs text-muted-foreground">{l.timestamp ? new Date(l.timestamp).toLocaleTimeString() : '—'}</TableCell>
                          <TableCell>#{l.deviceId ?? '—'}</TableCell>
                          <TableCell>{l.tcoreEstimated != null ? Number(l.tcoreEstimated).toFixed(2) : '—'}°C</TableCell>
                          <TableCell>{l.stressProb != null ? (l.stressProb * 100).toFixed(1) : '—'}%</TableCell>
                          <TableCell><Badge className={l.stressLevel === "critical" ? "bg-destructive/20 text-destructive" : l.stressLevel === "high" ? "bg-orange-500/20 text-orange-500" : l.stressLevel === "moderate" ? "bg-amber-500/20 text-amber-500" : "bg-emerald-500/20 text-emerald-500"}>{l.stressLevel ?? '—'}</Badge></TableCell>
                          <TableCell>{l.confidence != null ? (l.confidence * 100).toFixed(1) : '—'}%</TableCell>
                          <TableCell>{l.latencyMs != null ? `${l.latencyMs}ms` : '—'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}