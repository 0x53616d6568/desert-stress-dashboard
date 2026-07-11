import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listDatasets, createDataset, updateDataset, deleteDataset } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Edit2, Loader2, Database, Search } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const emptyDataset = { name: "", type: "real", sampleCount: 0, stressClassBalance: 0.5, source: "", description: "" };

export default function Datasets() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["datasets"], queryFn: listDatasets });
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyDataset);

  const createMutation = useMutation({
    mutationFn: createDataset,
    onSuccess: () => { toast.success("Dataset created"); queryClient.invalidateQueries({ queryKey: ["datasets"] }); closeDialog(); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, body }) => updateDataset(id, body),
    onSuccess: () => { toast.success("Dataset updated"); queryClient.invalidateQueries({ queryKey: ["datasets"] }); closeDialog(); },
  });
  const deleteMutation = useMutation({
    mutationFn: deleteDataset,
    onSuccess: () => { toast.success("Dataset deleted"); queryClient.invalidateQueries({ queryKey: ["datasets"] }); },
  });

  const closeDialog = () => { setOpen(false); setEditing(null); setForm(emptyDataset); };
  const onEdit = (d) => { setEditing(d); setForm({ ...d }); setOpen(true); };
  const onSubmit = (e) => {
    e.preventDefault();
    if (editing) updateMutation.mutate({ id: editing.id, body: form });
    else createMutation.mutate(form);
  };

  const filtered = data?.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.type.toLowerCase().includes(search.toLowerCase()) ||
    d.source.toLowerCase().includes(search.toLowerCase()) ||
    (d.description && d.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 anime-fade-in">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-mono font-bold tracking-tight">DATASETS</h1>
          <p className="text-muted-foreground font-mono text-sm">Training and validation datasets</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search datasets..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 font-mono w-64" />
          </div>
          <Button onClick={() => setOpen(true)} className="font-mono"><Plus className="mr-2 h-4 w-4" /> ADD DATASET</Button>
        </div>
      </div>

      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle className="font-mono text-lg flex items-center gap-2"><Database className="h-5 w-5" /> Dataset Registry</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="font-mono">NAME</TableHead>
                  <TableHead className="font-mono">TYPE</TableHead>
                  <TableHead className="font-mono">SAMPLES</TableHead>
                  <TableHead className="font-mono">BALANCE</TableHead>
                  <TableHead className="font-mono">SOURCE</TableHead>
                  <TableHead className="font-mono text-right">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
                ) : filtered?.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground font-mono">No datasets found.</TableCell></TableRow>
                ) : (
                  filtered?.map((d) => (
                    <TableRow key={d.id} className="font-mono">
                      <TableCell className="font-bold">{d.name}</TableCell>
                      <TableCell><Badge variant="outline" className="uppercase">{d.type}</Badge></TableCell>
                      <TableCell>{d.sampleCount.toLocaleString()}</TableCell>
                      <TableCell>{(d.stressClassBalance * 100).toFixed(0)}%</TableCell>
                      <TableCell className="text-muted-foreground">{d.source}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => onEdit(d)}><Edit2 className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => { if (confirm("Delete dataset?")) deleteMutation.mutate(d.id); }}><Trash2 className="h-4 w-4" /></Button>
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
          <DialogHeader><DialogTitle>{editing ? "Edit Dataset" : "Add Dataset"}</DialogTitle></DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="space-y-1">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="real">Real</SelectItem>
                  <SelectItem value="camel">Camel</SelectItem>
                  <SelectItem value="human">Human</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Sample Count</Label><Input type="number" value={form.sampleCount} onChange={(e) => setForm({ ...form, sampleCount: Number(e.target.value) })} required /></div>
              <div className="space-y-1"><Label>Stress Balance</Label><Input type="number" step="0.01" value={form.stressClassBalance} onChange={(e) => setForm({ ...form, stressClassBalance: Number(e.target.value) })} required /></div>
            </div>
            <div className="space-y-1"><Label>Source</Label><Input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} required /></div>
            <div className="space-y-1"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
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
