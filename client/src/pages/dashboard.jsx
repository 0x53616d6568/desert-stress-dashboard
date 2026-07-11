import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { getDashboardSummary, getLiveFeed } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, AlertTriangle, Users, Cpu, ThermometerSun, Wifi, ShieldAlert } from "lucide-react";
import anime from "animejs";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = {
  low: "hsl(var(--stress-low))",
  moderate: "hsl(var(--stress-moderate))",
  high: "hsl(var(--stress-high))",
  critical: "hsl(var(--stress-critical))",
};

function StatCard({ title, value, icon: Icon, colorClass, delay, subtext }) {
  const valueRef = useRef(null);
  useEffect(() => {
    if (valueRef.current) {
      anime({
        targets: valueRef.current,
        innerHTML: [0, value],
        round: 1,
        easing: "easeOutExpo",
        duration: 1500,
        delay,
      });
    }
  }, [value, delay]);
  return (
    <Card className="bg-card/50 backdrop-blur border-border/50 hover:border-primary/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${colorClass}`} />
      </CardHeader>
      <CardContent>
        <div ref={valueRef} className="text-2xl md:text-3xl font-mono font-bold tracking-tighter">0</div>
        {subtext && <p className="text-[10px] text-muted-foreground font-mono mt-1">{subtext}</p>}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data: summary, isLoading: sLoading } = useQuery({ queryKey: ["dashboard-summary"], queryFn: getDashboardSummary, refetchInterval: 10000 });
  const { data: feed, isLoading: fLoading } = useQuery({ queryKey: ["live-feed"], queryFn: getLiveFeed, refetchInterval: 10000 });

  const pieData = summary?.stressDistribution
    ? Object.entries(summary.stressDistribution).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 anime-fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-mono font-bold tracking-tight">DASHBOARD</h1>
          <p className="text-muted-foreground font-mono text-sm">Real-time camel & human stress monitoring</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
          <Wifi className="h-3 w-3 text-emerald-500" /> Gateway Online
        </div>
      </div>

      {sLoading ? (
        <div className="text-center py-12 text-muted-foreground font-mono">Loading dashboard...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Active Subjects" value={summary?.activeSubjects || 0} icon={Users} colorClass="text-primary" delay={0} />
            <StatCard title="Critical Alerts" value={summary?.criticalCount || 0} icon={AlertTriangle} colorClass="text-destructive" delay={80} />
            <StatCard title="Hyperthermic" value={summary?.hyperthermic || 0} icon={ThermometerSun} colorClass="text-orange-500" delay={160} />
            <StatCard title="Online Devices" value={summary?.onlineDevices || 0} icon={Cpu} colorClass="text-emerald-500" delay={240} subtext={`of ${summary?.totalDevices || 0} total`} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 bg-card/50 backdrop-blur border-border/50">
              <CardHeader>
                <CardTitle className="font-mono">Live Subject Feed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-3 py-2 text-left font-mono">SUBJECT</th>
                        <th className="px-3 py-2 text-left font-mono">STRESS</th>
                        <th className="px-3 py-2 text-left font-mono">TCORE</th>
                        <th className="px-3 py-2 text-left font-mono">BATTERY</th>
                        <th className="px-3 py-2 text-left font-mono">LAST SEEN</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fLoading ? (
                        <tr><td colSpan={5} className="text-center py-8 text-muted-foreground font-mono">Loading...</td></tr>
                      ) : feed?.length === 0 ? (
                        <tr><td colSpan={5} className="text-center py-8 text-muted-foreground font-mono">No active subjects.</td></tr>
                      ) : (
                        feed?.map((entry) => (
                          <tr key={entry.subjectId} className="border-t">
                            <td className="px-3 py-2 font-mono">
                              <div className="font-semibold">{entry.subjectName}</div>
                              <div className="text-xs text-muted-foreground uppercase">{entry.subjectType}</div>
                            </td>
                            <td className="px-3 py-2">
                              <Badge variant="outline" className={`uppercase ${entry.stressLevel === "critical" ? "text-destructive border-destructive" : entry.stressLevel === "high" ? "text-orange-500 border-orange-500" : entry.stressLevel === "moderate" ? "text-amber-500 border-amber-500" : "text-emerald-500 border-emerald-500"}`}>
                                {entry.stressLevel}
                              </Badge>
                            </td>
                            <td className="px-3 py-2 font-mono">{entry.tcore.toFixed(2)}°C</td>
                            <td className="px-3 py-2 font-mono">{entry.battery}%</td>
                            <td className="px-3 py-2 text-xs text-muted-foreground font-mono">{entry.lastSeen ? new Date(entry.lastSeen).toLocaleTimeString() : "—"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardHeader>
                <CardTitle className="font-mono">Stress Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                        {pieData.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={COLORS[entry.name] || "#888"} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono mt-2">
                  {pieData.map((d) => (
                    <div key={d.name} className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ background: COLORS[d.name] }} />
                      <span className="capitalize">{d.name}: {d.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Wifi className="h-4 w-4 text-emerald-500" />
                    <span className="text-xs font-mono text-muted-foreground">Gateway Online</span>
                  </div>
                  <div className="h-3 w-px bg-border" />
                  <div className="flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-primary" />
                    <span className="text-xs font-mono text-muted-foreground">{summary?.onlineDevices || 0}/{summary?.totalDevices || 0} devices active</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono">
                  {summary?.criticalCount > 0 && (
                    <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 animate-pulse">
                      <ShieldAlert className="h-3 w-3 mr-1" /> {summary.criticalCount} CRITICAL
                    </Badge>
                  )}
                  {summary?.alertCount > 0 && (
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30">
                      <AlertTriangle className="h-3 w-3 mr-1" /> {summary.alertCount} alerts pending
                    </Badge>
                  )}
                  {summary?.hyperthermic > 0 && (
                    <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/30">
                      <ThermometerSun className="h-3 w-3 mr-1" /> {summary.hyperthermic} hyperthermic
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
