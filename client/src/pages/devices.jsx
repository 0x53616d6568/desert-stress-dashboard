import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listDevices, createDevice, updateDevice, deleteDevice } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Edit2, Loader2, Cpu, Search, Battery } from "lucide-react";
import { toast } from "sonner";

const emptyDevice = { macAddress: "", name: "", status: "offline", firmwareVersion: "", subjectId: "", batteryLevel: "" };

export default function Devices() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["devices"], queryFn: listDevices });
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyDevice);

  const createMutation = useMutation({
    mutationFn: createDevice,
    onSuccess: () => { toast.success("Device created"); queryClient.invalidateQueries({ queryKey: ["devices"] }); closeDialog(); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, body }) => updateDevice(id, body),
    onSuccess: () => { toast.success("Device updated"); queryClient.invalidateQueries({ queryKey: ["devices"] }); closeDialog(); },
  });
  const deleteMutation = useMutation({
    mutationFn: deleteDevice,
    onSuccess: () => { toast.success("Device deleted"); queryClient.invalidateQueries({ queryKey: ["devices"] }); },
  });

  const closeDialog = () => { setOpen(false); setEditing(null); setForm(emptyDevice); };
  const onEdit = (d) => { setEditing(d); setForm({ ...d, subjectId: d.subjectId ?? "", batteryLevel: d.batteryLevel ?? "" }); setOpen(true); };
  const onSubmit = (e) => {
    e.preventDefault();
    const body = { ...form, subjectId: form.subjectId ? Number(form.subjectId) : null, batteryLevel: form.batteryLevel ? Number(form.batteryLevel) : null };
    if (editing) updateMutation.mutate({ id: editing.id, body });
    else createMutation.mutate(body);
  };

  const filtered = data?.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.macAddress.toLowerCase().includes(search.toLowerCase()) ||
    (d.firmwareVersion && d.firmwareVersion.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 anime-fade-in">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-mono font-bold tracking-tight">DEVICES</h1>
          <p className="text-muted-foreground font-mono text-sm">Manage ESP32-S3 LoRa nodes</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search devices..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 font-mono w-64" />
          </div>
          <Button onClick={() => setOpen(true)} className="font-mono"><Plus className="mr-2 h-4 w-4" /> ADD DEVICE</Button>
        </div>
      </div>

      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle className="font-mono text-lg flex items-center gap-2"><Cpu className="h-5 w-5" /> Node Registry</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="font-mono">NAME / MAC</TableHead>
                  <TableHead className="font-mono">STATUS</TableHead>
                  <TableHead className="font-mono">FIRMWARE</TableHead>
                  <TableHead className="font-mono">BATTERY</TableHead>
                  <TableHead className="font-mono">LAST SEEN</TableHead>
                  <TableHead className="font-mono text-right">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
                ) : filtered?.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground font-mono">No devices found.</TableCell></TableRow>
                ) : (
                  filtered?.map((d) => (
                    <TableRow key={d.id} className="font-mono">
                      <TableCell>
                        <div className="font-bold">{d.name}</div>
                        <div className="text-xs text-muted-foreground">{d.macAddress}</div>
                      </TableCell>
                      <TableCell>
                        <Badge className={d.status === "online" ? "bg-emerald-500/20 text-emerald-500" : d.status === "maintenance" ? "bg-amber-500/20 text-amber-500" : "bg-muted text-muted-foreground"}>{d.status}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{d.firmwareVersion || "—"}</TableCell>
                      <TableCell>
                        <span className={d.batteryLevel < 20 ? "text-destructive" : "text-muted-foreground"}>
                          <Battery className="inline h-3 w-3 mr-1" />{d.batteryLevel ?? "—"}%
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">{d.lastSeen ? new Date(d.lastSeen).toLocaleString() : "—"}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => onEdit(d)}><Edit2 className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => { if (confirm("Delete device?")) deleteMutation.mutate(d.id); }}><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={closeDialog}>
        <DialogContent className="font-mono">
          <DialogHeader><DialogTitle>{editing ? "Edit Device" : "Add Device"}</DialogTitle></DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="space-y-1"><Label>MAC Address</Label><Input value={form.macAddress} onChange={(e) => setForm({ ...form, macAddress: e.target.value })} required /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="online">Online</SelectItem><SelectItem value="offline">Offline</SelectItem><SelectItem value="maintenance">Maintenance</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Battery %</Label><Input type="number" value={form.batteryLevel} onChange={(e) => setForm({ ...form, batteryLevel: e.target.value })} /></div>
            </div>
            <div className="space-y-1"><Label>Firmware Version</Label><Input value={form.firmwareVersion} onChange={(e) => setForm({ ...form, firmwareVersion: e.target.value })} /></div>
            <div className="space-y-1"><Label>Subject ID</Label><Input type="number" value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })} /></div>
            <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editing ? "UPDATE" : "CREATE"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
