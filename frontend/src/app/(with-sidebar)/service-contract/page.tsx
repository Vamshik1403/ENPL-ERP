'use client';

import { useEffect, useState } from 'react';
import {
  Plus, Pencil, Trash2, Search, ChevronLeft, ChevronRight, ShieldX, Loader2,
  X, ChevronDown, ChevronUp, Clock, Package, Settings, FileText, Users, Building, Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/components/ui/table';
import SlideFormPanel from '@/components/ui/SlideFormPanel';
import { useToast } from '@/components/ui/toaster';

/* ── API helper ────────────────────────────────────────── */
async function apiFetch(url: string, method = 'GET', body?: any) {
  try {
    const res = await fetch(`http://localhost:8000${url}`, {
      method, headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    if (res.status === 404) return [];
    if (!res.ok) throw new Error(`API Error ${res.status}: ${text}`);
    return text ? JSON.parse(text) : {};
  } catch (err) { console.error('Fetch Error:', err); throw err; }
}

/* ── types ─────────────────────────────────────────────── */
interface ServiceContract {
  id?: number; serviceContractID: string; customerId: number; branchId: number;
  salesManagerName: string; amcType: string; startDate: string; endDate: string;
  nextPMVisitDate: string; maxOnSiteVisits: string; maxPreventiveMaintenanceVisit: string;
  inclusiveInOnSiteVisitCounts: boolean; serviceContractTypeId?: number;
  preventiveMaintenanceCycle: string; contractDescription: string;
  attachmentUrl?: string; attachmentName?: string; contractType?: string;
  billingType?: string; billingCycle?: string; paymentStatus?: string;
  billingSchedule?: any[]; customerName?: string; branchName?: string;
  periods?: any[]; terms?: any[]; services?: any[]; inventories?: any[]; histories?: any[];
}

interface ContractService { id?: number; serviceName: string; description: string; serviceCategoryName?: string; contractWorkCategoryId?: number; }
interface ServiceContractInventory { id?: number; productType: string; makeModel: string; snMac: string; description: string; purchaseDate: string; warrantyPeriod: string; warrantyStatus: string; thirdPartyPurchase: boolean; productName?: string; productTypeId?: number; }
interface ServiceContractHistory { id?: number; serviceContractId: number; taskId: string; serviceType: string; serviceDate: string; startTime: string; endTime: string; serviceDetails: string; _delete?: boolean; _hidden?: boolean; }
type CrudPerm = { read: boolean; create: boolean; edit: boolean; delete: boolean; };
type PermissionsJson = Record<string, CrudPerm>;

const selectCls = 'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';

export default function ServiceContractPage() {
  const { toast } = useToast();
  const [serviceContracts, setServiceContracts] = useState<ServiceContract[]>([]);
  const [contractServices, setContractServices] = useState<ContractService[]>([]);
  const [inventories, setInventories] = useState<ServiceContractInventory[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [serviceCategories, setServiceCategories] = useState<any[]>([]);
  const [productTypes, setProductTypes] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);

  const [customerSearch, setCustomerSearch] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState<any[]>([]);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const [showTaskSuggestions, setShowTaskSuggestions] = useState(false);
  const [filteredTasks, setFilteredTasks] = useState<any[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [permissions, setPermissions] = useState<PermissionsJson | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingPerms, setLoadingPerms] = useState(true);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);

  const [billingSchedule, setBillingSchedule] = useState<{ dueDate: string; paymentStatus: string; overdueDays: number }[]>([]);
  const [showBillingSchedule, setShowBillingSchedule] = useState(true);

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [serviceHistoryList, setServiceHistoryList] = useState<ServiceContractHistory[]>([]);
  const [historyFormModal, setHistoryFormModal] = useState<ServiceContractHistory>({
    serviceContractId: 0, taskId: '', serviceType: 'On-Site Visit', serviceDate: '', startTime: '', endTime: '', serviceDetails: '',
  });

  const [formData, setFormData] = useState<ServiceContract>({
    serviceContractID: '', customerId: 0, branchId: 0, salesManagerName: '', amcType: '',
    startDate: '', endDate: '', nextPMVisitDate: '', maxOnSiteVisits: '',
    maxPreventiveMaintenanceVisit: '', inclusiveInOnSiteVisitCounts: false,
    preventiveMaintenanceCycle: '', contractDescription: '', contractType: 'Free',
    billingType: '', billingCycle: '', paymentStatus: 'Paid', billingSchedule: [],
  });

  const [serviceForm, setServiceForm] = useState<ContractService>({ serviceName: '', description: '' });
  const [inventoryForm, setInventoryForm] = useState<ServiceContractInventory>({
    productType: '', makeModel: '', snMac: '', description: '', purchaseDate: '', warrantyPeriod: '', warrantyStatus: '', thirdPartyPurchase: false,
  });

  /* ── permissions ──────────────────────────────────────── */
  useEffect(() => { const id = localStorage.getItem('userId'); if (id) setUserId(Number(id)); }, []);
  useEffect(() => { if (userId) fetchPerms(userId); }, [userId]);

  const fetchPerms = async (uid: number) => {
    try {
      if (localStorage.getItem('userType') === 'SUPERADMIN') {
        const all = { read: true, create: true, edit: true, delete: true };
        setPermissions({ SERVICE_CONTRACTS: all });
        setLoadingPerms(false); return;
      }
      const res = await fetch(`http://localhost:8000/user-permissions/${uid}`);
      if (!res.ok) throw new Error();
      const raw = await res.text(); if (!raw) { setLoadingPerms(false); return; }
      const data = JSON.parse(raw);
      const p = data?.permissions?.permissions ?? data?.permissions ?? data ?? {};
      setPermissions(p);
    } catch { setPermissions({}); } finally { setLoadingPerms(false); }
  };

  const perm: CrudPerm = {
    read: permissions?.SERVICE_CONTRACTS?.read ?? false,
    create: permissions?.SERVICE_CONTRACTS?.create ?? false,
    edit: permissions?.SERVICE_CONTRACTS?.edit ?? false,
    delete: permissions?.SERVICE_CONTRACTS?.delete ?? false,
  };

  /* ── billing schedule generation ──────────────────────── */
  function generateBillingSchedule(start: string, end: string, cycleDays: number) {
    const schedule: { dueDate: string; paymentStatus: string; overdueDays: number }[] = [];
    if (!start || !end || !cycleDays) return schedule;
    let current = new Date(start); const endDate = new Date(end);
    while (current <= endDate) {
      const dueDate = new Date(current); const today = new Date();
      const overdueDays = today > dueDate ? Math.floor((today.getTime() - dueDate.getTime()) / 86400000) : 0;
      schedule.push({ dueDate: dueDate.toISOString().split('T')[0], paymentStatus: 'Unpaid', overdueDays });
      current.setDate(current.getDate() + cycleDays);
    }
    return schedule;
  }

  useEffect(() => {
    if (formData.contractType === 'Paid' && formData.startDate && formData.endDate && formData.billingCycle) {
      setBillingSchedule(generateBillingSchedule(formData.startDate, formData.endDate, parseInt(formData.billingCycle)));
    }
  }, [formData.contractType, formData.startDate, formData.endDate, formData.billingCycle]);

  const updatePaymentStatus = (i: number, status: string) => {
    const u = [...billingSchedule]; u[i].paymentStatus = status;
    const today = new Date(); const due = new Date(u[i].dueDate);
    u[i].overdueDays = status === 'Unpaid' && today > due ? Math.floor((today.getTime() - due.getTime()) / 86400000) : 0;
    setBillingSchedule(u);
  };

  /* ── data fetching ────────────────────────────────────── */
  useEffect(() => {
    (async () => {
      try {
        const [cust, cats, prods, tsk] = await Promise.all([
          apiFetch('/address-book'), apiFetch('/contractworkcategory'),
          apiFetch('/products'), apiFetch('/task'),
        ]);
        setCustomers(cust.filter((c: any) => c.addressType === 'Customer'));
        setServiceCategories(cats); setProductTypes(prods); setTasks(tsk);
      } catch { /* */ }
    })();
  }, []);

  useEffect(() => { if (customers.length > 0) { loadContracts(); } }, [customers]);

  const loadContracts = async () => {
    try {
      setLoading(true);
      const contracts = await apiFetch('/service-contract');
      const enhanced = await Promise.all(contracts.map(async (c: any) => {
        const cust = customers.find((cu: any) => cu.id === c.customerId);
        let branchName = 'N/A';
        if (cust && c.branchId) { const br = cust.sites?.find((s: any) => s.id === c.branchId); branchName = br?.siteName || 'N/A'; }
        let startDate = '', endDate = '';
        try { const pd = await apiFetch(`/service-contract-period/${c.id}`); if (pd?.startDate) { startDate = pd.startDate; endDate = pd.endDate || ''; } } catch { /* */ }
        return { ...c, customerName: cust?.customerName || 'Unknown', branchName, startDate, endDate };
      }));
      setServiceContracts(enhanced);
    } catch { /* */ } finally { setLoading(false); }
  };

  /* ── search / paginate ─────────────────────────────────── */
  const filtered = serviceContracts.filter(c => {
    const t = searchTerm.toLowerCase();
    return c.serviceContractID?.toLowerCase().includes(t) || c.customerName?.toLowerCase().includes(t) || c.branchName?.toLowerCase().includes(t) || c.salesManagerName?.toLowerCase().includes(t) || c.amcType?.toLowerCase().includes(t);
  });
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  /* ── customer select ──────────────────────────────────── */
  const handleCustomerSelect = (cid: number) => {
    const c = customers.find((cu: any) => cu.id === cid);
    setFormData(p => ({ ...p, customerId: cid, branchId: 0 }));
    setSites(c?.sites || []);
  };

  /* ── add new ──────────────────────────────────────────── */
  const handleAddNew = async () => {
    const res = await apiFetch('/service-contract/next/id');
    setFormData({
      serviceContractID: res.nextID || '', customerId: 0, branchId: 0, salesManagerName: '', amcType: '',
      startDate: '', endDate: '', nextPMVisitDate: '', contractType: 'Free', billingType: '', billingCycle: '',
      paymentStatus: 'Paid', billingSchedule: [], maxOnSiteVisits: '', maxPreventiveMaintenanceVisit: '',
      inclusiveInOnSiteVisitCounts: false, preventiveMaintenanceCycle: '', contractDescription: '',
    });
    setContractServices([]); setInventories([]); setServiceHistoryList([]);
    setAttachmentFile(null); setEditingId(null); setShowPanel(true);
  };

  /* ── edit ──────────────────────────────────────────────── */
  const handleEdit = async (id: number) => {
    try {
      const main = await apiFetch(`/service-contract/${id}`);
      const cust = customers.find((c: any) => c.id === main.customerId);
      setSites(cust?.sites || []);
      const period = main.periods?.[0] || {};
      const term = main.terms?.[0] || {};
      const initialFD = {
        ...main, startDate: period?.startDate?.slice(0, 10) || '', endDate: period?.endDate?.slice(0, 10) || '',
        nextPMVisitDate: period?.nextPMVisitDate?.slice(0, 10) || '', contractDescription: period?.contractDescription || '',
        maxOnSiteVisits: term?.maxOnSiteVisits || '', maxPreventiveMaintenanceVisit: term?.maxPreventiveMaintenanceVisit || '',
        inclusiveInOnSiteVisitCounts: term?.inclusiveInOnSiteVisitCounts || false, preventiveMaintenanceCycle: term?.preventiveMaintenanceCycle || '',
        contractType: 'Free', billingType: '', billingCycle: '', paymentStatus: 'Paid', serviceContractTypeId: undefined,
      };
      setFormData(initialFD);
      setContractServices((main.services || []).map((s: any) => {
        const cat = serviceCategories.find((c: any) => c.id === s.contractWorkCategoryId);
        return { id: s.id, serviceName: s.contractWorkCategoryId?.toString() || '', description: s.description || '', serviceCategoryName: cat?.contractWorkCategoryName || 'Unknown' };
      }));
      setInventories((main.inventories || []).map((i: any) => {
        const pt = productTypes.find((p: any) => p.id === i.productTypeId);
        return { id: i.id, productType: i.productTypeId?.toString() || '', makeModel: i.makeModel || '', snMac: i.snMac || '', description: i.description || '', purchaseDate: i.purchaseDate?.slice(0, 10) || '', warrantyPeriod: i.warrantyPeriod || '', warrantyStatus: i.warrantyStatus || '', thirdPartyPurchase: i.thirdPartyPurchase || false, productName: pt?.productName || 'Unknown' };
      }));
      setServiceHistoryList((main.histories || []).map((h: any) => ({
        id: h.id, serviceContractId: id, taskId: h.taskId || '', serviceType: h.serviceType || 'On-Site Visit',
        serviceDate: h.serviceDate?.slice(0, 10) || '', startTime: h.startTime || '', endTime: h.endTime || '', serviceDetails: h.serviceDetails || '',
      })));
      try {
        const typeArr = await apiFetch(`/service-contract-type?contractId=${id}`);
        const ct = Array.isArray(typeArr) ? typeArr[0] : typeArr;
        if (ct) {
          setFormData(p => ({ ...p, serviceContractTypeId: ct.id, contractType: ct.serviceContractType || 'Free', billingType: ct.billingType || '', billingCycle: ct.billingCycle?.toString() || '', paymentStatus: ct.paymentStatus || 'Paid' }));
          try { const br = await apiFetch(`/service-contract-billing/type/${ct.id}`); setBillingSchedule(br || []); } catch { setBillingSchedule([]); }
        }
      } catch { /* */ }
      setEditingId(id); setShowPanel(true);
    } catch { toast({ title: 'Failed to load contract data', variant: 'error' }); }
  };

  /* ── submit ───────────────────────────────────────────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let scId = editingId;
      if (editingId) {
        const fd = new FormData(); fd.append('customerId', String(formData.customerId)); fd.append('branchId', String(formData.branchId));
        fd.append('salesManagerName', formData.salesManagerName); fd.append('amcType', formData.amcType || '');
        if (attachmentFile) fd.append('attachment', attachmentFile);
        const r = await fetch(`http://localhost:8000/service-contract/${editingId}`, { method: 'PATCH', body: fd });
        if (!r.ok) throw new Error('Update failed');
        await apiFetch('/service-contract-period', 'POST', { serviceContractId: editingId, startDate: formData.startDate, endDate: formData.endDate, nextPMVisitDate: formData.nextPMVisitDate, contractDescription: formData.contractDescription });
        await apiFetch('/service-contract-terms', 'POST', { serviceContractId: editingId, maxOnSiteVisits: formData.maxOnSiteVisits, maxPreventiveMaintenanceVisit: formData.maxPreventiveMaintenanceVisit, inclusiveInOnSiteVisitCounts: formData.inclusiveInOnSiteVisitCounts, preventiveMaintenanceCycle: formData.preventiveMaintenanceCycle });
        const pp: any = { serviceContractType: formData.contractType, serviceContractId: editingId, billingDueDate: formData.startDate, paymentStatus: formData.paymentStatus, billingSchedule };
        if (formData.contractType === 'Paid') { pp.billingType = formData.billingType; pp.billingCycle = formData.billingCycle; } else { pp.billingType = 'Prepaid'; pp.billingCycle = '0'; }
        await apiFetch(`/service-contract-type/${formData.serviceContractTypeId}`, 'PATCH', pp);
        await apiFetch(`/service-contract-services/contract/${editingId}`, 'DELETE');
        await apiFetch(`/service-contract-inventory/contract/${editingId}`, 'DELETE');
      } else {
        const fd = new FormData(); fd.append('customerId', String(formData.customerId)); fd.append('branchId', String(formData.branchId));
        fd.append('salesManagerName', formData.salesManagerName); fd.append('amcType', formData.amcType || '');
        if (attachmentFile) fd.append('attachment', attachmentFile);
        const r = await fetch('http://localhost:8000/service-contract', { method: 'POST', body: fd });
        if (!r.ok) throw new Error('Create failed');
        const main = await r.json(); scId = main.id;
        await apiFetch('/service-contract-period', 'POST', { serviceContractId: scId, startDate: formData.startDate, endDate: formData.endDate, nextPMVisitDate: formData.nextPMVisitDate, contractDescription: formData.contractDescription });
        await apiFetch('/service-contract-terms', 'POST', { serviceContractId: scId, maxOnSiteVisits: formData.maxOnSiteVisits, maxPreventiveMaintenanceVisit: formData.maxPreventiveMaintenanceVisit, inclusiveInOnSiteVisitCounts: formData.inclusiveInOnSiteVisitCounts, preventiveMaintenanceCycle: formData.preventiveMaintenanceCycle });
        const tp: any = { serviceContractType: formData.contractType, serviceContractId: scId, billingDueDate: formData.startDate || '', paymentStatus: formData.paymentStatus || 'Paid', billingSchedule };
        tp.billingType = formData.contractType === 'Paid' ? formData.billingType : 'Prepaid';
        tp.billingCycle = formData.contractType === 'Paid' ? formData.billingCycle : '0';
        const typeRes = await apiFetch('/service-contract-type', 'POST', tp);
        if (billingSchedule?.length && typeRes?.id) await apiFetch('/service-contract-billing/bulk', 'POST', { serviceContractTypeId: typeRes.id, billings: billingSchedule });
      }
      for (const s of contractServices) await apiFetch('/service-contract-services', 'POST', { serviceContractId: scId, contractWorkCategoryId: parseInt(s.serviceName) || 1, description: s.description });
      for (const inv of inventories) await apiFetch('/service-contract-inventory', 'POST', { serviceContractId: scId, productTypeId: parseInt(inv.productType) || 1, makeModel: inv.makeModel, snMac: inv.snMac, description: inv.description, purchaseDate: inv.purchaseDate ? new Date(inv.purchaseDate).toISOString() : new Date().toISOString(), warrantyPeriod: inv.warrantyPeriod, warrantyStatus: inv.warrantyStatus, thirdPartyPurchase: inv.thirdPartyPurchase });
      for (const h of serviceHistoryList) {
        if (h._delete && h.id) { await apiFetch(`/service-contract-history/${h.id}`, 'DELETE'); continue; }
        if (h.id && !h._delete) { await apiFetch(`/service-contract-history/${h.id}`, 'PATCH', { ...h, serviceContractId: scId, serviceDate: new Date(h.serviceDate).toISOString() }); continue; }
        if (!h.id && !h._delete) await apiFetch('/service-contract-history', 'POST', { ...h, serviceContractId: scId, serviceDate: new Date(h.serviceDate).toISOString() });
      }
      toast({ title: editingId ? 'Service Contract updated!' : 'Service Contract created!', variant: 'success' });
      setShowPanel(false); setAttachmentFile(null); await loadContracts();
    } catch (err) { console.error(err); toast({ title: 'Failed to save', description: 'Check console for details', variant: 'error' }); }
  };

  /* ── delete ───────────────────────────────────────────── */
  const handleDelete = async (id: number) => {
    if (!confirm('Delete this service contract?')) return;
    await apiFetch(`/service-contract-type/contract/${id}`, 'DELETE');
    await apiFetch(`/service-contract/${id}`, 'DELETE');
    await loadContracts();
  };

  /* ── sub-entity helpers ───────────────────────────────── */
  const handleAddService = () => {
    if (!serviceForm.serviceName.trim()) return;
    const cat = serviceCategories.find((c: any) => c.id.toString() === serviceForm.serviceName);
    setContractServices(p => [...p, { ...serviceForm, serviceCategoryName: cat?.contractWorkCategoryName || 'Unknown' }]);
    setServiceForm({ serviceName: '', description: '' });
  };

  const handleAddInventory = () => {
    if (!inventoryForm.productType.trim()) return;
    const pt = productTypes.find((p: any) => p.id.toString() === inventoryForm.productType);
    setInventories(p => [...p, { ...inventoryForm, productName: pt?.productName || 'Unknown' }]);
    setInventoryForm({ productType: '', makeModel: '', snMac: '', description: '', purchaseDate: '', warrantyPeriod: '', warrantyStatus: '', thirdPartyPurchase: false });
    setShowInventoryModal(false);
  };

  const handleAddHistory = () => {
    if (!historyFormModal.taskId || !historyFormModal.serviceDate) { toast({ title: 'Fill required fields', variant: 'warning' }); return; }
    setServiceHistoryList(p => [...p, historyFormModal]);
    setHistoryFormModal({ serviceContractId: 0, taskId: '', serviceType: 'On-Site Visit', serviceDate: '', startTime: '', endTime: '', serviceDetails: '' });
    setShowHistoryModal(false);
  };

  const removeHistory = (i: number) => {
    setServiceHistoryList(p => { const it = p[i]; if (it.id) return p.map((h, idx) => idx === i ? { ...h, _delete: true, _hidden: true } : h); return p.filter((_, idx) => idx !== i); });
  };

  useEffect(() => { const h = () => { setShowCustomerSuggestions(false); setShowTaskSuggestions(false); }; document.addEventListener('click', h); return () => document.removeEventListener('click', h); }, []);

  /* ── guards ───────────────────────────────────────────── */
  if (loadingPerms) return (<div className="flex items-center justify-center min-h-[60vh]"><div className="text-center space-y-3"><Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" /><p className="text-sm text-gray-500">Loading permissions…</p></div></div>);
  if (!perm.read) return (<div className="flex items-center justify-center min-h-[60vh]"><div className="text-center p-8 bg-white rounded-xl border border-gray-200 shadow-sm max-w-md"><div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4"><ShieldX className="w-6 h-6 text-red-500" /></div><h3 className="text-lg font-semibold text-gray-900 mb-1">Access Denied</h3><p className="text-sm text-gray-500">You don&apos;t have permission to view service contracts.</p></div></div>);

  return (
    <div className="p-6 space-y-6">
      {/* header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-xl font-semibold text-gray-900">Service Contracts</h1><p className="text-sm text-gray-500 mt-0.5">Manage service contracts, billing, and inventory</p></div>
        <Button onClick={handleAddNew} disabled={!perm.create} className="gap-2"><Plus className="w-4 h-4" /> Add Contract</Button>
      </div>
      <Separator />
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><Input placeholder="Search contracts…" value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="pl-9" /></div>
        <Badge variant="secondary" className="shrink-0">{filtered.length} {filtered.length === 1 ? 'result' : 'results'}</Badge>
      </div>

      {/* table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80">
                <TableHead>Contract ID</TableHead><TableHead>Customer</TableHead><TableHead>Branch/Site</TableHead>
                <TableHead>Sales Manager</TableHead><TableHead>Start</TableHead><TableHead>End</TableHead><TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" /></TableCell></TableRow>
              ) : paginated.length > 0 ? paginated.map(c => (
                <TableRow key={c.id} className="hover:bg-gray-50/50 text-sm">
                  <TableCell className="font-medium">{c.serviceContractID}</TableCell>
                  <TableCell>{c.customerName}</TableCell>
                  <TableCell>{c.branchName}</TableCell>
                  <TableCell>{c.salesManagerName}</TableCell>
                  <TableCell className="whitespace-nowrap">{c.startDate ? new Date(c.startDate).toLocaleDateString() : 'N/A'}</TableCell>
                  <TableCell className="whitespace-nowrap">{c.endDate ? new Date(c.endDate).toLocaleDateString() : 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(c.id!)} disabled={!perm.edit} className="h-8 w-8"><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id!)} disabled={!perm.delete} className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={7} className="text-center py-12"><p className="text-sm text-gray-500">{searchTerm ? 'No contracts match your search' : 'No contracts yet'}</p></TableCell></TableRow>
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

      {/* ── SLIDE FORM PANEL ────────────────────────────── */}
      <SlideFormPanel title={editingId ? 'Edit Service Contract' : 'New Service Contract'} description="Manage contract details, services, inventory, and history" isOpen={showPanel} onClose={() => setShowPanel(false)} >
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-120px)]">

          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><Users className="w-4 h-4" /> Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Contract ID</Label><Input value={formData.serviceContractID} readOnly className="bg-gray-50" /></div>
              <div className="space-y-2"><Label>Attachment</Label><input type="file" accept="image/*,.pdf" onChange={e => setAttachmentFile(e.target.files?.[0] || null)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" />{!attachmentFile && editingId && formData.attachmentUrl && <a href={`http://localhost:8000${formData.attachmentUrl}`} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline">View current</a>}</div>
              <div className="space-y-2 relative" onClick={e => e.stopPropagation()}>
                <Label>Customer Name</Label>
                <Input value={customerSearch || customers.find((c: any) => c.id === formData.customerId)?.customerName || ''} onChange={e => { setCustomerSearch(e.target.value); setShowCustomerSuggestions(true); setFilteredCustomers(e.target.value.trim() ? customers.filter((c: any) => c.customerName.toLowerCase().includes(e.target.value.toLowerCase())) : customers); }} onFocus={() => setShowCustomerSuggestions(true)} placeholder="Search customer…" />
                {showCustomerSuggestions && filteredCustomers.length > 0 && (
                  <ul className="absolute z-50 bg-white border border-gray-200 w-full max-h-48 overflow-y-auto rounded-lg shadow-lg mt-1">
                    {filteredCustomers.map((c: any) => <li key={c.id} className="px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm" onClick={() => { handleCustomerSelect(c.id); setCustomerSearch(c.customerName); setShowCustomerSuggestions(false); }}>{c.customerName}</li>)}
                  </ul>
                )}
              </div>
              <div className="space-y-2"><Label>Branch / Site <span className="text-red-500">*</span></Label><select value={formData.branchId || ''} onChange={e => setFormData(p => ({ ...p, branchId: parseInt(e.target.value) }))} className={selectCls} required><option value="">Select Site</option>{sites.map((s: any) => <option key={s.id} value={s.id}>{s.siteName}</option>)}</select></div>
              <div className="space-y-2"><Label>Sales Manager <span className="text-red-500">*</span></Label><Input value={formData.salesManagerName} onChange={e => setFormData(p => ({ ...p, salesManagerName: e.target.value }))} placeholder="Manager name" required /></div>
              <div className="space-y-2"><Label>AMC Type <span className="text-red-500">*</span></Label><select value={formData.amcType} onChange={e => setFormData(p => ({ ...p, amcType: e.target.value }))} className={selectCls} required><option value="" disabled>Select</option><option value="Comprehensive">Comprehensive</option><option value="Non-Comprehensive">Non-Comprehensive</option></select></div>
            </div>
          </div>
          <Separator />

          {/* Period */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><Calendar className="w-4 h-4" /> Contract Period</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Start Date <span className="text-red-500">*</span></Label><Input type="date" value={formData.startDate} onChange={e => setFormData(p => ({ ...p, startDate: e.target.value }))} required /></div>
              <div className="space-y-2"><Label>End Date <span className="text-red-500">*</span></Label><Input type="date" value={formData.endDate} onChange={e => setFormData(p => ({ ...p, endDate: e.target.value }))} required /></div>
            </div>
          </div>
          <Separator />

          {/* Billing */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><FileText className="w-4 h-4" /> Contract Type &amp; Billing</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Contract Type</Label><select value={formData.contractType || 'Free'} onChange={e => setFormData(p => ({ ...p, contractType: e.target.value }))} className={selectCls}><option value="Free">Free</option><option value="Paid">Paid</option></select></div>
              {formData.contractType === 'Paid' && (<><div className="space-y-2"><Label>Billing Type</Label><select value={formData.billingType} onChange={e => setFormData(p => ({ ...p, billingType: e.target.value }))} className={selectCls}><option value="">Select</option><option value="Prepaid">Prepaid</option><option value="Postpaid">Postpaid</option></select></div><div className="space-y-2"><Label>Billing Cycle (Days)</Label><Input type="number" value={formData.billingCycle || ''} onChange={e => setFormData(p => ({ ...p, billingCycle: e.target.value }))} placeholder="e.g. 90" /></div></>)}
            </div>
            {formData.contractType === 'Paid' && billingSchedule.length > 0 && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <button type="button" className="w-full flex items-center justify-between px-4 py-2 bg-gray-50 text-sm font-medium" onClick={() => setShowBillingSchedule(p => !p)}>
                  <span>Billing Schedule ({billingSchedule.length})</span>{showBillingSchedule ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {showBillingSchedule && (
                  <Table><TableHeader><TableRow className="bg-gray-50/80"><TableHead>Due Date</TableHead><TableHead>Status</TableHead><TableHead>Overdue</TableHead></TableRow></TableHeader>
                    <TableBody>{billingSchedule.map((b, i) => (
                      <TableRow key={i}><TableCell>{b.dueDate}</TableCell><TableCell><select value={b.paymentStatus} onChange={e => updatePaymentStatus(i, e.target.value)} className="text-xs border rounded px-2 py-1"><option value="Paid">Paid</option><option value="Unpaid">Unpaid</option></select></TableCell><TableCell className={b.paymentStatus === 'Unpaid' && b.overdueDays > 0 ? 'text-red-600 font-medium' : ''}>{b.paymentStatus === 'Unpaid' && b.overdueDays > 0 ? `${b.overdueDays} days` : '—'}</TableCell></TableRow>
                    ))}</TableBody></Table>
                )}
              </div>
            )}
          </div>
          <Separator />

          {/* Terms */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><Settings className="w-4 h-4" /> Contract Terms</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2"><Label>Max On-Site Visits</Label><Input value={formData.maxOnSiteVisits} onChange={e => setFormData(p => ({ ...p, maxOnSiteVisits: e.target.value }))} placeholder="Nos" /></div>
              <div className="space-y-2"><Label>Max PM Visits</Label><Input value={formData.maxPreventiveMaintenanceVisit} onChange={e => setFormData(p => ({ ...p, maxPreventiveMaintenanceVisit: e.target.value }))} placeholder="Nos" /></div>
              <div className="space-y-2"><Label>PM Inclusive in On-Site</Label><select value={formData.inclusiveInOnSiteVisitCounts ? 'Yes' : 'No'} onChange={e => setFormData(p => ({ ...p, inclusiveInOnSiteVisitCounts: e.target.value === 'Yes' }))} className={selectCls}><option value="No">No</option><option value="Yes">Yes</option></select></div>
              <div className="space-y-2"><Label>PM Cycle</Label><Input value={formData.preventiveMaintenanceCycle} onChange={e => setFormData(p => ({ ...p, preventiveMaintenanceCycle: e.target.value }))} placeholder="Nos" /></div>
            </div>
          </div>
          <Separator />

          {/* Description */}
          <div className="space-y-2"><Label>Contract Description</Label><Textarea value={formData.contractDescription} onChange={e => setFormData(p => ({ ...p, contractDescription: e.target.value }))} placeholder="Enter description…" className="min-h-[80px]" /></div>
          <Separator />

          {/* Services */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><Settings className="w-4 h-4" /> Contract Services ({contractServices.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <div className="space-y-1"><Label className="text-xs">Service Category</Label><select value={serviceForm.serviceName} onChange={e => setServiceForm(p => ({ ...p, serviceName: e.target.value }))} className={selectCls}><option value="">Select</option>{serviceCategories.map((c: any) => <option key={c.id} value={c.id}>{c.contractWorkCategoryName}</option>)}</select></div>
              <div className="space-y-1"><Label className="text-xs">Description</Label><Input value={serviceForm.description} onChange={e => setServiceForm(p => ({ ...p, description: e.target.value }))} placeholder="Description…" /></div>
              <Button type="button" onClick={handleAddService} disabled={!serviceForm.serviceName.trim()} variant="outline" className="gap-1"><Plus className="w-3.5 h-3.5" /> Add</Button>
            </div>
            {contractServices.length > 0 && (
              <div className="border rounded-lg overflow-hidden"><Table><TableHeader><TableRow className="bg-gray-50/80"><TableHead>Category</TableHead><TableHead>Description</TableHead><TableHead className="w-16"></TableHead></TableRow></TableHeader><TableBody>{contractServices.map((s, i) => (<TableRow key={i}><TableCell className="font-medium">{s.serviceCategoryName}</TableCell><TableCell>{s.description}</TableCell><TableCell><Button type="button" variant="ghost" size="icon" onClick={() => setContractServices(p => p.filter((_, idx) => idx !== i))} className="h-7 w-7 text-red-500"><Trash2 className="w-3.5 h-3.5" /></Button></TableCell></TableRow>))}</TableBody></Table></div>
            )}
          </div>
          <Separator />

          {/* Inventory */}
          <div className="space-y-4">
            <div className="flex items-center justify-between"><h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><Package className="w-4 h-4" /> Inventory ({inventories.length})</h3><Button type="button" variant="outline" size="sm" onClick={() => setShowInventoryModal(true)} className="gap-1"><Plus className="w-3.5 h-3.5" /> Add Item</Button></div>
            {inventories.length > 0 && (
              <div className="border rounded-lg overflow-hidden"><Table><TableHeader><TableRow className="bg-gray-50/80"><TableHead>Product</TableHead><TableHead>Make/Model</TableHead><TableHead>SN/MAC</TableHead><TableHead>Warranty</TableHead><TableHead>3rd Party</TableHead><TableHead className="w-16"></TableHead></TableRow></TableHeader><TableBody>{inventories.map((inv, i) => (<TableRow key={i}><TableCell className="font-medium">{inv.productName}</TableCell><TableCell>{inv.makeModel}</TableCell><TableCell className="font-mono text-xs">{inv.snMac}</TableCell><TableCell>{inv.warrantyStatus}</TableCell><TableCell>{inv.thirdPartyPurchase ? 'Yes' : 'No'}</TableCell><TableCell><Button type="button" variant="ghost" size="icon" onClick={() => setInventories(p => p.filter((_, idx) => idx !== i))} className="h-7 w-7 text-red-500"><Trash2 className="w-3.5 h-3.5" /></Button></TableCell></TableRow>))}</TableBody></Table></div>
            )}
          </div>
          <Separator />

          {/* History */}
          <div className="space-y-4">
            <div className="flex items-center justify-between"><h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><Clock className="w-4 h-4" /> Service History ({serviceHistoryList.filter(h => !h._hidden).length})</h3><Button type="button" variant="outline" size="sm" onClick={() => setShowHistoryModal(true)} className="gap-1"><Plus className="w-3.5 h-3.5" /> Add History</Button></div>
            {serviceHistoryList.filter(h => !h._hidden).length > 0 && (
              <div className="border rounded-lg overflow-hidden"><Table><TableHeader><TableRow className="bg-gray-50/80"><TableHead>Task ID</TableHead><TableHead>Type</TableHead><TableHead>Date</TableHead><TableHead>Time</TableHead><TableHead>Details</TableHead><TableHead className="w-16"></TableHead></TableRow></TableHeader><TableBody>{serviceHistoryList.filter(h => !h._hidden).map((h, i) => (<TableRow key={i}><TableCell>{h.taskId}</TableCell><TableCell><Badge variant="outline">{h.serviceType}</Badge></TableCell><TableCell>{h.serviceDate}</TableCell><TableCell className="text-xs">{h.startTime}–{h.endTime}</TableCell><TableCell className="max-w-[150px] truncate">{h.serviceDetails}</TableCell><TableCell><Button type="button" variant="ghost" size="icon" onClick={() => removeHistory(i)} className="h-7 w-7 text-red-500"><Trash2 className="w-3.5 h-3.5" /></Button></TableCell></TableRow>))}</TableBody></Table></div>
            )}
          </div>
          <Separator />

          <div className="flex items-center gap-3">
            <Button type="submit" className="flex-1">{editingId ? 'Update Contract' : 'Create Contract'}</Button>
            <Button type="button" variant="outline" onClick={() => setShowPanel(false)} className="flex-1">Cancel</Button>
          </div>
        </form>
      </SlideFormPanel>

      {/* ── Inventory Sub-Modal ──────────────────────────── */}
      {showInventoryModal && (
        <div className="fixed inset-0 bg-black/30 flex justify-center items-center p-4 z-[60]">
          <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-semibold flex items-center gap-2"><Package className="w-5 h-5" /> Add Inventory Item</h3><Button variant="ghost" size="icon" onClick={() => setShowInventoryModal(false)}><X className="w-4 h-4" /></Button></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2"><Label>Product Category</Label><select value={inventoryForm.productType} onChange={e => setInventoryForm(p => ({ ...p, productType: e.target.value }))} className={selectCls} required><option value="">Select</option>{productTypes.map((p: any) => <option key={p.id} value={p.id}>{p.productName}</option>)}</select></div>
              <div className="space-y-2"><Label>Make &amp; Model</Label><Input value={inventoryForm.makeModel} onChange={e => setInventoryForm(p => ({ ...p, makeModel: e.target.value }))} /></div>
              <div className="space-y-2"><Label>SN / MAC</Label><Input value={inventoryForm.snMac} onChange={e => setInventoryForm(p => ({ ...p, snMac: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Description</Label><Input value={inventoryForm.description} onChange={e => setInventoryForm(p => ({ ...p, description: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Purchase Date</Label><Input type="date" value={inventoryForm.purchaseDate} onChange={e => setInventoryForm(p => ({ ...p, purchaseDate: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Warranty Period</Label><Input value={inventoryForm.warrantyPeriod} onChange={e => setInventoryForm(p => ({ ...p, warrantyPeriod: e.target.value }))} placeholder="e.g. 1 year" /></div>
              <div className="space-y-2"><Label>Warranty Status</Label><select value={inventoryForm.warrantyStatus} onChange={e => setInventoryForm(p => ({ ...p, warrantyStatus: e.target.value }))} className={selectCls}><option value="">Select</option><option value="Active">Active</option><option value="Expired">Expired</option></select></div>
              <div className="space-y-2"><Label>3rd Party Purchase</Label><select value={inventoryForm.thirdPartyPurchase ? 'Yes' : 'No'} onChange={e => setInventoryForm(p => ({ ...p, thirdPartyPurchase: e.target.value === 'Yes' }))} className={selectCls}><option value="No">No</option><option value="Yes">Yes</option></select></div>
            </div>
            <Separator className="my-4" />
            <div className="flex gap-3 justify-end"><Button variant="outline" onClick={() => setShowInventoryModal(false)}>Cancel</Button><Button onClick={handleAddInventory} disabled={!inventoryForm.productType.trim()}>Add Item</Button></div>
          </div>
        </div>
      )}

      {/* ── History Sub-Modal ────────────────────────────── */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/30 flex justify-center items-center p-4 z-[60]">
          <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-semibold flex items-center gap-2"><Clock className="w-5 h-5" /> Add Service History</h3><Button variant="ghost" size="icon" onClick={() => setShowHistoryModal(false)}><X className="w-4 h-4" /></Button></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div className="space-y-2 relative" onClick={e => e.stopPropagation()}>
                <Label>Task ID</Label>
                <Input value={historyFormModal.taskId} onChange={e => { setHistoryFormModal(p => ({ ...p, taskId: e.target.value })); setFilteredTasks(tasks.filter((t: any) => t.taskID?.toLowerCase().includes(e.target.value.toLowerCase()) || t.id.toString().includes(e.target.value))); setShowTaskSuggestions(true); }} onFocus={() => setShowTaskSuggestions(true)} placeholder="Search task…" />
                {showTaskSuggestions && filteredTasks.length > 0 && (
                  <ul className="absolute z-50 bg-white border w-full max-h-40 overflow-y-auto rounded-lg shadow-lg mt-1">{filteredTasks.map((t: any) => <li key={t.id} className="px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm" onClick={() => { setHistoryFormModal(p => ({ ...p, taskId: t.taskID || t.id.toString() })); setShowTaskSuggestions(false); }}>{t.taskID || `Task #${t.id}`}</li>)}</ul>
                )}
              </div>
              <div className="space-y-2"><Label>Service Type</Label><select value={historyFormModal.serviceType} onChange={e => setHistoryFormModal(p => ({ ...p, serviceType: e.target.value }))} className={selectCls}><option value="">Select</option><option value="On-Site Visit">On-Site Visit</option><option value="PM Visit">PM Visit</option><option value="Remote Support">Remote Support</option></select></div>
              <div className="space-y-2"><Label>Service Date</Label><Input type="date" value={historyFormModal.serviceDate} onChange={e => setHistoryFormModal(p => ({ ...p, serviceDate: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Start Time</Label><Input type="time" value={historyFormModal.startTime} onChange={e => setHistoryFormModal(p => ({ ...p, startTime: e.target.value }))} /></div>
              <div className="space-y-2"><Label>End Time</Label><Input type="time" value={historyFormModal.endTime} onChange={e => setHistoryFormModal(p => ({ ...p, endTime: e.target.value }))} /></div>
              <div className="space-y-2 lg:col-span-3"><Label>Service Details</Label><Textarea value={historyFormModal.serviceDetails} onChange={e => setHistoryFormModal(p => ({ ...p, serviceDetails: e.target.value }))} placeholder="Details…" className="min-h-[60px]" /></div>
            </div>
            <Separator className="my-4" />
            <div className="flex gap-3 justify-end"><Button variant="outline" onClick={() => setShowHistoryModal(false)}>Cancel</Button><Button onClick={handleAddHistory} disabled={!historyFormModal.taskId.trim()}>Add History</Button></div>
          </div>
        </div>
      )}
    </div>
  );
}
