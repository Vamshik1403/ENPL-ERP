'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  Plus, Pencil, Trash2, Search, ChevronLeft, ChevronRight,
  ShieldX, Loader2, Download, ArrowUpDown, ArrowUp, ArrowDown, X,
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
import { CustomerCombobox } from '@/components/ui/CustomerCombobox';
import { VendorCombobox } from '@/components/ui/VendorCombobox';
import SerialCombobox from '@/components/ui/SerialCombobox';
import MacAddressCombobox from '@/components/ui/MacAddressCombobox';
import Papa from 'papaparse';

/* ── types ─────────────────────────────────────────────── */
interface Vendor { id: number; vendorName: string; }
interface Site { id: number; siteName: string; addressBookId: number; }
interface Customer { id: number; customerName: string; sites: Site[]; }
interface Product { id: number; productName: string; }
interface InventoryItem { id: number; serialNumber: string; macAddress: string; productId: number; product: Product; vendorId: number; vendor: Vendor; }

interface DeliveryItem { serialNumber: string; macAddress: string; productId: number; inventoryId?: number; productName?: string; vendorId?: number; customerId?: number; siteId?: number; }
interface FormData {
  id?: number; deliveryType: string; refNumber?: string; salesOrderNo?: string;
  quotationNo?: string; purchaseInvoiceNo?: string; customerId?: number; siteId?: number; productId?: number; inventoryId?: number; vendorId?: number;
}
interface PermissionSet { edit: boolean; read: boolean; create: boolean; delete: boolean; }

const blankForm: FormData = { deliveryType: '', refNumber: '', salesOrderNo: '', quotationNo: '', purchaseInvoiceNo: '', customerId: 0, siteId: 0, vendorId: 0, productId: 0 };
const blankItem: DeliveryItem = { serialNumber: '', macAddress: '', productId: 0 };

const tableCols: { label: string; key: string; sortable: boolean }[] = [
  { label: 'Type', key: 'deliveryType', sortable: true },
  { label: 'Challan', key: 'deliveryChallan', sortable: true },
  { label: 'Sales Order', key: 'salesOrderNo', sortable: true },
  { label: 'Quotation', key: 'quotationNo', sortable: true },
  { label: 'Purchase Inv', key: 'purchaseInvoiceNo', sortable: true },
  { label: 'Ref No', key: 'refNumber', sortable: true },
  { label: 'Customer', key: 'customer', sortable: true },
  { label: 'Site', key: 'site', sortable: true },
  { label: 'Vendor', key: 'vendor', sortable: true },
  { label: 'Products', key: 'product', sortable: false },
  { label: 'Actions', key: 'actions', sortable: false },
];

const DELIVERY_API = 'https://enplerp.electrohelps.in/backend/material-delivery';
const PERM_API = 'https://enplerp.electrohelps.in/backend/user-permissions';

export default function MaterialPage() {
  const { toast } = useToast();
  const [deliveryList, setDeliveryList] = useState<any[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [inventoryList, setInventoryList] = useState<InventoryItem[]>([]);
  const [sites, setSites] = useState<Site[]>([]);

  const [formData, setFormData] = useState<FormData>({ ...blankForm });
  const [items, setItems] = useState<DeliveryItem[]>([{ ...blankItem }]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [itemErrors, setItemErrors] = useState<Record<number, Record<string, string>>>({});
  const [showPanel, setShowPanel] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [perms, setPerms] = useState<PermissionSet>({ edit: false, read: false, create: false, delete: false });
  const [loadingPerms, setLoadingPerms] = useState(true);
  const [userId, setUserId] = useState<number | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const itemsPerPage = 10;

  const isSaleOrDemo = formData.deliveryType === 'Sale' || formData.deliveryType === 'Demo';
  const isPurchaseReturn = formData.deliveryType === 'Purchase Return';

  /* ── perms ────────────────────────────────────────────── */
  useEffect(() => { 
    const id = localStorage.getItem('userId'); 
    if (id) setUserId(Number(id)); 
  }, []);
  
  useEffect(() => { 
    if (userId) fetchPerms(userId); 
  }, [userId]);

  const fetchPerms = async (uid: number) => {
    try {
      setLoadingPerms(true);

      // SUPERADMIN bypass
      if (localStorage.getItem('userType') === 'SUPERADMIN') {
        setPerms({ read: true, create: true, edit: true, delete: true });
        setLoadingPerms(false);
        return;
      }

      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const res = await fetch(`${PERM_API}/${uid}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (!res.ok) {
        console.warn(`Permission API returned ${res.status}, granting limited access.`);
        setPerms({ read: false, create: false, edit: false, delete: false });
        setLoadingPerms(false);
        return;
      }

      const data = await res.json();
      console.log('Permissions API response:', data);

      // Navigate the structure: data.permissions.permissions
      let permissionsObj = null;
      if (data?.permissions?.permissions) {
        permissionsObj = data.permissions.permissions;
        console.log('Extracted permissions object:', permissionsObj);
      } else {
        console.warn('Could not find permissions object in the expected structure.');
        setPerms({ read: false, create: false, edit: false, delete: false });
        setLoadingPerms(false);
        return;
      }

      // Look for the correct key: "MATERIAL_OUTWARD"
      const materialPerms = permissionsObj?.MATERIAL_OUTWARD;

      if (materialPerms) {
        console.log('MATERIAL_OUTWARD permissions found:', materialPerms);
        setPerms(materialPerms);
      } else {
        console.warn('MATERIAL_OUTWARD permission key not found. Check the key name in your permissions object.');
        setPerms({ read: false, create: false, edit: false, delete: false });
      }

    } catch (error) {
      console.error('Permission fetch error:', error);
      setPerms({ read: false, create: false, edit: false, delete: false });
    } finally {
      setLoadingPerms(false);
    }
  };

  /* ── data fetching ────────────────────────────────────── */
  const fetchAll = async () => {
    try {
      setLoading(true);
      const [custRes, vendRes, prodRes, invRes, delRes] = await Promise.all([
        fetch('https://enplerp.electrohelps.in/backend/address-book'), 
        fetch('https://enplerp.electrohelps.in/backend/vendors'),
        fetch('https://enplerp.electrohelps.in/backend/products'), 
        fetch('https://enplerp.electrohelps.in/backend/inventory'), 
        fetch(DELIVERY_API),
      ]);
      
      // Handle paginated response for customers
      const custData = await custRes.json();
      const customersArray = custData.data || custData;
      setCustomers(Array.isArray(customersArray) ? customersArray : []);
      
      // Vendors
      const vendData = await vendRes.json();
      setVendors(Array.isArray(vendData) ? vendData : []);
      
      // Products
      const prodData = await prodRes.json();
      setProducts(Array.isArray(prodData) ? prodData : []);
      
      // Handle inventory data
      const invData = await invRes.json();
      const invArray = Array.isArray(invData) ? invData : (invData.data || []);
      const flat = (invArray || []).flatMap((inv: any) => (inv.products || []).map((p: any) => ({ 
        id: p.id, 
        serialNumber: p.serialNumber, 
        macAddress: p.macAddress, 
        productId: p.productId, 
        product: p.product, 
        vendorId: inv.vendorId 
      })));
      setInventory(flat); 
      setInventoryList(flat);
      
      // Handle delivery data
      const delData = await delRes.json();
      setDeliveryList(Array.isArray(delData) ? delData.reverse() : []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({ title: 'Error loading data', description: 'Please refresh the page', variant: 'error' });
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    if (!loadingPerms && perms.read) {
      fetchAll(); 
    }
  }, [loadingPerms, perms.read]);

  useEffect(() => {
    // SAFE: Check if customers is array before using find
    const sel = Array.isArray(customers) 
      ? customers.find(c => c.id === formData.customerId) 
      : undefined;
    setSites(sel?.sites || []);
    setFormData(prev => ({ ...prev, siteId: undefined }));
  }, [formData.customerId, customers]);

  /* ── search / sort ─────────────────────────────────────── */
  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return deliveryList.filter(d =>
      d.refNumber?.toLowerCase().includes(q) || d.salesOrderNo?.toLowerCase().includes(q)
      || d.quotationNo?.toLowerCase().includes(q) || d.purchaseInvoiceNo?.toLowerCase().includes(q)
      || d.deliveryChallan?.toLowerCase().includes(q) || d.deliveryType?.toLowerCase().includes(q)
      || d.addressBook?.customerName?.toLowerCase().includes(q)
      || d.site?.siteName?.toLowerCase().includes(q) || d.vendor?.vendorName?.toLowerCase().includes(q)
      || d.materialDeliveryItems?.some((i: any) => i.serialNumber?.toLowerCase().includes(q) || i.product?.productName?.toLowerCase().includes(q))
    );
  }, [deliveryList, searchTerm]);

  const sorted = useMemo(() => {
    if (!sortField) return filtered;
    return [...filtered].sort((a, b) => {
      let av = a[sortField] ?? ''; 
      let bv = b[sortField] ?? '';
      
      // Handle nested fields for sorting
      if (sortField === 'customer') {
        av = a.addressBook?.customerName ?? '';
        bv = b.addressBook?.customerName ?? '';
      } else if (sortField === 'site') {
        av = a.site?.siteName ?? '';
        bv = b.site?.siteName ?? '';
      } else if (sortField === 'vendor') {
        av = a.vendor?.vendorName ?? '';
        bv = b.vendor?.vendorName ?? '';
      }
      
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortOrder === 'asc' ? av - bv : bv - av;
      }
      return sortOrder === 'asc' 
        ? String(av).localeCompare(String(bv)) 
        : String(bv).localeCompare(String(av));
    });
  }, [filtered, sortField, sortOrder]);

  const totalPages = Math.ceil(sorted.length / itemsPerPage);
  const paginated = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  
  const handleSort = (k: string) => { 
    if (sortField === k) {
      setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
    } else { 
      setSortField(k); 
      setSortOrder('asc'); 
    }
    setCurrentPage(1); 
  };

  /* ── CSV ──────────────────────────────────────────────── */
  const handleCSV = () => {
    if (!deliveryList.length) {
      toast({ title: 'No data to export', variant: 'warning' });
      return;
    }
    
    const allSites: Site[] = customers.flatMap(c => c.sites || []);
    const csv = Papa.unparse(deliveryList.map(d => ({
      'Delivery Type': d.deliveryType || 'N/A', 
      'Reference Number': d.refNumber || 'N/A', 
      'Sales Order No': d.salesOrderNo || 'N/A',
      'Quotation No': d.quotationNo || 'N/A', 
      'Purchase Invoice No': d.purchaseInvoiceNo || 'N/A', 
      'Delivery Challan': d.deliveryChallan || 'N/A',
      'Customer': Array.isArray(customers) 
        ? customers.find(c => c.id === d.customerId)?.customerName || 'N/A'
        : 'N/A',
      'Site': Array.isArray(allSites) 
        ? allSites.find(s => s.id === d.siteId)?.siteName || 'N/A'
        : 'N/A',
      'Vendor': Array.isArray(vendors) 
        ? vendors.find(v => v.id === d.vendorId)?.vendorName || 'N/A'
        : 'N/A',
      'Products': (d.materialDeliveryItems || []).map((i: any) => { 
        const inv = inventory.find(iv => iv.id === i.inventoryId); 
        const productName = Array.isArray(products) 
          ? products.find(p => p.id === i.productId)?.productName 
          : inv?.product?.productName || 'N/A';
        return `${productName} (SN: ${inv?.serialNumber || i.serialNumber || 'N/A'}, MAC: ${inv?.macAddress || i.macAddress || 'N/A'})`; 
      }).join('; '),
    })));
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); 
    a.href = URL.createObjectURL(blob); 
    a.download = `material_deliveries_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a); 
    a.click(); 
    document.body.removeChild(a);
    
    toast({ title: 'Export successful', description: `${deliveryList.length} records exported`, variant: 'success' });
  };

  /* ── form validation ──────────────────────────────────── */
  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    const iErrs: Record<number, Record<string, string>> = {};
    
    if (!formData.deliveryType) errs.deliveryType = 'Delivery type is required';
    
    if (isSaleOrDemo && !formData.customerId) {
      errs.customerId = 'Customer is required for Sale or Demo';
    }
    
    if (isSaleOrDemo && formData.customerId && !formData.siteId) {
      errs.siteId = 'Site is required';
    }
    
    if (isPurchaseReturn && !formData.vendorId) {
      errs.vendorId = 'Vendor is required for Purchase Return';
    }
    
    if (items.length === 0) {
      errs.items = 'At least one item is required';
    }
    
    items.forEach((item, i) => {
      const ie: Record<string, string> = {};
      if (!item.serialNumber?.trim() && !item.macAddress?.trim()) { 
        ie.serialNumber = 'Serial or MAC required'; 
        ie.macAddress = 'Serial or MAC required'; 
      }
      if (!item.productId) ie.productId = 'Product is required';
      if (Object.keys(ie).length) iErrs[i] = ie;
    });
    
    setErrors(errs); 
    setItemErrors(iErrs);
    return Object.keys(errs).length === 0 && Object.keys(iErrs).length === 0;
  };

  /* ── form handlers ────────────────────────────────────── */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'customerId' || name === 'vendorId' || name === 'siteId' 
        ? (value ? parseInt(value) : undefined) 
        : value 
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleItemChange = (idx: number, field: keyof DeliveryItem, value: string) => {
    const u = [...items]; 
    
    if (field === 'serialNumber' || field === 'macAddress') {
      u[idx][field] = value;
      
      // Try to find matching inventory item
      const found = inventory.find(inv => 
        inv.serialNumber === value || inv.macAddress === value
      );
      
      if (found) { 
        u[idx].productId = found.productId; 
        u[idx].inventoryId = found.id; 
        u[idx].serialNumber = found.serialNumber; 
        u[idx].macAddress = found.macAddress; 
        u[idx].productName = found.product?.productName || 'Unknown'; 
        u[idx].vendorId = found.vendorId; 
      }
    } else {
      (u[idx] as any)[field] = value;
    }
    
    setItems(u);
    
    // Clear errors for this field if any
    if (itemErrors[idx]?.[field]) { 
      setItemErrors(prev => { 
        const n = { ...prev }; 
        if (n[idx]) { 
          n[idx] = { ...n[idx] }; 
          delete n[idx][field]; 
          if (!Object.keys(n[idx]).length) delete n[idx]; 
        } 
        return n; 
      }); 
    }
  };

  const addItem = () => setItems(prev => [...prev, { ...blankItem }]);
  
  const removeItem = (idx: number) => { 
    if (items.length <= 1) {
      toast({ title: 'Cannot remove last item', variant: 'warning' });
      return;
    } 
    setItems(prev => prev.filter((_, i) => i !== idx)); 
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast({ title: 'Please fix validation errors', variant: 'error' });
      return;
    }
    
    try {
      setSaving(true);
      
      // Filter out items without inventoryId
      const validItems = items.filter(i => i.inventoryId);
      
      if (validItems.length === 0) {
        toast({ title: 'At least one valid item with inventory is required', variant: 'error' });
        setSaving(false);
        return;
      }
      
      const payload = {
        ...formData,
        customerId: isSaleOrDemo ? formData.customerId : undefined,
        siteId: formData.siteId || undefined,
        vendorId: isPurchaseReturn ? formData.vendorId : undefined,
        materialDeliveryItems: validItems.map(i => ({ 
          inventoryId: i.inventoryId, 
          serialNumber: i.serialNumber, 
          macAddress: i.macAddress, 
          productId: i.productId, 
          productName: i.productName || 'Unknown' 
        })),
      };
      
      const url = formData.id ? `${DELIVERY_API}/${formData.id}` : DELIVERY_API;
      const method = formData.id ? 'PUT' : 'POST';
      
      const res = await fetch(url, { 
        method, 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload) 
      });
      
      if (!res.ok) { 
        const err = await res.json().catch(() => null); 
        toast({ 
          title: 'Save failed', 
          description: err?.message || 'Failed to save delivery', 
          variant: 'error' 
        }); 
        return; 
      }
      
      toast({ 
        title: formData.id ? 'Delivery updated' : 'Delivery created', 
        variant: 'success' 
      });
      
      await fetchAll(); 
      resetForm();
    } catch (error) {
      console.error('Error saving:', error);
      toast({ title: 'Error saving delivery', variant: 'error' }); 
    } finally { 
      setSaving(false); 
    }
  };

  const openEdit = (d: any) => {
    if (!perms.edit) {
      toast({ title: 'No edit permission', variant: 'error' });
      return;
    }
    
    const enriched = (d.materialDeliveryItems || []).map((it: any) => {
      const inv = inventory.find(i => i.id === it.inventoryId);
      
      return { 
        inventoryId: it.inventoryId || 0, 
        serialNumber: it.serialNumber || inv?.serialNumber || '', 
        macAddress: it.macAddress || inv?.macAddress || '', 
        productId: it.productId || inv?.productId || 0, 
        productName: inv?.product?.productName || 'Unknown', 
        vendorId: d.vendorId || inv?.vendorId || undefined, 
        customerId: d.customerId || undefined, 
        siteId: d.siteId || undefined 
      };
    });
    
    setFormData({ 
      id: d.id, 
      deliveryType: d.deliveryType || '', 
      refNumber: d.refNumber || '', 
      salesOrderNo: d.salesOrderNo || '', 
      quotationNo: d.quotationNo || '', 
      purchaseInvoiceNo: d.purchaseInvoiceNo || '', 
      customerId: d.customerId || 0, 
      siteId: d.siteId || 0, 
      vendorId: d.vendorId || 0 
    });
    
    setItems(enriched.length ? enriched : [{ ...blankItem }]);
    setErrors({}); 
    setItemErrors({});
    setShowPanel(true);
  };

  const handleDelete = async (id: number) => { 
    if (!perms.delete) {
      toast({ title: 'No delete permission', variant: 'error' });
      return;
    }
    
    if (!confirm('Are you sure you want to delete this delivery?')) return; 
    
    try { 
      await fetch(`${DELIVERY_API}/${id}`, { method: 'DELETE' }); 
      await fetchAll(); 
      toast({ title: 'Delivery deleted', variant: 'success' }); 
    } catch (error) {
      console.error('Error deleting:', error);
      toast({ title: 'Error deleting delivery', variant: 'error' }); 
    } 
  };

  const resetForm = () => { 
    setShowPanel(false); 
    setFormData({ ...blankForm }); 
    setItems([{ ...blankItem }]); 
    setErrors({}); 
    setItemErrors({}); 
    setSites([]);
  };
  
  const handleAddNew = () => { 
    if (!perms.create) {
      toast({ title: 'No create permission', variant: 'error' });
      return;
    }
    resetForm(); 
    setShowPanel(true); 
  };

  /* ── helpers ──────────────────────────────────────────── */
  const typeBadge = (t: string) => {
    const cls = t === 'Sale' 
      ? 'bg-green-100 text-green-700 border-green-200' 
      : t === 'Demo' 
        ? 'bg-blue-100 text-blue-700 border-blue-200' 
        : 'bg-amber-100 text-amber-700 border-amber-200';
    return <Badge className={`${cls} font-medium px-3 py-1`}>{t}</Badge>;
  };

  const SortIcon = ({ col }: { col: string }) => {
    if (sortField !== col) return <ArrowUpDown className="w-3.5 h-3.5 ml-1 text-gray-400" />;
    return sortOrder === 'asc' 
      ? <ArrowUp className="w-3.5 h-3.5 ml-1 text-indigo-600" /> 
      : <ArrowDown className="w-3.5 h-3.5 ml-1 text-indigo-600" />;
  };

  /* ── guards ───────────────────────────────────────────── */
  if (loadingPerms) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
        <p className="text-sm text-gray-500">Loading permissions…</p>
      </div>
    </div>
  );
  
  if (!perms.read) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center p-8 bg-white rounded-xl border border-gray-200 shadow-sm max-w-md">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <ShieldX className="w-6 h-6 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Access Denied</h3>
        <p className="text-sm text-gray-500">You don&apos;t have permission to view material deliveries.</p>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Material Outward</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage material delivery records</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleCSV} className="gap-2" disabled={!deliveryList.length}>
            <Download className="w-4 h-4" /> CSV
          </Button>
          <Button onClick={handleAddNew} disabled={!perms.create} className="gap-2">
            <Plus className="w-4 h-4" /> Add Delivery
          </Button>
        </div>
      </div>
      
      <Separator />
      
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input 
            placeholder="Search deliveries…" 
            value={searchTerm} 
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
            className="pl-9" 
          />
        </div>
        <Badge variant="secondary" className="shrink-0">
          {sorted.length} {sorted.length === 1 ? 'result' : 'results'}
        </Badge>
      </div>

      {/* table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80">
                {tableCols.map(c => (
                  <TableHead 
                    key={c.key} 
                    className={`whitespace-nowrap text-xs ${c.sortable ? 'cursor-pointer select-none' : ''} ${c.key === 'actions' ? 'text-right' : ''}`} 
                    onClick={() => c.sortable && handleSort(c.key)}
                  >
                    <span className="inline-flex items-center">
                      {c.label}
                      {c.sortable && <SortIcon col={c.key} />}
                    </span>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={tableCols.length} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                      <p className="text-sm text-gray-500">Loading deliveries...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginated.length > 0 ? (
                paginated.map((d, index) => (
                  <TableRow 
                    key={d.id} 
                    className={`hover:bg-gray-50/50 transition-colors ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                    }`}
                  >
                    <TableCell className="py-4">{typeBadge(d.deliveryType)}</TableCell>
                    <TableCell className="font-medium text-gray-900">
                      {d.deliveryChallan || <span className="text-gray-400">—</span>}
                    </TableCell>
                    <TableCell>{d.salesOrderNo || <span className="text-gray-400">—</span>}</TableCell>
                    <TableCell>{d.quotationNo || <span className="text-gray-400">—</span>}</TableCell>
                    <TableCell>{d.purchaseInvoiceNo || <span className="text-gray-400">—</span>}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {d.refNumber || <span className="text-gray-400">—</span>}
                    </TableCell>
                    <TableCell>
                      {d.addressBook?.customerName || <span className="text-gray-400">—</span>}
                    </TableCell>
                    <TableCell>
                      {d.site?.siteName || <span className="text-gray-400">—</span>}
                    </TableCell>
                    <TableCell>
                      {d.vendor?.vendorName || <span className="text-gray-400">—</span>}
                    </TableCell>
                    <TableCell className="max-w-[180px]">
                      <div className="flex flex-col gap-1.5">
                        {d.materialDeliveryItems?.map((i: any, idx: number) => (
                          <div key={idx} className="text-xs bg-gray-50 p-2 rounded border border-gray-100">
                            <div className="font-medium text-gray-900">{i.product?.productName || 'N/A'}</div>
                            {i.serialNumber && (
                              <div className="text-gray-500 mt-0.5">SN: {i.serialNumber}</div>
                            )}
                          </div>
                        )) || <span className="text-gray-400 text-xs">No items</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => openEdit(d)} 
                          disabled={!perms.edit} 
                          className="h-8 w-8 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDelete(d.id)} 
                          disabled={!perms.delete} 
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={tableCols.length} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <p className="text-sm text-gray-500">
                        {searchTerm ? 'No deliveries match your search' : 'No deliveries yet'}
                      </p>
                      {!searchTerm && perms.create && (
                        <Button variant="outline" size="sm" onClick={handleAddNew} className="mt-3 gap-2">
                          <Plus className="w-3.5 h-3.5" /> Add First Delivery
                        </Button>
                      )}
                    </div>
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
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8" 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm px-2">
                {currentPage} / {totalPages}
              </span>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8" 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* slide panel form */}
      <SlideFormPanel 
        title={formData.id ? 'Edit Delivery' : 'Add Delivery'} 
        description={formData.id ? 'Update material delivery details' : 'Record a new material delivery'} 
        isOpen={showPanel} 
        onClose={resetForm} 
      >
        <form onSubmit={handleSave} className="p-6 space-y-5 overflow-y-auto max-h-[calc(100vh-120px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Delivery Type <span className="text-red-500">*</span></Label>
              <select 
                name="deliveryType" 
                value={formData.deliveryType} 
                onChange={handleChange} 
                className={`flex h-9 w-full rounded-md border ${errors.deliveryType ? 'border-red-500' : 'border-input'} bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring`}
              >
                <option value="">Select Type</option>
                <option value="Sale">Sale</option>
                <option value="Demo">Demo</option>
                <option value="Purchase Return">Purchase Return</option>
              </select>
              {errors.deliveryType && <p className="text-xs text-red-600">{errors.deliveryType}</p>}
            </div>
            <div className="space-y-2">
              <Label>Reference Number</Label>
              <Input name="refNumber" value={formData.refNumber || ''} onChange={handleChange} placeholder="Reference #" />
            </div>

            {isSaleOrDemo && (
              <>
                <div className="space-y-2">
                  <Label>Customer <span className="text-red-500">*</span></Label>
                  <CustomerCombobox 
                    selectedValue={formData.customerId ?? 0} 
                    onSelect={v => { 
                      setFormData(p => ({ ...p, customerId: v })); 
                      if (errors.customerId) setErrors(p => ({ ...p, customerId: '' })); 
                    }} 
                    placeholder="Select Customer" 
                  />
                  {errors.customerId && <p className="text-xs text-red-600">{errors.customerId}</p>}
                </div>
                {formData.customerId ? (
                  <div className="space-y-2">
                    <Label>Site <span className="text-red-500">*</span></Label>
                    <select 
                      name="siteId" 
                      value={formData.siteId ?? ''} 
                      onChange={handleChange} 
                      className={`flex h-9 w-full rounded-md border ${errors.siteId ? 'border-red-500' : 'border-input'} bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring`}
                    >
                      <option value="">Select Site</option>
                      {Array.isArray(sites) && sites.map(s => (
                        <option key={s.id} value={s.id}>{s.siteName}</option>
                      ))}
                    </select>
                    {errors.siteId && <p className="text-xs text-red-600">{errors.siteId}</p>}
                  </div>
                ) : null}
              </>
            )}

            {isPurchaseReturn && (
              <div className="space-y-2">
                <Label>Vendor <span className="text-red-500">*</span></Label>
                <VendorCombobox 
                  selectedValue={formData.vendorId ?? 0} 
                  onSelect={v => { 
                    setFormData(p => ({ ...p, vendorId: v })); 
                    if (errors.vendorId) setErrors(p => ({ ...p, vendorId: '' })); 
                  }} 
                  placeholder="Select Vendor" 
                />
                {errors.vendorId && <p className="text-xs text-red-600">{errors.vendorId}</p>}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Sales Order No</Label>
              <Input name="salesOrderNo" value={formData.salesOrderNo || ''} onChange={handleChange} disabled={formData.deliveryType !== 'Sale'} className={formData.deliveryType !== 'Sale' ? 'bg-gray-50' : ''} />
            </div>
            <div className="space-y-2">
              <Label>Quotation No</Label>
              <Input name="quotationNo" value={formData.quotationNo || ''} onChange={handleChange} disabled={formData.deliveryType !== 'Demo'} className={formData.deliveryType !== 'Demo' ? 'bg-gray-50' : ''} />
            </div>
            <div className="space-y-2">
              <Label>Purchase Invoice No</Label>
              <Input name="purchaseInvoiceNo" value={formData.purchaseInvoiceNo || ''} onChange={handleChange} disabled={formData.deliveryType !== 'Purchase Return'} className={formData.deliveryType !== 'Purchase Return' ? 'bg-gray-50' : ''} />
            </div>
          </div>

          <Separator />

          {/* items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base">Items</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-1">
                <Plus className="w-3.5 h-3.5" /> Add Item
              </Button>
            </div>
            {items.map((item, i) => (
              <div key={i} className="relative border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50/50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-500">Item {i + 1}</span>
                  {items.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(i)} className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50">
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Serial Number</Label>
                    <SerialCombobox 
                      selectedValue={item.inventoryId || 0} 
                      onSelect={v => { 
                        const inv = inventoryList.find(x => x.id === v); 
                        if (inv) { 
                          const u = [...items]; 
                          u[i] = { ...u[i], serialNumber: inv.serialNumber, macAddress: inv.macAddress, productId: inv.productId, inventoryId: inv.id, productName: inv.product?.productName || 'Unknown' }; 
                          setItems(u); 
                        } 
                      }} 
                      onInputChange={v => handleItemChange(i, 'serialNumber', v)} 
                      placeholder="Select Serial" 
                    />
                    {itemErrors[i]?.serialNumber && <p className="text-xs text-red-600">{itemErrors[i]?.serialNumber}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">MAC Address</Label>
                    <MacAddressCombobox 
                      selectedValue={inventoryList.find(x => x.macAddress === item.macAddress)?.id || 0} 
                      onSelect={v => { 
                        const inv = inventoryList.find(x => x.id === v); 
                        if (inv) { 
                          const u = [...items]; 
                          u[i] = { ...u[i], macAddress: inv.macAddress, serialNumber: inv.serialNumber, productId: inv.productId, inventoryId: inv.id, productName: inv.product?.productName || 'Unknown' }; 
                          setItems(u); 
                        } 
                      }} 
                      onInputChange={v => handleItemChange(i, 'macAddress', v)} 
                      placeholder="Select MAC" 
                    />
                    {itemErrors[i]?.macAddress && <p className="text-xs text-red-600">{itemErrors[i]?.macAddress}</p>}
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <Label className="text-xs">Product (auto-filled)</Label>
                    <Input readOnly value={Array.isArray(products) ? (products.find(p => p.id === item.productId)?.productName || '') : ''} className="bg-gray-50" />
                    {itemErrors[i]?.productId && <p className="text-xs text-red-600">{itemErrors[i]?.productId}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Separator />
          <div className="flex items-center gap-3">
            <Button type="submit" className="flex-1" disabled={saving}>
              {saving ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" />{formData.id ? 'Updating…' : 'Creating…'}</>
              ) : (
                formData.id ? 'Update Delivery' : 'Create Delivery'
              )}
            </Button>
            <Button type="button" variant="outline" onClick={resetForm} className="flex-1" disabled={saving}>
              Cancel
            </Button>
          </div>
        </form>
      </SlideFormPanel>
    </div>
  );
}