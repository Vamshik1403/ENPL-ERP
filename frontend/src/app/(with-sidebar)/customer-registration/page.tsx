'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Plus, Pencil, Trash2, Search, X, ChevronLeft, ChevronRight, Loader2, ShieldX, Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/components/ui/table';
import SlideFormPanel from '@/components/ui/SlideFormPanel';
import { useToast } from '@/components/ui/toaster';

/* ── types ─────────────────────────────────────────────── */
interface Customer { id: number; customerName: string; }
interface Site { id: number; siteName: string; addressBookId: number; }
interface ContactSiteRow { customerId: number; customerName: string; siteId: number; siteName: string; }
interface CustomerContact {
  id: number; custFirstName: string; custLastName: string; phoneNumber: string; emailAddress: string;
  sites: { id: number; customerId: number; siteId: number; addressBook: Customer; site: Site }[];
}
type CrudPerm = { read: boolean; create: boolean; edit: boolean; delete: boolean };

const selectCls = 'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';

export default function CustomerContactPage() {
  const { toast } = useToast();
  const API = 'http://localhost:8000/customer-contact';
  const PERMISSIONS_API = 'http://localhost:8000/user-permissions';

  const [records, setRecords] = useState<CustomerContact[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;
  const [loadingPerms, setLoadingPerms] = useState(true);
  const [userId, setUserId] = useState<number | null>(null);
  const [perm, setPerm] = useState<CrudPerm>({ read: false, create: false, edit: false, delete: false });

  const [form, setForm] = useState({ custFirstName: '', custLastName: '', phoneNumber: '', emailAddress: '' });
  const [draftCustomerId, setDraftCustomerId] = useState<number>(0);
  const [draftSiteId, setDraftSiteId] = useState<number>(0);
  const [rows, setRows] = useState<ContactSiteRow[]>([]);

  /* ── fetch ────────────────────────────────────────────── */
  const fetchAll = async () => { const r = await fetch(API); setRecords(await r.json()); };
  const fetchCustomers = async () => { const r = await fetch('http://localhost:8000/address-book'); setCustomers(await r.json()); };
  const fetchSites = async (cid: number) => {
    if (!cid) { setSites([]); return; }
    const r = await fetch(`http://localhost:8000/sites/based-on-cust?addressBookId=${cid}`);
    const d = await r.json(); setSites(Array.isArray(d) ? d : []);
  };

  const fetchPermissions = async (uid: number) => {
    try {
      if (localStorage.getItem('userType') === 'SUPERADMIN') { const all = { read: true, create: true, edit: true, delete: true }; setPerm(all); setLoadingPerms(false); return; }
      const r = await fetch(`${PERMISSIONS_API}/${uid}`); if (!r.ok) throw new Error();
      const raw = await r.text(); if (!raw) { setLoadingPerms(false); return; }
      const data = JSON.parse(raw);
      const p = data?.permissions?.permissions ?? data?.permissions ?? data ?? {};
      setPerm(p.CUSTOMER_REGISTRATION ?? { read: false, create: false, edit: false, delete: false });
    } catch { setPerm({ read: false, create: false, edit: false, delete: false }); } finally { setLoadingPerms(false); }
  };

  useEffect(() => { const id = localStorage.getItem('userId'); if (id) setUserId(Number(id)); }, []);
  useEffect(() => { if (userId) fetchPermissions(userId); }, [userId]);
  useEffect(() => { fetchAll(); fetchCustomers(); }, []);

  /* ── search / paginate ─────────────────────────────────── */
  const filtered = useMemo(() => {
    if (!perm.read && !loadingPerms) return [];
    const t = searchTerm.toLowerCase();
    return records.filter(r => r.custFirstName.toLowerCase().includes(t) || r.custLastName.toLowerCase().includes(t) || r.phoneNumber.includes(searchTerm) || r.emailAddress.toLowerCase().includes(t) || r.sites.some(s => s.site.siteName.toLowerCase().includes(t)));
  }, [records, searchTerm, perm.read, loadingPerms]);

  const totalPages = Math.ceil(filtered.length / recordsPerPage);
  const paginated = useMemo(() => { const s = (currentPage - 1) * recordsPerPage; return filtered.slice(s, s + recordsPerPage); }, [filtered, currentPage]);

  /* ── helpers ──────────────────────────────────────────── */
  const resetPanel = () => { setShowPanel(false); setEditingId(null); setForm({ custFirstName: '', custLastName: '', phoneNumber: '', emailAddress: '' }); setRows([]); setDraftCustomerId(0); setDraftSiteId(0); setSites([]); };

  const addRow = () => {
    if (!draftCustomerId || !draftSiteId) { toast({ title: 'Select customer and site', variant: 'warning' }); return; }
    const cust = customers.find(c => c.id === draftCustomerId);
    const site = sites.find(s => s.id === draftSiteId);
    if (!cust || !site) return;
    if (rows.some(r => r.customerId === cust.id && r.siteId === site.id)) { toast({ title: 'Already added', variant: 'warning' }); return; }
    setRows(p => [...p, { customerId: cust.id, customerName: cust.customerName, siteId: site.id, siteName: site.siteName }]);
    setDraftSiteId(0);
  };

  /* ── submit ───────────────────────────────────────────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rows.length) { toast({ title: 'Add at least one Customer + Site', variant: 'warning' }); return; }
    if (editingId && !perm.edit) { toast({ title: 'No edit permission', variant: 'error' }); return; }
    if (!editingId && !perm.create) { toast({ title: 'No create permission', variant: 'error' }); return; }
    const payload = { ...form, sites: rows.map(r => ({ customerId: r.customerId, siteId: r.siteId })) };
    await fetch(editingId ? `${API}/${editingId}` : API, { method: editingId ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    await fetchAll(); resetPanel();
  };

  const handleEdit = (item: CustomerContact) => {
    if (!perm.edit) { toast({ title: 'No edit permission', variant: 'error' }); return; }
    setEditingId(item.id); setForm({ custFirstName: item.custFirstName, custLastName: item.custLastName, phoneNumber: item.phoneNumber, emailAddress: item.emailAddress });
    setRows(item.sites.map(s => ({ customerId: s.customerId, customerName: s.addressBook.customerName, siteId: s.siteId, siteName: s.site.siteName })));
    setShowPanel(true);
  };

  const deleteContact = async (id: number) => {
    if (!perm.delete) { toast({ title: 'No delete permission', variant: 'error' }); return; }
    if (!confirm('Delete this contact?')) return;
    await fetch(`${API}/${id}`, { method: 'DELETE' }); fetchAll();
  };

  /* ── guards ───────────────────────────────────────────── */
  if (loadingPerms) return (<div className="flex items-center justify-center min-h-[60vh]"><div className="text-center space-y-3"><Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" /><p className="text-sm text-gray-500">Loading permissions…</p></div></div>);
  if (!perm.read) return (<div className="flex items-center justify-center min-h-[60vh]"><div className="text-center p-8 bg-white rounded-xl border border-gray-200 shadow-sm max-w-md"><div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4"><ShieldX className="w-6 h-6 text-red-500" /></div><h3 className="text-lg font-semibold text-gray-900 mb-1">Access Denied</h3><p className="text-sm text-gray-500">You don&apos;t have permission to view customer contacts.</p></div></div>);

  return (
    <div className="p-6 space-y-6">
      {/* header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-xl font-semibold text-gray-900">Customer Registration</h1><p className="text-sm text-gray-500 mt-0.5">Manage customer contacts and site assignments</p></div>
        <Button onClick={() => setShowPanel(true)} disabled={!perm.create} className="gap-2"><Plus className="w-4 h-4" /> Add Contact</Button>
      </div>
      <Separator />
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><Input placeholder="Search contacts…" value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="pl-9" /></div>
        <Badge variant="secondary" className="shrink-0">{filtered.length} {filtered.length === 1 ? 'contact' : 'contacts'}</Badge>
      </div>

      {/* table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80">
                <TableHead>Contact Name</TableHead><TableHead>Phone</TableHead><TableHead>Email</TableHead>
                <TableHead>Assigned Sites</TableHead><TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length > 0 ? paginated.map(r => (
                <TableRow key={r.id} className="hover:bg-gray-50/50 text-sm">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-semibold text-indigo-600">{r.custFirstName[0]}{r.custLastName[0]}</div>
                      <span className="font-medium">{r.custFirstName} {r.custLastName}</span>
                    </div>
                  </TableCell>
                  <TableCell>{r.phoneNumber}</TableCell>
                  <TableCell>{r.emailAddress}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">{r.sites.map(s => <Badge key={s.id} variant="outline" className="text-xs">{s.site.siteName}</Badge>)}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(r)} disabled={!perm.edit} className="h-8 w-8"><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteContact(r.id)} disabled={!perm.delete} className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={5} className="text-center py-12"><Users className="w-10 h-10 text-gray-300 mx-auto mb-2" /><p className="text-sm text-gray-500">{searchTerm ? 'No contacts match your search' : 'No contacts yet'}</p></TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50/50">
            <p className="text-sm text-gray-500">Page {currentPage} of {totalPages}</p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft className="w-4 h-4" /></Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}><ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Slide Form Panel ──────────────────────────────── */}
      <SlideFormPanel title={editingId ? 'Edit Contact' : 'New Contact'} description="Manage contact details and site assignments" isOpen={showPanel} onClose={resetPanel} >
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-120px)]">
          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>First Name <span className="text-red-500">*</span></Label><Input value={form.custFirstName} onChange={e => setForm({ ...form, custFirstName: e.target.value })} placeholder="First name" required /></div>
              <div className="space-y-2"><Label>Last Name <span className="text-red-500">*</span></Label><Input value={form.custLastName} onChange={e => setForm({ ...form, custLastName: e.target.value })} placeholder="Last name" required /></div>
              <div className="space-y-2"><Label>Phone Number <span className="text-red-500">*</span></Label><Input value={form.phoneNumber} onChange={e => setForm({ ...form, phoneNumber: e.target.value })} placeholder="Phone number" required /></div>
              <div className="space-y-2"><Label>Email Address <span className="text-red-500">*</span></Label><Input type="email" value={form.emailAddress} onChange={e => setForm({ ...form, emailAddress: e.target.value })} placeholder="Email" required /></div>
            </div>
          </div>
          <Separator />

          {/* Assign Sites */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Assign Sites</h3>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-5 space-y-1">
                <Label className="text-xs">Customer <span className="text-red-500">*</span></Label>
                <select value={draftCustomerId || ''} onChange={e => { const id = Number(e.target.value); setDraftCustomerId(id); setDraftSiteId(0); fetchSites(id); }} className={selectCls}>
                  <option value="">Select customer</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.customerName}</option>)}
                </select>
              </div>
              <div className="md:col-span-5 space-y-1">
                <Label className="text-xs">Site <span className="text-red-500">*</span></Label>
                <select value={draftSiteId || ''} disabled={!draftCustomerId} onChange={e => setDraftSiteId(Number(e.target.value))} className={selectCls}>
                  <option value="">Select site</option>
                  {sites.map(s => <option key={s.id} value={s.id}>{s.siteName}</option>)}
                </select>
              </div>
              <div className="md:col-span-2"><Button type="button" onClick={addRow} variant="outline" className="w-full gap-1"><Plus className="w-3.5 h-3.5" /> Add</Button></div>
            </div>

            {rows.length > 0 && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b"><p className="text-xs font-medium text-gray-700">Assigned Sites ({rows.length})</p></div>
                <Table>
                  <TableHeader><TableRow className="bg-gray-50/80"><TableHead>Customer</TableHead><TableHead>Site</TableHead><TableHead className="w-16"></TableHead></TableRow></TableHeader>
                  <TableBody>
                    {rows.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{r.customerName}</TableCell>
                        <TableCell>{r.siteName}</TableCell>
                        <TableCell><Button type="button" variant="ghost" size="icon" onClick={() => setRows(p => p.filter((_, idx) => idx !== i))} className="h-7 w-7 text-red-500"><X className="w-3.5 h-3.5" /></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
          <Separator />

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={editingId ? !perm.edit : !perm.create} className="flex-1">{editingId ? 'Update Contact' : 'Create Contact'}</Button>
            <Button type="button" variant="outline" onClick={resetPanel} className="flex-1">Cancel</Button>
          </div>
        </form>
      </SlideFormPanel>
    </div>
  );
}
