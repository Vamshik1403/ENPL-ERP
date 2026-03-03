'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  Plus, Pencil, Trash2, Search, ChevronLeft, ChevronRight,
  ShieldX, Loader2, Download, ArrowUpDown, ArrowUp, ArrowDown,
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
import Papa from 'papaparse';

/* ── types ─────────────────────────────────────────────── */
interface Vendor { id: number; vendorName: string; }

interface VendorPayment {
  id?: number;
  vendorId: number;
  purchaseInvoiceNo: string;
  invoiceGrossAmount: string;
  dueAmount: string;
  paidAmount: string;
  balanceDue?: string;
  paymentDate: string;
  referenceNo: string;
  paymentType: string;
  remark: string;
  createdAt?: string;
  updatedAt?: string;
}

interface PermissionSet { edit: boolean; read: boolean; create: boolean; delete: boolean; }

const blank: VendorPayment = {
  vendorId: 0, purchaseInvoiceNo: '', invoiceGrossAmount: '', dueAmount: '',
  paidAmount: '', balanceDue: '', paymentType: '', referenceNo: '', remark: '', paymentDate: '',
};

const PAYMENT_TYPES = ['Cash', 'Bank Transfer', 'Cheque', 'Credit Note', 'Write Off'];

/* ── headers ───────────────────────────────────────────── */
const headers: { label: string; key: string; sortable: boolean }[] = [
  { label: 'Entry Date', key: 'entryDate', sortable: true },
  { label: 'Vendor', key: 'vendorName', sortable: true },
  { label: 'Payment Date', key: 'paymentDate', sortable: true },
  { label: 'Reference', key: 'referenceNo', sortable: true },
  { label: 'Gross Amt', key: 'invoiceGrossAmount', sortable: true },
  { label: 'Due Amt', key: 'dueAmount', sortable: true },
  { label: 'Paid Amt', key: 'paidAmount', sortable: true },
  { label: 'Balance', key: 'balanceDue', sortable: true },
  { label: 'Mode', key: 'paymentType', sortable: true },
  { label: 'Remark', key: 'remark', sortable: false },
  { label: 'Invoice No', key: 'purchaseInvoiceNo', sortable: true },
  { label: 'Actions', key: 'actions', sortable: false },
];

const API = 'http://localhost:8000/vendor-payment';
const VENDOR_API = 'http://localhost:8000/vendors';
const PERMISSIONS_API = 'http://localhost:8000/user-permissions';

export default function VendorPaymentPage() {
  const { toast } = useToast();
  const [payments, setPayments] = useState<VendorPayment[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorInvoices, setVendorInvoices] = useState<any[]>([]);
  const [formData, setFormData] = useState<VendorPayment>({ ...blank });
  const [showPanel, setShowPanel] = useState(false);
  const [loading, setLoading] = useState(false);

  const [perms, setPerms] = useState<PermissionSet>({ edit: false, read: false, create: false, delete: false });
  const [loadingPermissions, setLoadingPermissions] = useState(true);
  const [userId, setUserId] = useState<number | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const itemsPerPage = 10;

  /* ── permissions ──────────────────────────────────────── */
  useEffect(() => { const id = localStorage.getItem('userId'); if (id) setUserId(Number(id)); }, []);
  useEffect(() => { if (userId) fetchPermissions(userId); }, [userId]);

  const fetchPermissions = async (uid: number) => {
    try {
      const userType = localStorage.getItem('userType');
      if (userType === 'SUPERADMIN') {
        setPerms({ read: true, create: true, edit: true, delete: true });
        setLoadingPermissions(false);
        return;
      }
      const res = await fetch(`${PERMISSIONS_API}/${uid}`);
      if (!res.ok) throw new Error();
      const raw = await res.text();
      if (!raw) { setLoadingPermissions(false); return; }
      const data = JSON.parse(raw);
      const p = data?.permissions?.permissions ?? {};
      setPerms(p.VENDOR_PAYMENT ?? { read: false, create: false, edit: false, delete: false });
    } catch { /* */ } finally { setLoadingPermissions(false); }
  };

  /* ── data fetching ────────────────────────────────────── */
  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await fetch(API);
      const data = await res.json();
      setPayments(Array.isArray(data) ? data.reverse() : []);
    } catch { setPayments([]); } finally { setLoading(false); }
  };

  const fetchVendors = async () => {
    try {
      const res = await fetch(VENDOR_API);
      const data = await res.json();
      setVendors(Array.isArray(data) ? data : []);
    } catch { /* */ }
  };

  useEffect(() => {
    if (!loadingPermissions && perms.read) { fetchPayments(); fetchVendors(); }
  }, [loadingPermissions, perms.read]);

  /* ── search / sort / paginate ──────────────────────────── */
  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return payments.filter(p => {
      const vn = vendors.find(v => v.id === p.vendorId)?.vendorName?.toLowerCase() ?? '';
      return vn.includes(q) || p.paymentDate?.toLowerCase().includes(q)
        || p.referenceNo?.toLowerCase().includes(q) || p.paymentType?.toLowerCase().includes(q)
        || p.remark?.toLowerCase().includes(q) || p.purchaseInvoiceNo?.toLowerCase().includes(q)
        || p.invoiceGrossAmount?.toLowerCase().includes(q) || p.dueAmount?.toLowerCase().includes(q);
    });
  }, [payments, searchTerm, vendors]);

  const sorted = useMemo(() => {
    if (!sortField) return filtered;
    return [...filtered].sort((a, b) => {
      let av: any, bv: any;
      if (sortField === 'vendorName') {
        av = vendors.find(v => v.id === a.vendorId)?.vendorName ?? '';
        bv = vendors.find(v => v.id === b.vendorId)?.vendorName ?? '';
      } else if (sortField === 'entryDate') {
        av = a.createdAt ?? ''; bv = b.createdAt ?? '';
      } else {
        av = (a as any)[sortField] ?? ''; bv = (b as any)[sortField] ?? '';
      }
      if (sortField.toLowerCase().includes('date') || sortField === 'entryDate') {
        return sortOrder === 'asc' ? new Date(av).getTime() - new Date(bv).getTime() : new Date(bv).getTime() - new Date(av).getTime();
      }
      if (!isNaN(Number(av)) && !isNaN(Number(bv))) {
        return sortOrder === 'asc' ? Number(av) - Number(bv) : Number(bv) - Number(av);
      }
      return sortOrder === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
  }, [filtered, sortField, sortOrder, vendors]);

  const totalPages = Math.ceil(sorted.length / itemsPerPage);
  const paginated = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSort = (key: string) => {
    if (sortField === key) setSortOrder(o => (o === 'asc' ? 'desc' : 'asc'));
    else { setSortField(key); setSortOrder('asc'); }
    setCurrentPage(1);
  };

  /* ── CSV ──────────────────────────────────────────────── */
  const handleDownloadCSV = () => {
    if (!payments.length) return;
    const csv = Papa.unparse(payments.map(p => ({
      Vendor: vendors.find(v => v.id === p.vendorId)?.vendorName ?? 'N/A',
      PurchaseInvoiceNo: p.purchaseInvoiceNo || 'N/A',
      InvoiceGrossAmount: p.invoiceGrossAmount || 'N/A',
      DueAmount: p.dueAmount || 'N/A',
      PaidAmount: p.paidAmount || 'N/A',
      BalanceDue: p.balanceDue || 'N/A',
      PaymentDate: p.paymentDate || 'N/A',
      ReferenceNo: p.referenceNo || 'N/A',
      PaymentType: p.paymentType || 'N/A',
      Remark: p.remark || 'N/A',
    })));
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'vendor-payments.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /* ── form helpers ─────────────────────────────────────── */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'paidAmount') {
      const paid = parseFloat(value || '0');
      const due = parseFloat(formData.dueAmount || '0');
      setFormData(prev => ({ ...prev, paidAmount: value, balanceDue: (due - paid).toFixed(2) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleVendorSelect = async (val: number) => {
    setFormData(prev => ({ ...prev, vendorId: val }));
    try {
      const res = await fetch(`http://localhost:8000/inventory?vendorId=${val}`);
      const data = await res.json();
      if (data?.length) {
        setVendorInvoices(data);
        const inv = data[0];
        const gross = parseFloat(inv.invoiceGrossAmount || '0');
        const prevPaid = payments.filter(p => p.purchaseInvoiceNo === inv.purchaseInvoice).reduce((s, p) => s + parseFloat(p.paidAmount || '0'), 0);
        setFormData(prev => ({ ...prev, purchaseInvoiceNo: inv.purchaseInvoice, invoiceGrossAmount: inv.invoiceGrossAmount, dueAmount: (gross - prevPaid).toFixed(2) }));
      } else {
        setVendorInvoices([]);
        setFormData(prev => ({ ...prev, purchaseInvoiceNo: '', invoiceGrossAmount: '', dueAmount: '' }));
      }
    } catch {
      setVendorInvoices([]);
      setFormData(prev => ({ ...prev, purchaseInvoiceNo: '', invoiceGrossAmount: '', dueAmount: '' }));
    }
  };

  const handleInvoiceSelect = (invoiceNo: string) => {
    const inv = vendorInvoices.find(i => i.purchaseInvoice === invoiceNo);
    if (!inv) return;
    const gross = parseFloat(inv.invoiceGrossAmount || '0');
    const prevPaid = payments.filter(p => p.purchaseInvoiceNo === invoiceNo).reduce((s, p) => s + parseFloat(p.paidAmount || '0'), 0);
    setFormData(prev => ({ ...prev, purchaseInvoiceNo: invoiceNo, invoiceGrossAmount: inv.invoiceGrossAmount, dueAmount: (gross - prevPaid).toFixed(2) }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vendorId || Number(formData.vendorId) <= 0) { toast({ title: 'Please select Vendor', variant: 'warning' }); return; }
    if (!formData.purchaseInvoiceNo) { toast({ title: 'Please enter Purchase Invoice No', variant: 'warning' }); return; }
    if (!formData.paymentDate) { toast({ title: 'Please select Payment Date', variant: 'warning' }); return; }
    const payload = {
      vendorId: Number(formData.vendorId), purchaseInvoiceNo: formData.purchaseInvoiceNo,
      invoiceGrossAmount: formData.invoiceGrossAmount, dueAmount: formData.dueAmount,
      paidAmount: formData.paidAmount, balanceDue: formData.balanceDue || undefined,
      paymentDate: formData.paymentDate, paymentType: formData.paymentType,
      referenceNo: formData.referenceNo, remark: formData.remark || undefined,
    };
    try {
      const url = formData.id ? `${API}/${formData.id}` : API;
      const method = formData.id ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) { const err = await res.json().catch(() => null); toast({ title: 'Request failed', description: err?.message ? JSON.stringify(err.message) : 'Request failed', variant: 'error' }); return; }
      await fetchPayments();
      resetForm();
    } catch { toast({ title: 'Request failed', variant: 'error' }); }
  };

  const handleEdit = (p: VendorPayment) => {
    if (!perms.edit) return;
    setFormData({ ...p });
    setShowPanel(true);
  };

  const handleDelete = async (id: number) => {
    if (!perms.delete) return;
    if (!confirm('Are you sure you want to delete this payment?')) return;
    try { await fetch(`${API}/${id}`, { method: 'DELETE' }); await fetchPayments(); toast({ title: 'Payment deleted', variant: 'success' }); } catch { toast({ title: 'Error deleting payment', variant: 'error' }); }
  };

  const resetForm = () => { setShowPanel(false); setFormData({ ...blank }); setVendorInvoices([]); };
  const handleAddNew = () => { if (!perms.create) return; setFormData({ ...blank }); setVendorInvoices([]); setShowPanel(true); };

  /* ── guards ───────────────────────────────────────────── */
  if (loadingPermissions) {
    return (<div className="flex items-center justify-center min-h-[60vh]"><div className="text-center space-y-3"><Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" /><p className="text-sm text-gray-500">Loading permissions…</p></div></div>);
  }
  if (!perms.read) {
    return (<div className="flex items-center justify-center min-h-[60vh]"><div className="text-center p-8 bg-white rounded-xl border border-gray-200 shadow-sm max-w-md"><div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4"><ShieldX className="w-6 h-6 text-red-500" /></div><h3 className="text-lg font-semibold text-gray-900 mb-1">Access Denied</h3><p className="text-sm text-gray-500">You don&apos;t have permission to view vendor payments.</p></div></div>);
  }

  /* ── sort icon helper ─────────────────────────────────── */
  const SortIcon = ({ col }: { col: string }) => {
    if (sortField !== col) return <ArrowUpDown className="w-3 h-3 ml-1 text-gray-400" />;
    return sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />;
  };

  return (
    <div className="p-6 space-y-6">
      {/* header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Vendor Payments</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track and manage vendor payment records</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleDownloadCSV} className="gap-2" disabled={!payments.length}><Download className="w-4 h-4" /> CSV</Button>
          <Button onClick={handleAddNew} disabled={!perms.create} className="gap-2"><Plus className="w-4 h-4" /> Add Payment</Button>
        </div>
      </div>

      <Separator />

      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search payments…" value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="pl-9" />
        </div>
        <Badge variant="secondary" className="shrink-0">{sorted.length} {sorted.length === 1 ? 'result' : 'results'}</Badge>
      </div>

      {/* table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80">
                {headers.map(h => (
                  <TableHead key={h.key} className={`whitespace-nowrap text-xs ${h.sortable ? 'cursor-pointer select-none' : ''} ${h.key === 'actions' ? 'text-right' : ''}`} onClick={() => h.sortable && handleSort(h.key)}>
                    <span className="inline-flex items-center">{h.label}{h.sortable && <SortIcon col={h.key} />}</span>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={headers.length} className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" /></TableCell></TableRow>
              ) : paginated.length > 0 ? (
                paginated.map(p => (
                  <TableRow key={p.id} className="hover:bg-gray-50/50 text-sm">
                    <TableCell className="whitespace-nowrap">{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell className="font-medium">{vendors.find(v => v.id === p.vendorId)?.vendorName ?? 'N/A'}</TableCell>
                    <TableCell className="whitespace-nowrap">{new Date(p.paymentDate).toLocaleDateString('en-GB')}</TableCell>
                    <TableCell>{p.referenceNo || 'N/A'}</TableCell>
                    <TableCell className="text-right tabular-nums">{p.invoiceGrossAmount}</TableCell>
                    <TableCell className="text-right tabular-nums">{p.dueAmount}</TableCell>
                    <TableCell className="text-right tabular-nums">{p.paidAmount}</TableCell>
                    <TableCell className="text-right tabular-nums">{p.balanceDue || 'N/A'}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs font-normal">{p.paymentType}</Badge></TableCell>
                    <TableCell className="max-w-[120px] truncate">{p.remark || 'N/A'}</TableCell>
                    <TableCell className="whitespace-nowrap">{p.purchaseInvoiceNo}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(p)} disabled={!perms.edit} className="h-8 w-8"><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id!)} disabled={!perms.delete} className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={headers.length} className="text-center py-12">
                    <p className="text-sm text-gray-500">{searchTerm ? 'No payments match your search' : 'No payments yet'}</p>
                    {!searchTerm && perms.create && <Button variant="outline" size="sm" onClick={handleAddNew} className="mt-3 gap-2"><Plus className="w-3.5 h-3.5" /> Add First Payment</Button>}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50/50">
            <p className="text-sm text-gray-500">Page {currentPage} of {totalPages}</p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft className="w-4 h-4" /></Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
                const page = start + i;
                if (page > totalPages) return null;
                return <Button key={page} variant={currentPage === page ? 'default' : 'outline'} size="icon" className="h-8 w-8" onClick={() => setCurrentPage(page)}>{page}</Button>;
              })}
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}><ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>
        )}
      </div>

      {/* slide form */}
      <SlideFormPanel title={formData.id ? 'Edit Payment' : 'Add Payment'} description={formData.id ? 'Update the vendor payment record' : 'Record a new vendor payment'} isOpen={showPanel} onClose={resetForm} >
        <form onSubmit={handleSave} className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Vendor <span className="text-red-500">*</span></Label>
              <VendorCombobox selectedValue={formData.vendorId} onSelect={handleVendorSelect} placeholder="Select Vendor" />
            </div>

            {vendorInvoices.length > 0 && (
              <div className="space-y-2">
                <Label>Select Invoice <span className="text-red-500">*</span></Label>
                <select name="purchaseInvoiceNo" value={formData.purchaseInvoiceNo} onChange={e => handleInvoiceSelect(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                  <option value="">-- Select Invoice --</option>
                  {vendorInvoices.map((inv: any, i: number) => <option key={i} value={inv.purchaseInvoice}>{inv.purchaseInvoice}</option>)}
                </select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Invoice Gross Amount</Label>
              <Input name="invoiceGrossAmount" value={formData.invoiceGrossAmount} readOnly className="bg-gray-50" />
            </div>

            <div className="space-y-2">
              <Label>Due Amount</Label>
              <Input name="dueAmount" value={formData.dueAmount} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label>Payment Date <span className="text-red-500">*</span></Label>
              <Input type="date" name="paymentDate" value={formData.paymentDate} onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <Label>Payment Type</Label>
              <select name="paymentType" value={formData.paymentType} onChange={handleChange} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="">-- Select Type --</option>
                {PAYMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Paid Amount</Label>
              <Input name="paidAmount" value={formData.paidAmount} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label>Reference</Label>
              <Input name="referenceNo" value={formData.referenceNo} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label>Balance Due</Label>
              <Input name="balanceDue" value={formData.balanceDue} readOnly className="bg-gray-50" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Remark</Label>
              <Input name="remark" value={formData.remark} onChange={handleChange} placeholder="Optional remark" />
            </div>
          </div>

          <Separator />

          <div className="flex items-center gap-3">
            <Button type="submit" className="flex-1">{formData.id ? 'Update Payment' : 'Save Payment'}</Button>
            <Button type="button" variant="outline" onClick={resetForm} className="flex-1">Cancel</Button>
          </div>
        </form>
      </SlideFormPanel>
    </div>
  );
}
