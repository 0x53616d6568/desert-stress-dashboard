import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listAiModels, createAiModel, updateAiModel, deleteAiModel, deployAiModel } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Edit2, Loader2, BrainCircuit, Rocket, Search, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const emptyModel = { name: "", version: "", tcoreMae: 0, stressAuc: 0, nEstimators: 100, maxDepth: 6, stressThreshold: 0.5, stressProbCritical: 0.75, datasetId: "" };

export default function AiModels() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["ai-models"], queryFn: listAiModels });
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyModel);

  const createMutation = useMutation({
    mutationFn: createAiModel,
    onSuccess: () => { toast.success("Model created"); queryClient.invalidateQueries({ queryKey: ["ai-models"] }); closeDialog(); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, body }) => updateAiModel(id, body),
    onSuccess: () => { toast.success("Model updated"); queryClient.invalidateQueries({ queryKey: ["ai-models"] }); closeDialog(); },
  });
  const deleteMutation = useMutation({
    mutationFn: deleteAiModel,
    onSuccess: () => { toast.success("Model deleted"); queryClient.invalidateQueries({ queryKey: ["ai-models"] }); },
  });
  const deployMutation = useMutation({
    mutationFn: deployAiModel,
    onSuccess: () => { toast.success("Model deployed as primary"); queryClient.invalidateQueries({ queryKey: ["ai-models"] }); },
  });

  const closeDialog = () => { setOpen(false); setEditing(null); setForm(emptyModel); };
  const onEdit = (m) => { setEditing(m); setForm({ ...m, datasetId: m.datasetId ?? "" }); setOpen(true); };
  const onSubmit = (e) => {
    e.preventDefault();
    const body = { ...form, datasetId: form.datasetId ? Number(form.datasetId) : null };
    if (editing) updateMutation.mutate({ id: editing.id, body });
    else createMutation.mutate(body);
  };

  const filtered = data?.filter((m) =>
    (m.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (m.version ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 anime-fade-in">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-mono font-bold tracking-tight">AI MODELS</h1>
          <p className="text-muted-foreground font-mono text-sm">Register, edit, and deploy inference models</p>
        </div>
        <div className="flex w-full min-w-0 flex-col sm:flex-row gap-2 sm:items-center sm:justify-end">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search models..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 font-mono w-full sm:w-64" />
          </div>
          <Button onClick={() => setOpen(true)} className="font-mono w-full sm:w-auto"><Plus className="mr-2 h-4 w-4" /> ADD MODEL</Button>
        </div>
      </div>

      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle className="font-mono text-lg flex items-center gap-2"><BrainCircuit className="h-5 w-5" /> Model Registry</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="font-mono">NAME</TableHead>
                  <TableHead className="font-mono">VERSION</TableHead>
                  <TableHead className="font-mono">TCORE MAE</TableHead>
                  <TableHead className="font-mono">STRESS AUC</TableHead>
                  <TableHead className="font-mono">PRIMARY</TableHead>
                  <TableHead className="font-mono text-right">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
                ) : filtered?.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground font-mono">No models found.</TableCell></TableRow>
                ) : (
                  filtered?.map((m) => (
                    <TableRow key={m.id} className="font-mono">
                      <TableCell className="font-bold">{m.name ?? '—'}</TableCell>
                      <TableCell className="text-muted-foreground">{m.version ?? '—'}</TableCell>
                      <TableCell>{m.tcoreMae != null ? Number(m.tcoreMae).toFixed(3) : '—'}°C</TableCell>
                      <TableCell>{m.stressAuc != null ? Number(m.stressAuc).toFixed(3) : '—'}</TableCell>
                      <TableCell>
                        {m.isActive ? (
                          <Badge className="bg-emerald-500/20 text-emerald-500"><CheckCircle className="h-3 w-3 mr-1" />PRIMARY</Badge>
                        ) : (
                          <Button size="sm" variant="outline" className="font-mono text-xs" onClick={() => deployMutation.mutate(m.id)} disabled={deployMutation.isPending}>
                            <Rocket className="h-3 w-3 mr-1" />Deploy
                          </Button>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => onEdit(m)}><Edit2 className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => { if (confirm("Delete model?")) deleteMutation.mutate(m.id); }}><Trash2 className="h-4 w-4" /></Button>
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
          <DialogHeader><DialogTitle>{editing ? "Edit Model" : "Add Model"}</DialogTitle></DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="space-y-1"><Label>Version</Label><Input value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} required /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Tcore MAE</Label><Input type="number" step="0.001" value={form.tcoreMae} onChange={(e) => setForm({ ...form, tcoreMae: Number(e.target.value) })} required /></div>
              <div className="space-y-1"><Label>Stress AUC</Label><Input type="number" step="0.001" value={form.stressAuc} onChange={(e) => setForm({ ...form, stressAuc: Number(e.target.value) })} required /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label>N Estimators</Label><Input type="number" value={form.nEstimators} onChange={(e) => setForm({ ...form, nEstimators: Number(e.target.value) })} /></div>
              <div className="space-y-1"><Label>Max Depth</Label><Input type="number" value={form.maxDepth} onChange={(e) => setForm({ ...form, maxDepth: Number(e.target.value) })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Stress Threshold</Label><Input type="number" step="0.01" value={form.stressThreshold} onChange={(e) => setForm({ ...form, stressThreshold: Number(e.target.value) })} /></div>
              <div className="space-y-1"><Label>Critical Prob</Label><Input type="number" step="0.01" value={form.stressProbCritical} onChange={(e) => setForm({ ...form, stressProbCritical: Number(e.target.value) })} /></div>
            </div>
            <div className="space-y-1"><Label>Dataset ID</Label><Input type="number" value={form.datasetId} onChange={(e) => setForm({ ...form, datasetId: e.target.value })} /></div>
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