import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listFirmwareVersions, createFirmwareVersion, updateFirmwareVersion, deleteFirmwareVersion } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Edit2, Loader2, HardDrive, Search, Cpu } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const emptyFirmware = { version: "", fixesApplied: "", changelog: "" };

export default function Firmware() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["firmware"], queryFn: listFirmwareVersions });
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyFirmware);

  const createMutation = useMutation({
    mutationFn: createFirmwareVersion,
    onSuccess: () => { toast.success("Firmware created"); queryClient.invalidateQueries({ queryKey: ["firmware"] }); closeDialog(); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, body }) => updateFirmwareVersion(id, body),
    onSuccess: () => { toast.success("Firmware updated"); queryClient.invalidateQueries({ queryKey: ["firmware"] }); closeDialog(); },
  });
  const deleteMutation = useMutation({
    mutationFn: deleteFirmwareVersion,
    onSuccess: () => { toast.success("Firmware deleted"); queryClient.invalidateQueries({ queryKey: ["firmware"] }); },
  });

  const closeDialog = () => { setOpen(false); setEditing(null); setForm(emptyFirmware); };
  const onEdit = (f) => { setEditing(f); setForm({ ...f, fixesApplied: Array.isArray(f.fixesApplied) ? f.fixesApplied.join("\n") : f.fixesApplied }); setOpen(true); };
  const onSubmit = (e) => {
    e.preventDefault();
    const body = { ...form, fixesApplied: form.fixesApplied.split("\n").map((s) => s.trim()).filter(Boolean) };
    if (editing) updateMutation.mutate({ id: editing.id, body });
    else createMutation.mutate(body);
  };

  const filtered = data?.filter((f) =>
    f.version.toLowerCase().includes(search.toLowerCase()) ||
    (f.changelog && f.changelog.toLowerCase().includes(search.toLowerCase())) ||
    (Array.isArray(f.fixesApplied) ? f.fixesApplied.join(" ") : f.fixesApplied).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 anime-fade-in">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-mono font-bold tracking-tight">FIRMWARE</h1>
          <p className="text-muted-foreground font-mono text-sm">Version registry and patch notes</p>
        </div>
        <div className="flex w-full flex-col sm:flex-row gap-2 sm:items-center sm:justify-end">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search firmware..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 font-mono w-full sm:w-64" />
          </div>
          <Button onClick={() => setOpen(true)} className="font-mono w-full sm:w-auto"><Plus className="mr-2 h-4 w-4" /> ADD VERSION</Button>
        </div>
      </div>

      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle className="font-mono text-lg flex items-center gap-2"><HardDrive className="h-5 w-5" /> Firmware Registry</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="font-mono">VERSION</TableHead>
                  <TableHead className="font-mono">RELEASE DATE</TableHead>
                  <TableHead className="font-mono">FIXES APPLIED</TableHead>
                  <TableHead className="font-mono">DEVICES</TableHead>
                  <TableHead className="font-mono text-right">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
                ) : filtered?.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground font-mono">No firmware versions found.</TableCell></TableRow>
                ) : (
                  filtered?.map((f) => (
                    <TableRow key={f.id} className="font-mono">
                      <TableCell className="font-bold">{f.version}</TableCell>
                      <TableCell className="text-muted-foreground">{new Date(f.releaseDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(Array.isArray(f.fixesApplied) ? f.fixesApplied : []).map((fix, i) => (
                            <Badge key={i} variant="outline" className="text-xs">{fix}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell><span className="flex items-center gap-1"><Cpu className="h-3 w-3" />{f.deviceCount ?? 0}</span></TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => onEdit(f)}><Edit2 className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => { if (confirm("Delete firmware version?")) deleteMutation.mutate(f.id); }}><Trash2 className="h-4 w-4" /></Button>
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
        <DialogContent className="font-mono max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit Firmware" : "Add Firmware Version"}</DialogTitle></DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1"><Label>Version</Label><Input value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} required /></div>
            <div className="space-y-1"><Label>Fixes Applied (one per line)</Label><Textarea value={form.fixesApplied} onChange={(e) => setForm({ ...form, fixesApplied: e.target.value })} rows={3} /></div>
            <div className="space-y-1"><Label>Changelog</Label><Textarea value={form.changelog} onChange={(e) => setForm({ ...form, changelog: e.target.value })} rows={3} /></div>
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
