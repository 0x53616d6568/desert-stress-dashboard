import { useMemo, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { getLiveFeed } from "@/services/api";
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from "react-leaflet";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, Wifi, WifiOff, Search, ChevronRight, ChevronLeft, Crosshair, Thermometer, Droplets, Zap, Activity, Battery, Navigation } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

function FlyToSubject({ target }) {
  const map = useMap();
  useMemo(() => {
    if (target) {
      map.flyTo([target.lat, target.lng], 16, { duration: 1.5 });
    }
  }, [map, target]);
  return null;
}

function Bounds({ points }) {
  const map = useMap();
  useMemo(() => {
    if (points.length > 0) {
      const group = L.featureGroup(points.map((p) => L.marker([p.lat, p.lng])));
      map.fitBounds(group.getBounds().pad(0.1), { animate: true });
    }
  }, [map, points]);
  return null;
}

function LocateMeButton() {
  const map = useMap();
  const [locating, setLocating] = useState(false);

  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        map.flyTo([latitude, longitude], 16, { duration: 1.5 });
        L.marker([latitude, longitude], {
          icon: L.divIcon({
            html: `<div style="width:16px;height:16px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 0 0 3px #3b82f6;"></div>`,
            className: "",
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          }),
        }).addTo(map).bindPopup("You are here").openPopup();
        setLocating(false);
      },
      (err) => {
        alert(`Location error: ${err.message}`);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [map]);

  return (
    <Button
      variant="secondary"
      size="icon"
      className="absolute bottom-6 left-6 z-[1000] shadow-lg bg-card/90 backdrop-blur border border-border/50 hover:bg-card"
      onClick={handleLocate}
      disabled={locating}
    >
      {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crosshair className="h-4 w-4" />}
    </Button>
  );
}

function makeIcon(level, isOnline) {
  const color =
    level === "critical" ? "#ef4444" :
    level === "high" ? "#f97316" :
    level === "moderate" ? "#f59e0b" : "#10b981";
  const pulse = isOnline ? "" : "opacity-50";
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" class="${pulse}">
      <circle cx="12" cy="12" r="11" fill="${color}" stroke="white" stroke-width="2" fill-opacity="0.9"/>
      <circle cx="12" cy="12" r="6" fill="white"/>
      ${isOnline ? `<circle cx="12" cy="12" r="11" fill="none" stroke="${color}" stroke-width="1" opacity="0.4">
        <animate attributeName="r" from="11" to="18" dur="2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" from="0.6" to="0" dur="2s" repeatCount="indefinite"/>
      </circle>` : ''}
    </svg>`;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

function SubjectTooltip({ subject }) {
  const stressColor =
    subject.stressLevel === "critical" ? "text-destructive" :
    subject.stressLevel === "high" ? "text-orange-500" :
    subject.stressLevel === "moderate" ? "text-amber-500" : "text-emerald-500";

  return (
    <div className="font-mono min-w-[220px]">
      <div className="font-bold text-sm mb-2 border-b border-border/30 pb-1">
        {subject.subjectName ?? `Subject #${subject.subjectId}`}
      </div>
      
      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground flex items-center gap-1">
            <Navigation className="h-3 w-3" /> ID
          </span>
          <span className="font-medium">#{subject.subjectId}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3" /> Type
          </span>
          <span className="uppercase font-medium">{subject.subjectType ?? '—'}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-muted-foreground flex items-center gap-1">
            {subject.isOnline ? <Wifi className="h-3 w-3 text-emerald-500" /> : <WifiOff className="h-3 w-3 text-red-500" />}
            Status
          </span>
          <span className={subject.isOnline ? "text-emerald-500" : "text-red-500"}>
            {subject.isOnline ? "Online" : "Offline"}
          </span>
        </div>

        <div className="border-t border-border/30 pt-1.5 mt-1.5 space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground flex items-center gap-1">
              <Thermometer className="h-3 w-3" /> Tcore
            </span>
            <span className="font-bold">{subject.tcore != null ? `${Number(subject.tcore).toFixed(2)}°C` : '—'}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground flex items-center gap-1">
              <Thermometer className="h-3 w-3" /> Tskin
            </span>
            <span>{subject.tskin != null ? `${Number(subject.tskin).toFixed(2)}°C` : '—'}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground flex items-center gap-1">
              <Thermometer className="h-3 w-3" /> Tamb
            </span>
            <span>{subject.tamb != null ? `${Number(subject.tamb).toFixed(2)}°C` : '—'}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground flex items-center gap-1">
              <Droplets className="h-3 w-3" /> Humidity
            </span>
            <span>{subject.humidity != null ? `${Number(subject.humidity).toFixed(1)}%` : '—'}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground flex items-center gap-1">
              <Activity className="h-3 w-3" /> Activity
            </span>
            <span>{subject.activityIndex != null ? Number(subject.activityIndex).toFixed(2) : '—'}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground flex items-center gap-1">
              <Zap className="h-3 w-3" /> Stress Prob
            </span>
            <span className={stressColor + " font-bold"}>
              {subject.stressProb != null ? `${(subject.stressProb * 100).toFixed(1)}%` : '—'}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-muted-foreground flex items-center gap-1">
              <Battery className="h-3 w-3" /> Battery
            </span>
            <span className={subject.batteryPct < 20 ? "text-destructive font-bold" : ""}>
              {subject.batteryPct != null ? `${subject.batteryPct}%` : '—'}
            </span>
          </div>
        </div>

        <div className="border-t border-border/30 pt-1.5 mt-1.5">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Stress Level</span>
            <Badge className={`text-[10px] px-1.5 py-0 h-5 ${
              subject.stressLevel === "critical" ? "bg-destructive/20 text-destructive" :
              subject.stressLevel === "high" ? "bg-orange-500/20 text-orange-500" :
              subject.stressLevel === "moderate" ? "bg-amber-500/20 text-amber-500" :
              "bg-emerald-500/20 text-emerald-500"
            }`}>
              {subject.stressLevel ?? '—'}
            </Badge>
          </div>
        </div>

        {subject.hyperthermia && (
          <div className="bg-destructive/10 text-destructive text-center py-1 rounded text-[10px] font-bold mt-1">
            ⚠ HYPERTHERMIA DETECTED
          </div>
        )}
      </div>
    </div>
  );
}

export default function MapPage() {
  const { data, isLoading } = useQuery({ queryKey: ["live-feed"], queryFn: getLiveFeed, refetchInterval: 10000 });
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [flyTarget, setFlyTarget] = useState(null);

  const points = useMemo(() =>
    data?.filter((p) => p.latitude && p.longitude).map((p) => ({
      lat: p.latitude,
      lng: p.longitude,
      subject: p,
    })) || [],
  [data]);

  const filteredSubjects = useMemo(() => {
    if (!search.trim()) return points;
    const q = search.toLowerCase();
    return points.filter((p) =>
      (p.subject.subjectName ?? '').toLowerCase().includes(q) ||
      String(p.subject.subjectId ?? '').includes(q)
    );
  }, [points, search]);

  const center = points.length > 0 ? [points[0].lat, points[0].lng] : [24.4539, 54.3773];

  return (
    <div className="p-6 h-full anime-fade-in">
      <div className="mb-4">
        <h1 className="text-3xl font-mono font-bold tracking-tight">LIVE MAP</h1>
        <p className="text-muted-foreground font-mono text-sm">Real-time subject positions and stress state</p>
      </div>
      <Card className="h-[calc(100%-80px)] border-border/50 bg-card/50 overflow-hidden">
        <CardContent className="p-0 h-full relative flex">
          {/* Map */}
          <div className="flex-1 relative">
            {isLoading ? (
              <div className="h-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : (
              <MapContainer center={center} zoom={15} className="h-full w-full z-0">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
                <Bounds points={points} />
                <FlyToSubject target={flyTarget} />
                <LocateMeButton />
                {points.map((p) => (
                  <Marker 
                    key={p.subject.subjectId} 
                    position={[p.lat, p.lng]} 
                    icon={makeIcon(p.subject.stressLevel, p.subject.isOnline)}
                  >
                    <Tooltip 
                      direction="top" 
                      offset={[0, -20]} 
                      className="bg-card border border-border/50 shadow-xl rounded-lg"
                      opacity={1}
                    >
                      <SubjectTooltip subject={p.subject} />
                    </Tooltip>
                    <Popup className="font-mono">
                      <div className="space-y-1">
                        <div className="font-bold">{p.subject.subjectName ?? `Subject #${p.subject.subjectId}`}</div>
                        <div className="text-xs text-muted-foreground uppercase">{p.subject.subjectType ?? '—'}</div>
                        <div className="flex items-center gap-2 text-xs">
                          {p.subject.isOnline ? <Wifi className="h-3 w-3 text-emerald-500" /> : <WifiOff className="h-3 w-3 text-red-500" />}
                          <span>{p.subject.isOnline ? "Online" : "Offline"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={p.subject.stressLevel === "critical" ? "bg-destructive/20 text-destructive" : p.subject.stressLevel === "high" ? "bg-orange-500/20 text-orange-500" : p.subject.stressLevel === "moderate" ? "bg-amber-500/20 text-amber-500" : "bg-emerald-500/20 text-emerald-500"}>
                            {p.subject.stressLevel ?? '—'}
                          </Badge>
                          <span className="text-xs">Tcore {p.subject.tcore != null ? Number(p.subject.tcore).toFixed(2) : '—'}°C</span>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            )}
          </div>

          {/* Toggle sidebar button (now on left edge of sidebar) */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 z-[1000] bg-card/80 backdrop-blur border border-border/50 hover:bg-card shadow-sm"
            style={{ right: sidebarOpen ? 'calc(18rem + 4px)' : '4px' }}
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>

          {/* Right Sidebar */}
          <div className={`flex flex-col border-l border-border/50 bg-background/95 backdrop-blur transition-all duration-300 ${sidebarOpen ? 'w-72' : 'w-0 overflow-hidden'}`}>
            <div className="p-4 border-b border-border/50 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-mono font-bold text-sm">SUBJECTS</h2>
                <span className="text-xs text-muted-foreground font-mono">{filteredSubjects.length}</span>
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 font-mono text-xs h-8"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredSubjects.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground font-mono">No subjects found</div>
              ) : (
                filteredSubjects.map((p) => (
                  <button
                    key={p.subject.subjectId}
                    onClick={() => setFlyTarget({ lat: p.lat, lng: p.lng, id: p.subject.subjectId })}
                    className="w-full text-left p-3 border-b border-border/30 hover:bg-muted/50 transition-colors flex items-center gap-3"
                  >
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <div className="font-mono text-sm font-medium truncate">{p.subject.subjectName ?? `Subject #${p.subject.subjectId}`}</div>
                      <div className="flex items-center gap-2 mt-1">
                        {p.subject.isOnline ? <Wifi className="h-3 w-3 text-emerald-500" /> : <WifiOff className="h-3 w-3 text-red-500" />}
                        <Badge className={`text-[10px] px-1.5 py-0 h-4 ${
                          p.subject.stressLevel === "critical" ? "bg-destructive/20 text-destructive" :
                          p.subject.stressLevel === "high" ? "bg-orange-500/20 text-orange-500" :
                          p.subject.stressLevel === "moderate" ? "bg-amber-500/20 text-amber-500" :
                          "bg-emerald-500/20 text-emerald-500"
                        }`}>
                          {p.subject.stressLevel ?? '—'}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {p.subject.tcore != null ? `${Number(p.subject.tcore).toFixed(1)}°C` : '—'}
                        </span>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}