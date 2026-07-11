import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listSubjects, createSubject, updateSubject, deleteSubject } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Edit2, Loader2, Users, Search } from "lucide-react";
import { toast } from "sonner";

const emptySubject = { name: "", type: "camel", status: "active", deviceId: "", notes: "" };

export default function Subjects() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["subjects"], queryFn: listSubjects });
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptySubject);

  const createMutation = useMutation({
    mutationFn: createSubject,
    onSuccess: () => {
      toast.success("Subject created");
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      closeDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }) => updateSubject(id, body),
    onSuccess: () => {
      toast.success("Subject updated");
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      closeDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSubject,
    onSuccess: () => {
      toast.success("Subject deleted");
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
    },
  });

  const closeDialog = () => {
    setOpen(false);
    setEditing(null);
    setForm(emptySubject);
  };

  const onEdit = (subject) => {
    setEditing(subject);
    setForm({ ...subject, deviceId: subject.deviceId ?? "" });
    setOpen(true);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    const body = { ...form, deviceId: form.deviceId ? Number(form.deviceId) : null };
    if (editing) updateMutation.mutate({ id: editing.id, body });
    else createMutation.mutate(body);
  };

  const filtered = data?.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.type.toLowerCase().includes(search.toLowerCase()) ||
    (s.notes && s.notes.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 anime-fade-in">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-mono font-bold tracking-tight">SUBJECTS</h1>
          <p className="text-muted-foreground font-mono text-sm">Manage camels and human operators</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search subjects..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 font-mono w-64" />
          </div>
          <Button onClick={() => setOpen(true)} className="font-mono"><Plus className="mr-2 h-4 w-4" /> ADD SUBJECT</Button>
        </div>
      </div>

      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle className="font-mono text-lg flex items-center gap-2"><Users className="h-5 w-5" /> Registry</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="font-mono">NAME</TableHead>
                  <TableHead className="font-mono">TYPE</TableHead>
                  <TableHead className="font-mono">STATUS</TableHead>
                  <TableHead className="font-mono">DEVICE</TableHead>
                  <TableHead className="font-mono">NOTES</TableHead>
                  <TableHead className="font-mono text-right">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
                ) : filtered?.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground font-mono">No subjects found.</TableCell></TableRow>
                ) : (
                  filtered?.map((s) => (
                    <TableRow key={s.id} className="font-mono">
                      <TableCell className="font-bold">{s.name}</TableCell>
                      <TableCell><Badge variant="outline" className="uppercase">{s.type}</Badge></TableCell>
                      <TableCell><Badge className={s.status === "active" ? "bg-emerald-500/20 text-emerald-500" : "bg-muted text-muted-foreground"}>{s.status}</Badge></TableCell>
                      <TableCell className="text-muted-foreground">{s.deviceId ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{s.notes || "—"}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => onEdit(s)}><Edit2 className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => { if (confirm("Delete subject?")) deleteMutation.mutate(s.id); }}><Trash2 className="h-4 w-4" /></Button>
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
          <DialogHeader><DialogTitle>{editing ? "Edit Subject" : "Add Subject"}</DialogTitle></DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="camel">Camel</SelectItem><SelectItem value="human">Human</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1"><Label>Device ID</Label><Input type="number" value={form.deviceId} onChange={(e) => setForm({ ...form, deviceId: e.target.value })} /></div>
            <div className="space-y-1"><Label>Notes</Label><Input value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
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
