import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listAlerts, acknowledgeAlert } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Bell, Loader2, CheckCircle, Search, AlertTriangle, ShieldAlert, Info } from "lucide-react";
import { toast } from "sonner";

const icons = {
  high_stress: AlertTriangle,
  critical_stress: ShieldAlert,
  hyperthermia: AlertTriangle,
  low_battery: AlertTriangle,
  device_offline: Info,
  gateway_disconnected: Info,
};

export default function Alerts() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("false");
  const [search, setSearch] = useState("");
  const { data, isLoading } = useQuery({ queryKey: ["alerts", filter], queryFn: () => listAlerts({ acknowledged: filter, limit: 100 }), refetchInterval: 10000 });
  const ackMutation = useMutation({
    mutationFn: acknowledgeAlert,
    onSuccess: () => { toast.success("Alert acknowledged"); queryClient.invalidateQueries({ queryKey: ["alerts"] }); },
  });

  const filtered = data?.filter((a) =>
    a.message.toLowerCase().includes(search.toLowerCase()) ||
    a.type.toLowerCase().includes(search.toLowerCase()) ||
    String(a.deviceId).includes(search)
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 anime-fade-in">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-mono font-bold tracking-tight">ALERTS</h1>
          <p className="text-muted-foreground font-mono text-sm">System-wide critical and warning notifications</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search alerts..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 font-mono w-64" />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40 font-mono"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="false">Pending</SelectItem>
              <SelectItem value="true">Acknowledged</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle className="font-mono text-lg flex items-center gap-2"><Bell className="h-5 w-5" /> Alert Registry</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="font-mono">SEVERITY</TableHead>
                  <TableHead className="font-mono">TYPE</TableHead>
                  <TableHead className="font-mono">MESSAGE</TableHead>
                  <TableHead className="font-mono">DEVICE</TableHead>
                  <TableHead className="font-mono">TIME</TableHead>
                  <TableHead className="font-mono text-right">STATUS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
                ) : filtered?.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground font-mono">No alerts found.</TableCell></TableRow>
                ) : (
                  filtered?.map((a) => {
                    const Icon = icons[a.type] || Info;
                    return (
                      <TableRow key={a.id} className="font-mono">
                        <TableCell>
                          <Badge className={a.severity === "critical" ? "bg-destructive/20 text-destructive" : a.severity === "warning" ? "bg-amber-500/20 text-amber-500" : "bg-blue-500/20 text-blue-500"}>
                            <Icon className="h-3 w-3 mr-1" />{a.severity}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs uppercase">{a.type.replace(/_/g, " ")}</TableCell>
                        <TableCell className="font-semibold">{a.message}</TableCell>
                        <TableCell>#{a.deviceId}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          {a.acknowledged ? (
                            <Badge variant="outline" className="text-emerald-500 border-emerald-500"><CheckCircle className="h-3 w-3 mr-1" />ACK</Badge>
                          ) : (
                            <Button size="sm" className="font-mono" onClick={() => ackMutation.mutate(a.id)} disabled={ackMutation.isPending}>ACK</Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
