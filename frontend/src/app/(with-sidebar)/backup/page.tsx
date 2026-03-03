'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Download, Trash2, RotateCcw, Upload, Plus, ChevronLeft, ChevronRight, Loader2,
  HardDrive, Settings, Database,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/components/ui/table';
import { useToast } from '@/components/ui/toaster';

const API = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

type Recurrence = 'HOUR' | 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';
type BackupConfig = {
  id: number; enabled: boolean; type: Recurrence;
  hour: number | null; minute: number | null; dayOfWeek: number | null;
  dayOfMonth: number | null; month: number | null; maxFiles: number; updatedAt: string;
};
type BackupRow = { name: string; size: number; modified: string };
type BackupListResp = { page: number; perPage: number; total: number; items: BackupRow[] };

const daysOfWeek = [
  { id: 0, label: 'Sunday' }, { id: 1, label: 'Monday' }, { id: 2, label: 'Tuesday' },
  { id: 3, label: 'Wednesday' }, { id: 4, label: 'Thursday' }, { id: 5, label: 'Friday' }, { id: 6, label: 'Saturday' },
];
const months = Array.from({ length: 12 }).map((_, i) => ({ id: i + 1, label: new Date(2000, i, 1).toLocaleString(undefined, { month: 'long' }) }));

function formatMB(bytes: number) {
  const mb = bytes / (1024 * 1024);
  if (mb < 1) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${mb.toFixed(2)} MB`;
}

const selectCls = 'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';

export default function BackupPage() {
  const { toast } = useToast();
  const [cfg, setCfg] = useState<BackupConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [daysFilter, setDaysFilter] = useState(7);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [list, setList] = useState<BackupListResp | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const uploadRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  const totalPages = useMemo(() => { if (!list) return 1; return Math.max(1, Math.ceil(list.total / list.perPage)); }, [list]);

  async function loadConfig() {
    setError(null);
    const res = await fetch(`${API}/backup/config`, { cache: 'no-store' });
    setCfg(await res.json());
  }

  async function loadList(p = page, pp = perPage, d = daysFilter) {
    setError(null); setLoadingList(true);
    try { const r = await fetch(`${API}/backup/list?page=${p}&perPage=${pp}&days=${d}`, { cache: 'no-store' }); setList(await r.json()); } catch (e: any) { setError(e?.message || 'Failed to load'); setList(null); } finally { setLoadingList(false); }
  }

  async function saveConfig() {
    if (!cfg) return; setError(null);
    const t = cfg.type;
    if (t === 'HOUR' && (cfg.minute === null || cfg.minute === undefined)) { setError('Minute is required for Hour schedule'); return; }
    if (t !== 'HOUR' && (cfg.hour === null || cfg.minute === null)) { setError('Hour and Minute are required'); return; }
    if (t === 'WEEK' && cfg.dayOfWeek === null) { setError('Day of Week is required'); return; }
    if ((t === 'MONTH' || t === 'YEAR') && cfg.dayOfMonth === null) { setError('Day of Month is required'); return; }
    if (t === 'YEAR' && cfg.month === null) { setError('Month is required'); return; }
    setSaving(true);
    try {
      const r = await fetch(`${API}/backup/config`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled: cfg.enabled, type: cfg.type, hour: cfg.hour, minute: cfg.minute, dayOfWeek: cfg.dayOfWeek, dayOfMonth: cfg.dayOfMonth, month: cfg.month, maxFiles: cfg.maxFiles }) });
      const d = await r.json(); if (!r.ok) throw new Error(d?.message || 'Save failed'); setCfg(d); toast({ title: 'Configuration saved', variant: 'success' });
    } catch (e: any) { setError(e?.message || 'Save failed'); } finally { setSaving(false); }
  }

  async function createBackupNow() {
    if (!cfg) return; setCreating(true); setError(null);
    try { const r = await fetch(`${API}/backup/create`, { method: 'POST' }); const d = await r.json(); if (!r.ok) throw new Error(d?.message); await loadList(1, perPage, daysFilter); setPage(1); } catch (e: any) { setError(e?.message); } finally { setCreating(false); }
  }

  async function restoreFromFile(filename: string) {
    if (!confirm(`Restore from "${filename}"?\nThis will overwrite current data.`)) return; setError(null);
    try { const r = await fetch(`${API}/backup/restore`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filename }) }); const d = await r.json(); if (!r.ok) throw new Error(d?.message); toast({ title: 'Restore completed', variant: 'success' }); } catch (e: any) { setError(e?.message); }
  }

  async function deleteFile(filename: string) {
    if (!confirm(`Delete "${filename}"?`)) return; setError(null);
    try { const r = await fetch(`${API}/backup/file/${encodeURIComponent(filename)}`, { method: 'DELETE' }); const d = await r.json(); if (!r.ok) throw new Error(d?.message); await loadList(page, perPage, daysFilter); } catch (e: any) { setError(e?.message); }
  }

  async function uploadAndRestore(file: File) {
    setUploading(true); setError(null);
    try { const fd = new FormData(); fd.append('file', file); const r = await fetch(`${API}/backup/restore-upload`, { method: 'POST', body: fd }); const d = await r.json(); if (!r.ok) throw new Error(d?.message); toast({ title: 'Restore completed', variant: 'success' }); } catch (e: any) { setError(e?.message); } finally { setUploading(false); if (uploadRef.current) uploadRef.current.value = ''; }
  }

  useEffect(() => { loadConfig(); loadList(1, perPage, daysFilter); setPage(1); }, []);
  useEffect(() => { loadList(1, perPage, daysFilter); setPage(1); }, [daysFilter, perPage]);

  if (!cfg) return (
    <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-xl font-semibold text-gray-900">Auto Backup</h1><p className="text-sm text-gray-500 mt-0.5">Configure automatic backups, restore, and manage backup files</p></div>
      </div>
      <Separator />

      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">{error}</div>}

      {/* ── Config Section ───────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><Settings className="w-4 h-4" /> Auto Backup Configuration</h2>

        <div className="flex items-center gap-4">
          <Label className="w-48 shrink-0">Enable Auto Backup</Label>
          <button type="button" onClick={() => setCfg({ ...cfg, enabled: !cfg.enabled })} className={`relative w-14 h-7 rounded-full transition ${cfg.enabled ? 'bg-green-500' : 'bg-gray-300'}`}>
            <span className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition ${cfg.enabled ? 'translate-x-7' : 'translate-x-0'}`} />
          </button>
          <Badge variant={cfg.enabled ? 'default' : 'secondary'}>{cfg.enabled ? 'ON' : 'OFF'}</Badge>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <Label className="w-48 shrink-0">Occurrence</Label>
          <span className="text-sm text-gray-500">Every</span>
          <select value={cfg.type} onChange={e => setCfg({ ...cfg, type: e.target.value as Recurrence })} className={`${selectCls} w-28`}>
            <option value="HOUR">Hour</option><option value="DAY">Day</option><option value="WEEK">Week</option><option value="MONTH">Month</option><option value="YEAR">Year</option>
          </select>

          {cfg.type === 'HOUR' && (
            <div className="flex items-center gap-2"><span className="text-sm text-gray-500">at</span><select value={cfg.minute ?? 0} onChange={e => setCfg({ ...cfg, minute: Number(e.target.value) })} className={`${selectCls} w-20`}>{Array.from({ length: 60 }).map((_, m) => <option key={m} value={m}>{String(m).padStart(2, '0')}</option>)}</select><span className="text-sm text-gray-500">past the hour</span></div>
          )}

          {cfg.type === 'DAY' && (
            <div className="flex items-center gap-2"><span className="text-sm text-gray-500">at</span><select value={cfg.hour ?? 0} onChange={e => setCfg({ ...cfg, hour: Number(e.target.value) })} className={`${selectCls} w-20`}>{Array.from({ length: 24 }).map((_, h) => <option key={h} value={h}>{h}</option>)}</select><span className="text-sm text-gray-500">:</span><select value={cfg.minute ?? 0} onChange={e => setCfg({ ...cfg, minute: Number(e.target.value) })} className={`${selectCls} w-20`}>{Array.from({ length: 60 }).map((_, m) => <option key={m} value={m}>{String(m).padStart(2, '0')}</option>)}</select></div>
          )}

          {cfg.type === 'WEEK' && (
            <div className="flex items-center gap-2 flex-wrap"><span className="text-sm text-gray-500">on</span><select value={cfg.dayOfWeek ?? 0} onChange={e => setCfg({ ...cfg, dayOfWeek: Number(e.target.value) })} className={`${selectCls} w-36`}>{daysOfWeek.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}</select><span className="text-sm text-gray-500">at</span><select value={cfg.hour ?? 0} onChange={e => setCfg({ ...cfg, hour: Number(e.target.value) })} className={`${selectCls} w-20`}>{Array.from({ length: 24 }).map((_, h) => <option key={h} value={h}>{h}</option>)}</select><span className="text-sm text-gray-500">:</span><select value={cfg.minute ?? 0} onChange={e => setCfg({ ...cfg, minute: Number(e.target.value) })} className={`${selectCls} w-20`}>{Array.from({ length: 60 }).map((_, m) => <option key={m} value={m}>{String(m).padStart(2, '0')}</option>)}</select></div>
          )}

          {cfg.type === 'MONTH' && (
            <div className="flex items-center gap-2 flex-wrap"><span className="text-sm text-gray-500">on the</span><select value={cfg.dayOfMonth ?? 1} onChange={e => setCfg({ ...cfg, dayOfMonth: Number(e.target.value) })} className={`${selectCls} w-20`}>{Array.from({ length: 31 }).map((_, d) => <option key={d + 1} value={d + 1}>{d + 1}</option>)}</select><span className="text-sm text-gray-500">at</span><select value={cfg.hour ?? 0} onChange={e => setCfg({ ...cfg, hour: Number(e.target.value) })} className={`${selectCls} w-20`}>{Array.from({ length: 24 }).map((_, h) => <option key={h} value={h}>{h}</option>)}</select><span className="text-sm text-gray-500">:</span><select value={cfg.minute ?? 0} onChange={e => setCfg({ ...cfg, minute: Number(e.target.value) })} className={`${selectCls} w-20`}>{Array.from({ length: 60 }).map((_, m) => <option key={m} value={m}>{String(m).padStart(2, '0')}</option>)}</select></div>
          )}

          {cfg.type === 'YEAR' && (
            <div className="flex items-center gap-2 flex-wrap"><span className="text-sm text-gray-500">on the</span><select value={cfg.dayOfMonth ?? 1} onChange={e => setCfg({ ...cfg, dayOfMonth: Number(e.target.value) })} className={`${selectCls} w-20`}>{Array.from({ length: 31 }).map((_, d) => <option key={d + 1} value={d + 1}>{d + 1}</option>)}</select><span className="text-sm text-gray-500">of</span><select value={cfg.month ?? 1} onChange={e => setCfg({ ...cfg, month: Number(e.target.value) })} className={`${selectCls} w-36`}>{months.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}</select><span className="text-sm text-gray-500">at</span><select value={cfg.hour ?? 0} onChange={e => setCfg({ ...cfg, hour: Number(e.target.value) })} className={`${selectCls} w-20`}>{Array.from({ length: 24 }).map((_, h) => <option key={h} value={h}>{h}</option>)}</select><span className="text-sm text-gray-500">:</span><select value={cfg.minute ?? 0} onChange={e => setCfg({ ...cfg, minute: Number(e.target.value) })} className={`${selectCls} w-20`}>{Array.from({ length: 60 }).map((_, m) => <option key={m} value={m}>{String(m).padStart(2, '0')}</option>)}</select></div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <Label className="w-48 shrink-0">Max Files</Label>
          <Input type="number" min={1} max={200} value={cfg.maxFiles} onChange={e => setCfg({ ...cfg, maxFiles: Number(e.target.value) })} className="w-24" />
        </div>

        <Button onClick={saveConfig} disabled={saving} className="gap-2">{saving && <Loader2 className="w-4 h-4 animate-spin" />} Save Configuration</Button>
      </div>

      {/* ── Backup / Restore ──────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><Database className="w-4 h-4" /> Backup / Restore</h2>
        <div className="flex items-center gap-4 flex-wrap">
          <Label className="w-48 shrink-0">Filter Backups</Label>
          <select value={daysFilter} onChange={e => setDaysFilter(Number(e.target.value))} className={`${selectCls} w-40`}>
            <option value={7}>Last 7 days</option><option value={15}>Last 15 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option>
          </select>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <Label className="w-48 shrink-0">Restore from Upload</Label>
          <input ref={uploadRef} type="file" accept=".backup" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadAndRestore(f); }} />
          <Button variant="outline" disabled={uploading} onClick={() => uploadRef.current?.click()} className="gap-2"><Upload className="w-4 h-4" />{uploading ? 'Uploading…' : 'Upload .backup file'}</Button>
        </div>
      </div>

      {/* ── Available Backups Table ────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-3"><h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><HardDrive className="w-4 h-4" /> Available Backups</h2>{list && <Badge variant="secondary">{list.total} files</Badge>}</div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2"><span className="text-xs text-gray-500">Rows:</span><select value={perPage} onChange={e => setPerPage(Number(e.target.value))} className={`${selectCls} w-16 h-8 text-xs`}><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option></select></div>
            <Button onClick={createBackupNow} disabled={creating} size="sm" className="gap-1">{creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Create Backup</Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow className="bg-gray-50/80"><TableHead>File</TableHead><TableHead>Date</TableHead><TableHead>Size</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {loadingList ? (
                <TableRow><TableCell colSpan={4} className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" /></TableCell></TableRow>
              ) : list?.items?.length ? list.items.map(b => (
                <TableRow key={b.name} className="hover:bg-gray-50/50 text-sm">
                  <TableCell className="font-medium font-mono text-xs">{b.name}</TableCell>
                  <TableCell className="whitespace-nowrap">{new Date(b.modified).toLocaleString()}</TableCell>
                  <TableCell>{formatMB(b.size)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => restoreFromFile(b.name)} className="gap-1 text-xs h-7"><RotateCcw className="w-3 h-3" /> Restore</Button>
                      <a href={`${API}/backup/download/${encodeURIComponent(b.name)}`}><Button variant="ghost" size="sm" className="gap-1 text-xs h-7"><Download className="w-3 h-3" /> Download</Button></a>
                      <Button variant="ghost" size="sm" onClick={() => deleteFile(b.name)} className="gap-1 text-xs h-7 text-red-600 hover:text-red-700 hover:bg-red-50"><Trash2 className="w-3 h-3" /> Delete</Button>
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={4} className="text-center py-12"><p className="text-sm text-gray-500">No backups found</p></TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {list && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50/50">
            <p className="text-sm text-gray-500">{list.total === 0 ? '0 records' : `${(list.page - 1) * list.perPage + 1}–${Math.min(list.page * list.perPage, list.total)} of ${list.total}`}</p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={async () => { const p = Math.max(1, page - 1); setPage(p); await loadList(p, perPage, daysFilter); }}><ChevronLeft className="w-4 h-4" /></Button>
              <span className="text-sm text-gray-600 px-2">Page {page}/{totalPages}</span>
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages} onClick={async () => { const p = Math.min(totalPages, page + 1); setPage(p); await loadList(p, perPage, daysFilter); }}><ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
