'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  Pencil, Trash2, Search, ChevronLeft, ChevronRight,
  ShieldX, Loader2, Download, ArrowUpDown, ArrowUp, ArrowDown, Plus, X,
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
import { VendorCombobox } from '@/components/ui/VendorCombobox';
import { ProductCombobox } from '@/components/ui/ProductCombobox';
import Papa from 'papaparse';

/* ── types ─────────────────────────────────────────────── */
interface ProductInventory { productId: number; serialNumber: string; macAddress: string; warrantyPeriod: string; purchaseRate: string; }
interface Inventory {
  id?: number; vendorId: number; creditTerms?: string; invoiceNetAmount?: string; gstAmount?: string;
  dueDate?: string; paidAmount?: string; dueAmount?: string; invoiceGrossAmount?: string;
  purchaseDate: string; purchaseInvoice: string; status?: string; duration?: string; products: ProductInventory[];
}
interface Vendor { id: number; vendorName: string; }
interface Product { id: number; productName: string; }
interface PermissionSet { edit: boolean; read: boolean; create: boolean; delete: boolean; }

const blankProduct: ProductInventory = { productId: 0, serialNumber: '', macAddress: '', warrantyPeriod: '', purchaseRate: '' };
const blankForm: Inventory = {
  vendorId: 0, purchaseDate: '', purchaseInvoice: '', status: 'In Stock', dueDate: '',
  paidAmount: '0', dueAmount: '', creditTerms: '', invoiceNetAmount: '', gstAmount: '', invoiceGrossAmount: '', products: [],
};

const cols: { label: string; key: string; sortable: boolean }[] = [
  { label: 'Date', key: 'purchaseDate', sortable: true },
  { label: 'Invoice No', key: 'purchaseInvoice', sortable: true },
  { label: 'Vendor', key: 'vendorName', sortable: true },
  { label: 'Net Amt', key: 'invoiceNetAmount', sortable: true },
  { label: 'GST', key: 'gstAmount', sortable: true },
  { label: 'Gross Amt', key: 'invoiceGrossAmount', sortable: true },
  { label: 'Credit', key: 'creditTerms', sortable: true },
  { label: 'Due Date', key: 'dueDate', sortable: true },
  { label: 'Paid', key: 'paidAmount', sortable: true },
  { label: 'Due', key: 'dueAmount', sortable: true },
  { label: 'Status', key: 'status', sortable: true },
  { label: 'Age', key: 'duration', sortable: false },
  { label: 'Actions', key: 'actions', sortable: false },
];

const API = 'http://localhost:8000/inventory';
const VENDOR_API = 'http://localhost:8000/vendors';
const PRODUCT_API = 'http://localhost:8000/products';
const VP_API = 'http://localhost:8000/vendor-payment';
const PERM_API = 'http://localhost:8000/user-permissions';

export default function PurchaseInvoicePage() {
  const { toast } = useToast();
  const [list, setList] = useState<Inventory[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [formData, setFormData] = useState<Inventory>({ ...blankForm });
  const [showPanel, setShowPanel] = useState(false);
  const [loading, setLoading] = useState(false);

  const [perms, setPerms] = useState<PermissionSet>({ edit: false, read: false, create: false, delete: false });
  const [loadingPerms, setLoadingPerms] = useState(true);
  const [userId, setUserId] = useState<number | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const itemsPerPage = 10;

  /* ── perms ────────────────────────────────────────────── */
  useEffect(() => { const id = localStorage.getItem('userId'); if (id) setUserId(Number(id)); }, []);
  useEffect(() => { if (userId) fetchPerms(userId); }, [userId]);

  const fetchPerms = async (uid: number) => {
    try {
      if (localStorage.getItem('userType') === 'SUPERADMIN') { setPerms({ read: true, create: true, edit: true, delete: true }); setLoadingPerms(false); return; }
      const res = await fetch(`${PERM_API}/${uid}`);
      if (!res.ok) throw new Error();
      const raw = await res.text(); if (!raw) { setLoadingPerms(false); return; }
      const p = JSON.parse(raw)?.permissions?.permissions ?? {};
      setPerms(p.PURCHASE_INVOICE ?? { read: false, create: false, edit: false, delete: false });
    } catch { /* */ } finally { setLoadingPerms(false); }
  };

  /* ── data ─────────────────────────────────────────────── */
  const fetchData = async () => {
    try {
      setLoading(true);
      const [invRes, vpRes] = await Promise.all([fetch(API), fetch(VP_API)]);
      const invData: Inventory[] = await invRes.json();
      const vpData: any[] = await vpRes.json();
      const today = new Date();
      const enriched = (Array.isArray(invData) ? invData : []).map(item => {
        const diff = Math.floor((today.getTime() - new Date(item.purchaseDate).getTime()) / 86400000);
        const matching = vpData.filter((vp: any) => vp.purchaseInvoiceNo === item.purchaseInvoice);
        let due = parseFloat(item.invoiceGrossAmount || '0');
        if (matching.length) { matching.sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()); due = parseFloat(matching[0].balanceDue || '0'); }
        const gross = parseFloat(item.invoiceGrossAmount || '0');
        return { ...item, duration: `${diff} day${diff !== 1 ? 's' : ''}`, dueAmount: due.toFixed(2), paidAmount: (gross - due).toFixed(2) };
      });
      setList(enriched);
    } catch { setList([]); } finally { setLoading(false); }
  };

  const fetchVendors = async () => { try { const r = await fetch(VENDOR_API); setVendors(await r.json()); } catch { /* */ } };
  const fetchProducts = async () => { try { const r = await fetch(PRODUCT_API); setProducts(await r.json()); } catch { /* */ } };

  useEffect(() => { if (!loadingPerms && perms.read) { fetchData(); fetchVendors(); fetchProducts(); } }, [loadingPerms, perms.read]);

  /* ── search / sort / page ──────────────────────────────── */
  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase();
    const arr = list.filter(inv => {
      const vn = vendors.find(v => v.id === inv.vendorId)?.vendorName?.toLowerCase() ?? '';
      return inv.purchaseInvoice?.toLowerCase().includes(q) || inv.purchaseDate?.toLowerCase().includes(q)
        || inv.creditTerms?.toLowerCase().includes(q) || inv.invoiceNetAmount?.toLowerCase().includes(q)
        || inv.gstAmount?.toLowerCase().includes(q) || inv.invoiceGrossAmount?.toLowerCase().includes(q)
        || inv.status?.toLowerCase().includes(q) || vn.includes(q)
        || inv.products.some(p => p.serialNumber?.toLowerCase().includes(q) || p.macAddress?.toLowerCase().includes(q));
    });
    const map = new Map<string, Inventory>();
    arr.forEach(i => { if (!map.has(i.purchaseInvoice)) map.set(i.purchaseInvoice, i); });
    return Array.from(map.values());
  }, [list, searchTerm, vendors]);

  const sorted = useMemo(() => {
    if (!sortField) return filtered;
    return [...filtered].sort((a, b) => {
      let av: any, bv: any;
      if (sortField === 'vendorName') { av = vendors.find(v => v.id === a.vendorId)?.vendorName ?? ''; bv = vendors.find(v => v.id === b.vendorId)?.vendorName ?? ''; }
      else { av = (a as any)[sortField] ?? ''; bv = (b as any)[sortField] ?? ''; }
      if (sortField.toLowerCase().includes('date')) return sortOrder === 'asc' ? new Date(av).getTime() - new Date(bv).getTime() : new Date(bv).getTime() - new Date(av).getTime();
      if (!isNaN(Number(av)) && !isNaN(Number(bv))) return sortOrder === 'asc' ? Number(av) - Number(bv) : Number(bv) - Number(av);
      return sortOrder === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
  }, [filtered, sortField, sortOrder, vendors]);

  const totalPages = Math.ceil(sorted.length / itemsPerPage);
  const paginated = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const handleSort = (key: string) => { if (sortField === key) setSortOrder(o => o === 'asc' ? 'desc' : 'asc'); else { setSortField(key); setSortOrder('asc'); } setCurrentPage(1); };

  /* ── CSV ──────────────────────────────────────────────── */
  const handleCSV = () => {
    if (!filtered.length) return;
    const csv = Papa.unparse(filtered.map(inv => ({
      PurchaseDate: inv.purchaseDate, PurchaseInvoice: inv.purchaseInvoice,
      Vendor: vendors.find(v => v.id === inv.vendorId)?.vendorName ?? '',
      Status: inv.status ?? '', CreditTerms: inv.creditTerms ?? '', DueDate: inv.dueDate ?? '',
      InvoiceNetAmount: inv.invoiceNetAmount ?? '', GSTAmount: inv.gstAmount ?? '',
      InvoiceGrossAmount: inv.invoiceGrossAmount ?? '', PaidAmount: inv.paidAmount ?? '', DueAmount: inv.dueAmount ?? '',
      Duration: inv.duration ?? '',
      Products: inv.products.map(p => `${products.find(pr => pr.id === p.productId)?.productName ?? ''} (SN:${p.serialNumber})`).join('; '),
    })));
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'purchase-invoices.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  /* ── form helpers ─────────────────────────────────────── */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const u = { ...prev, [name]: value };
      if (u.purchaseDate && u.creditTerms && !isNaN(Number(u.creditTerms))) {
        const d = new Date(u.purchaseDate); d.setDate(d.getDate() + parseInt(u.creditTerms)); u.dueDate = d.toISOString().split('T')[0];
      }
      const gross = parseFloat(u.invoiceGrossAmount || '0'); const paid = parseFloat(u.paidAmount || '0'); u.dueAmount = (gross - paid).toFixed(2);
      return u;
    });
  };

  const updateProduct = (idx: number, field: keyof ProductInventory, val: any) => {
    setFormData(prev => { const p = [...prev.products]; (p[idx] as any)[field] = val; return { ...prev, products: p }; });
  };
  const addProduct = () => setFormData(prev => ({ ...prev, products: [...prev.products, { ...blankProduct }] }));
  const removeProduct = (idx: number) => setFormData(prev => { const p = [...prev.products]; p.splice(idx, 1); return { ...prev, products: p }; });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.purchaseInvoice || !formData.purchaseDate) { toast({ title: 'Please fill required fields', variant: 'warning' }); return; }
    const payload = { ...formData, products: formData.products.map(p => ({ productId: p.productId, serialNumber: p.serialNumber, macAddress: p.macAddress, warrantyPeriod: p.warrantyPeriod, purchaseRate: p.purchaseRate })) };
    try {
      const url = formData.id ? `${API}/${formData.id}` : API;
      const method = formData.id ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) { toast({ title: 'Save failed', variant: 'error' }); return; }
      await fetchData(); resetForm();
    } catch { toast({ title: 'Something went wrong!', variant: 'error' }); }
  };

  const handleEdit = (inv: Inventory) => { if (!perms.edit) return; setFormData({ ...inv, products: (inv.products || []).map(p => ({ ...p })) }); setShowPanel(true); };
  const handleDelete = async (id?: number) => { if (!id || !perms.delete || !confirm('Delete this inventory item?')) return; try { await fetch(`${API}/${id}`, { method: 'DELETE' }); await fetchData(); } catch { /* */ } };
  const resetForm = () => { setShowPanel(false); setFormData({ ...blankForm }); };

  /* ── status badge ─────────────────────────────────────── */
  const statusBadge = (inv: Inventory) => {
    const due = parseFloat(inv.dueAmount || '0');
    const gross = parseFloat(inv.invoiceGrossAmount || '0');
    if (due === 0) return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Full Paid</Badge>;
    if (due === gross) return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Unpaid</Badge>;
    return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Partly Paid</Badge>;
  };

  const SortIcon = ({ col }: { col: string }) => {
    if (sortField !== col) return <ArrowUpDown className="w-3 h-3 ml-1 text-gray-400" />;
    return sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />;
  };

  /* ── guards ───────────────────────────────────────────── */
  if (loadingPerms) return (<div className="flex items-center justify-center min-h-[60vh]"><div className="text-center space-y-3"><Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" /><p className="text-sm text-gray-500">Loading permissions…</p></div></div>);
  if (!perms.read) return (<div className="flex items-center justify-center min-h-[60vh]"><div className="text-center p-8 bg-white rounded-xl border border-gray-200 shadow-sm max-w-md"><div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4"><ShieldX className="w-6 h-6 text-red-500" /></div><h3 className="text-lg font-semibold text-gray-900 mb-1">Access Denied</h3><p className="text-sm text-gray-500">You don&apos;t have permission to view purchase invoices.</p></div></div>);

  return (
    <div className="p-6 space-y-6">
      {/* header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-xl font-semibold text-gray-900">Purchase Invoices</h1><p className="text-sm text-gray-500 mt-0.5">Track purchase invoices from vendors</p></div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleCSV} className="gap-2" disabled={!filtered.length}><Download className="w-4 h-4" /> CSV</Button>
        </div>
      </div>
      <Separator />
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><Input placeholder="Search invoices…" value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="pl-9" /></div>
        <Badge variant="secondary" className="shrink-0">{sorted.length} {sorted.length === 1 ? 'result' : 'results'}</Badge>
      </div>

      {/* table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80">
                {cols.map(c => (
                  <TableHead key={c.key} className={`whitespace-nowrap text-xs ${c.sortable ? 'cursor-pointer select-none' : ''} ${c.key === 'actions' ? 'text-right' : ''}`} onClick={() => c.sortable && handleSort(c.key)}>
                    <span className="inline-flex items-center">{c.label}{c.sortable && <SortIcon col={c.key} />}</span>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={cols.length} className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" /></TableCell></TableRow>
              ) : paginated.length > 0 ? paginated.map(inv => (
                <TableRow key={inv.id} className="hover:bg-gray-50/50 text-sm">
                  <TableCell className="whitespace-nowrap">{inv.purchaseDate?.slice(0, 10)}</TableCell>
                  <TableCell className="font-medium">{inv.purchaseInvoice}</TableCell>
                  <TableCell>{vendors.find(v => v.id === inv.vendorId)?.vendorName ?? 'N/A'}</TableCell>
                  <TableCell className="text-right tabular-nums">{inv.invoiceNetAmount}</TableCell>
                  <TableCell className="text-right tabular-nums">{inv.gstAmount}</TableCell>
                  <TableCell className="text-right tabular-nums">{inv.invoiceGrossAmount}</TableCell>
                  <TableCell className="text-center">{inv.creditTerms}</TableCell>
                  <TableCell className="whitespace-nowrap">{inv.dueDate?.slice(0, 10)}</TableCell>
                  <TableCell className="text-right tabular-nums">{inv.paidAmount || '0'}</TableCell>
                  <TableCell className="text-right tabular-nums">{inv.dueAmount}</TableCell>
                  <TableCell>{statusBadge(inv)}</TableCell>
                  <TableCell className="whitespace-nowrap text-gray-500 text-xs">{inv.duration}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(inv)} disabled={!perms.edit} className="h-8 w-8"><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(inv.id)} disabled={!perms.delete} className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={cols.length} className="text-center py-12"><p className="text-sm text-gray-500">{searchTerm ? 'No invoices match your search' : 'No purchase invoices yet'}</p></TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50/50">
            <p className="text-sm text-gray-500">Page {currentPage} of {totalPages}</p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft className="w-4 h-4" /></Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => { const s = Math.max(1, Math.min(currentPage - 2, totalPages - 4)); const pg = s + i; if (pg > totalPages) return null; return <Button key={pg} variant={currentPage === pg ? 'default' : 'outline'} size="icon" className="h-8 w-8" onClick={() => setCurrentPage(pg)}>{pg}</Button>; })}
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}><ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>
        )}
      </div>

      {/* slide form */}
      <SlideFormPanel title={formData.id ? 'Edit Invoice' : 'Add Invoice'} description={formData.id ? 'Update purchase invoice details' : 'Record a new purchase invoice'} isOpen={showPanel} onClose={resetForm} >
        <form onSubmit={handleSave} className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Purchase Invoice No <span className="text-red-500">*</span></Label><Input name="purchaseInvoice" value={formData.purchaseInvoice} onChange={handleChange} placeholder="Invoice number" required /></div>
            <div className="space-y-2"><Label>Purchase Date <span className="text-red-500">*</span></Label><Input type="date" name="purchaseDate" value={formData.purchaseDate} onChange={handleChange} required /></div>
            <div className="space-y-2"><Label>Vendor</Label><VendorCombobox selectedValue={formData.vendorId} onSelect={val => setFormData(p => ({ ...p, vendorId: val }))} placeholder="Select Vendor" /></div>
            <div className="space-y-2"><Label>Credit Terms (days)</Label><Input name="creditTerms" value={formData.creditTerms} onChange={handleChange} placeholder="e.g. 30" /></div>
            <div className="space-y-2"><Label>Due Date</Label><Input type="date" name="dueDate" value={formData.dueDate} onChange={handleChange} /></div>
            <div className="space-y-2"><Label>Net Amount</Label><Input name="invoiceNetAmount" value={formData.invoiceNetAmount} onChange={handleChange} /></div>
            <div className="space-y-2"><Label>GST Amount</Label><Input name="gstAmount" value={formData.gstAmount} onChange={handleChange} /></div>
            <div className="space-y-2"><Label>Gross Amount</Label><Input name="invoiceGrossAmount" value={formData.invoiceGrossAmount} onChange={handleChange} /></div>
          </div>

          <Separator />

          {/* products sub-form */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base">Products</Label>
              <Button type="button" variant="outline" size="sm" onClick={addProduct} className="gap-1"><Plus className="w-3.5 h-3.5" /> Add Product</Button>
            </div>
            {formData.products.map((p, i) => (
              <div key={i} className="relative border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50/50">
                <Button type="button" variant="ghost" size="icon" onClick={() => removeProduct(i)} className="absolute top-2 right-2 h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"><X className="w-3.5 h-3.5" /></Button>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="space-y-1"><Label className="text-xs">Product</Label><ProductCombobox selectedValue={p.productId} onSelect={val => updateProduct(i, 'productId', val)} placeholder="Select Product" /></div>
                  <div className="space-y-1"><Label className="text-xs">Serial Number</Label><Input value={p.serialNumber} onChange={e => updateProduct(i, 'serialNumber', e.target.value)} placeholder="Serial No" /></div>
                  <div className="space-y-1"><Label className="text-xs">MAC Address</Label><Input value={p.macAddress} onChange={e => updateProduct(i, 'macAddress', e.target.value)} placeholder="MAC" /></div>
                  <div className="space-y-1"><Label className="text-xs">Warranty (Days)</Label><Input value={p.warrantyPeriod} onChange={e => updateProduct(i, 'warrantyPeriod', e.target.value)} placeholder="Days" /></div>
                  <div className="space-y-1"><Label className="text-xs">Purchase Rate</Label><Input value={p.purchaseRate} onChange={e => updateProduct(i, 'purchaseRate', e.target.value)} placeholder="Rate" /></div>
                </div>
              </div>
            ))}
            {formData.products.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No products added yet</p>}
          </div>

          <Separator />
          <div className="flex items-center gap-3">
            <Button type="submit" className="flex-1">{formData.id ? 'Update Invoice' : 'Save Invoice'}</Button>
            <Button type="button" variant="outline" onClick={resetForm} className="flex-1">Cancel</Button>
          </div>
        </form>
      </SlideFormPanel>
    </div>
  );
}
