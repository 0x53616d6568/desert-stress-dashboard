import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { listTelemetry, getTelemetryStats, getTelemetryChart, listSubjects } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity, Loader2, Search, ThermometerSun, Droplets, Zap, Wind, Download, X, Calendar } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import * as XLSX from "xlsx";

function Metric({ icon: Icon, label, value, unit }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/30 p-3 bg-card/40">
      <Icon className="h-5 w-5 text-primary" />
      <div>
        <div className="text-[10px] uppercase text-muted-foreground font-mono">{label}</div>
        <div className="text-lg font-mono font-bold">{value}<span className="text-xs text-muted-foreground ml-1">{unit}</span></div>
      </div>
    </div>
  );
}

function toNum(v) {
  if (v == null || v === '' || v === undefined) return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

function computeStats(rows) {
  if (!rows || rows.length === 0) return null;
  
  const tcores = rows.map(r => toNum(r.tcore)).filter(v => v !== null);
  const tskins = rows.map(r => toNum(r.tskin)).filter(v => v !== null);
  const hums = rows.map(r => toNum(r.humidity)).filter(v => v !== null);
  const bats = rows.map(r => toNum(r.batteryPct)).filter(v => v !== null);
  const probs = rows.map(r => toNum(r.stressProb)).filter(v => v !== null);
  const acts = rows.map(r => toNum(r.activityIndex)).filter(v => v !== null);
  
  const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
  
  return {
    totalRecords: rows.length,
    stressEvents: rows.filter(r => r.stressLevel === "high" || r.stressLevel === "critical").length,
    avgTcore: avg(tcores),
    avgTskin: avg(tskins),
    avgHumidity: avg(hums),
    avgBattery: avg(bats),
    maxTcore: tcores.length ? Math.max(...tcores) : null,
    minTcore: tcores.length ? Math.min(...tcores) : null,
    avgStressProb: avg(probs),
    avgActivity: avg(acts),
  };
}

function filterByTimeRange(rows, range) {
  if (!rows || range === "all") return rows;
  const now = new Date();
  let cutoff = new Date();
  switch (range) {
    case "hour": cutoff.setHours(now.getHours() - 1); break;
    case "6hours": cutoff.setHours(now.getHours() - 6); break;
    case "12hours": cutoff.setHours(now.getHours() - 12); break;
    case "day": cutoff.setDate(now.getDate() - 1); break;
    case "week": cutoff.setDate(now.getDate() - 7); break;
    case "month": cutoff.setMonth(now.getMonth() - 1); break;
    default: return rows;
  }
  return rows.filter(r => r.timestamp && new Date(r.timestamp) >= cutoff);
}

const metricMap = {
  temperature: { label: "Core temp", color: "hsl(var(--chart-1))", key: "tcore" },
  battery: { label: "Battery %", color: "hsl(var(--chart-2))", key: "batteryPct" },
  stress: { label: "Stress prob", color: "hsl(var(--chart-3))", key: "stressProb" },
  activity: { label: "Activity", color: "hsl(var(--chart-4))", key: "activityIndex" },
  humidity: { label: "Humidity", color: "hsl(var(--chart-5))", key: "humidity" },
};

export default function Telemetry() {
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [subjectSearch, setSubjectSearch] = useState("");
  const [metric, setMetric] = useState("temperature");
  const [search, setSearch] = useState("");
  const [timeRange, setTimeRange] = useState("all");
  
  const { data: rows, isLoading } = useQuery({ queryKey: ["telemetry"], queryFn: listTelemetry, refetchInterval: 15000 });
  const { data: subjects } = useQuery({ queryKey: ["subjects"], queryFn: listSubjects });

  const subjectOptions = useMemo(() => {
    const fromApi = subjects?.map(s => ({ id: s.id, name: s.name, deviceId: s.deviceId })) || [];
    const fromTelemetry = [];
    rows?.forEach(r => {
      if (r.deviceId && !fromTelemetry.find(x => x.deviceId === r.deviceId)) {
        fromTelemetry.push({ id: r.deviceId, name: `Device #${r.deviceId}`, deviceId: r.deviceId });
      }
    });
    return fromApi.length ? fromApi : fromTelemetry;
  }, [subjects, rows]);

  const filteredSubjects = subjectOptions.filter(s => 
    (s.name ?? '').toLowerCase().includes(subjectSearch.toLowerCase()) ||
    String(s.deviceId ?? '').includes(subjectSearch)
  );

  const subjectFilteredRows = useMemo(() => {
    if (selectedSubject === "all") return rows || [];
    const sub = subjectOptions.find(s => String(s.id) === selectedSubject);
    if (!sub) return rows || [];
    const subId = Number(sub.id);
    const subDeviceId = Number(sub.deviceId);
    return (rows || []).filter(r => 
      r.deviceId === sub.deviceId || 
      r.deviceId === subDeviceId ||
      r.deviceId === sub.id ||
      r.subjectId === sub.id ||
      r.subjectId === subId
    );
  }, [rows, selectedSubject, subjectOptions]);

  const timeFilteredRows = useMemo(() => {
    return filterByTimeRange(subjectFilteredRows, timeRange);
  }, [subjectFilteredRows, timeRange]);

  const filtered = timeFilteredRows.filter((r) =>
    String(r.deviceId ?? '').includes(search) ||
    (r.stressLevel ?? '').toLowerCase().includes(search.toLowerCase()) ||
    String(r.tcore ?? '').includes(search)
  );

  const chartData = useMemo(() => {
    let data = rows || [];
    if (selectedSubject !== "all") {
      const sub = subjectOptions.find(s => String(s.id) === selectedSubject);
      if (sub) {
        const subId = Number(sub.id);
        const subDeviceId = Number(sub.deviceId);
        data = data.filter(r => 
          r.deviceId === sub.deviceId || 
          r.deviceId === subDeviceId ||
          r.deviceId === sub.id ||
          r.subjectId === sub.id ||
          r.subjectId === subId
        );
      }
    }
    data = filterByTimeRange(data, timeRange);
    const key = metricMap[metric].key;
    return data.map(r => ({
      timestamp: r.timestamp,
      value: toNum(r[key]),
    })).filter(d => d.value !== null);
  }, [rows, selectedSubject, timeRange, metric, subjectOptions]);

  const stats = computeStats(timeFilteredRows);

  const formatMetricValue = (val) => {
    if (val == null || isNaN(val)) return "—";
    return val.toFixed(2);
  };

  const handleDownload = () => {
    const data = filtered.map(r => ({
      Timestamp: r.timestamp ? new Date(r.timestamp).toISOString() : '',
      DeviceID: r.deviceId ?? '',
      Tcore_C: r.tcore ?? '',
      Tskin_C: r.tskin ?? '',
      Tamb_C: r.tamb ?? '',
      Humidity_pct: r.humidity ?? '',
      ActivityIndex: r.activityIndex ?? '',
      StressLevel: r.stressLevel ?? '',
      StressProb: r.stressProb ?? '',
      Battery_pct: r.batteryPct ?? '',
      BatteryVoltage: r.batteryVoltage ?? '',
      GPSValid: r.gpsValid ? 'Yes' : 'No',
      Latitude: r.latitude ?? '',
      Longitude: r.longitude ?? '',
      Altitude: r.altitude ?? '',
      Hyperthermia: r.hyperthermia ? 'Yes' : 'No',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Telemetry");
    const subjectName = selectedSubject === "all" ? "all-subjects" : subjectOptions.find(s => String(s.id) === selectedSubject)?.name?.replace(/\s+/g, '_') || `subject-${selectedSubject}`;
    const rangeLabel = timeRange === "all" ? "all-time" : timeRange;
    XLSX.writeFile(wb, `telemetry_${subjectName}_${rangeLabel}_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 anime-fade-in">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-mono font-bold tracking-tight">TELEMETRY</h1>
          <p className="text-muted-foreground font-mono text-sm">Ingested LoRa packets and real-time vitals</p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-36 font-mono text-xs">
              <Calendar className="h-3.5 w-3.5 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="font-mono text-xs">All time</SelectItem>
              <SelectItem value="hour" className="font-mono text-xs">Last hour</SelectItem>
              <SelectItem value="6hours" className="font-mono text-xs">Last 6 hours</SelectItem>
              <SelectItem value="12hours" className="font-mono text-xs">Last 12 hours</SelectItem>
              <SelectItem value="day" className="font-mono text-xs">Last 24 hours</SelectItem>
              <SelectItem value="week" className="font-mono text-xs">Last 7 days</SelectItem>
              <SelectItem value="month" className="font-mono text-xs">Last 30 days</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative">
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-56 font-mono text-xs">
                <SelectValue placeholder="All Subjects" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                <div className="p-2 sticky top-0 bg-popover z-10 border-b border-border/50">
                  <div className="relative">
                    <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input 
                      placeholder="Search subjects..." 
                      value={subjectSearch}
                      onChange={(e) => setSubjectSearch(e.target.value)}
                      className="pl-7 h-8 text-xs font-mono"
                      onKeyDown={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
                <SelectItem value="all" className="font-mono text-xs">All Subjects</SelectItem>
                {filteredSubjects.map(s => (
                  <SelectItem key={s.id} value={String(s.id)} className="font-mono text-xs">
                    #{s.deviceId} — {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search telemetry..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 font-mono w-48 text-xs" />
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            className="font-mono text-xs gap-2" 
            onClick={handleDownload}
            disabled={!filtered?.length}
          >
            <Download className="h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Metric icon={ThermometerSun} label="Avg Tcore" value={formatMetricValue(stats?.avgTcore)} unit="°C" />
        <Metric icon={ThermometerSun} label="Avg Tskin" value={formatMetricValue(stats?.avgTskin)} unit="°C" />
        <Metric icon={Wind} label="Avg Humidity" value={stats?.avgHumidity != null ? stats.avgHumidity.toFixed(1) : "—"} unit="%" />
        <Metric icon={Zap} label="Avg Battery" value={stats?.avgBattery != null ? stats.avgBattery.toFixed(0) : "—"} unit="%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-card/50 backdrop-blur border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-mono text-lg flex items-center gap-2"><Activity className="h-5 w-5" /> Trend</CardTitle>
            <Select value={metric} onValueChange={setMetric}>
              <SelectTrigger className="w-40 font-mono"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="temperature">Temperature</SelectItem>
                <SelectItem value="battery">Battery</SelectItem>
                <SelectItem value="stress">Stress</SelectItem>
                <SelectItem value="activity">Activity</SelectItem>
                <SelectItem value="humidity">Humidity</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="timestamp" tickFormatter={(t) => t ? new Date(t).toLocaleTimeString() : ''} minTickGap={30} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="value" name={metricMap[metric].label} stroke={metricMap[metric].color} strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {chartData.length === 0 && (
              <div className="text-center text-xs text-muted-foreground font-mono py-4">No data for selected subject/time range</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader>
            <CardTitle className="font-mono text-lg">Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 font-mono text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Records</span><span className="font-bold">{stats?.totalRecords ?? "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Stress events</span><span className="font-bold">{stats?.stressEvents ?? "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Max Tcore</span><span className="font-bold">{formatMetricValue(stats?.maxTcore)}°C</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Min Tcore</span><span className="font-bold">{formatMetricValue(stats?.minTcore)}°C</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Avg stress prob</span><span className="font-bold">{stats?.avgStressProb != null ? (stats.avgStressProb * 100).toFixed(0) : "—"}%</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Avg activity</span><span className="font-bold">{formatMetricValue(stats?.avgActivity)}</span></div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-mono text-lg flex items-center gap-2"><Droplets className="h-5 w-5" /> Recent Packets</CardTitle>
          <div className="flex items-center gap-3">
            {timeRange !== "all" && (
              <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                <Calendar className="h-3 w-3" /> {timeRange}
              </span>
            )}
            {selectedSubject !== "all" && (
              <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                {subjectOptions.find(s => String(s.id) === selectedSubject)?.name || `Subject ${selectedSubject}`}
                <button onClick={() => setSelectedSubject("all")} className="hover:text-foreground"><X className="h-3 w-3" /></button>
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="font-mono">TIME</TableHead>
                  <TableHead className="font-mono">DEVICE</TableHead>
                  <TableHead className="font-mono">TCORE</TableHead>
                  <TableHead className="font-mono">TSKIN</TableHead>
                  <TableHead className="font-mono">TAMB</TableHead>
                  <TableHead className="font-mono">HUM</TableHead>
                  <TableHead className="font-mono">ACTIVITY</TableHead>
                  <TableHead className="font-mono">STRESS</TableHead>
                  <TableHead className="font-mono">BATT</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
                ) : filtered?.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground font-mono">No telemetry records.</TableCell></TableRow>
                ) : (
                  filtered?.slice(0, 50).map((r) => (
                    <TableRow key={r.id} className="font-mono">
                      <TableCell className="text-xs text-muted-foreground">{r.timestamp ? new Date(r.timestamp).toLocaleTimeString() : '—'}</TableCell>
                      <TableCell>#{r.deviceId ?? '—'}</TableCell>
                      <TableCell className={r.tcore > 40 ? "text-destructive font-bold" : ""}>{r.tcore != null ? Number(r.tcore).toFixed(1) : '—'}°C</TableCell>
                      <TableCell>{r.tskin != null ? Number(r.tskin).toFixed(2) : '—'}°C</TableCell>
                      <TableCell>{r.tamb != null ? Number(r.tamb).toFixed(2) : '—'}°C</TableCell>
                      <TableCell>{r.humidity != null ? Number(r.humidity).toFixed(1) : '—'}%</TableCell>
                      <TableCell>{r.activityIndex != null ? Number(r.activityIndex).toFixed(2) : '—'}</TableCell>
                      <TableCell><Badge className={r.stressLevel === "critical" ? "bg-destructive/20 text-destructive" : r.stressLevel === "high" ? "bg-orange-500/20 text-orange-500" : r.stressLevel === "moderate" ? "bg-amber-500/20 text-amber-500" : "bg-emerald-500/20 text-emerald-500"}>{r.stressLevel ?? '—'}</Badge></TableCell>
                      <TableCell className={r.batteryPct < 20 ? "text-destructive" : ""}>{r.batteryPct != null ? `${r.batteryPct}%` : '—'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}