'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search, ChevronLeft, ChevronRight, ShieldX, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/components/ui/table';
import SlideFormPanel from '@/components/ui/SlideFormPanel';

interface ContractWorkCategory {
  id?: number;
  contractWorkCategoryName: string;
}

interface PermissionSet { edit: boolean; read: boolean; create: boolean; delete: boolean; }
interface AllPermissions { [key: string]: PermissionSet; }

export default function ContractWorkPage() {
  const [categories, setCategories] = useState<ContractWorkCategory[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ContractWorkCategory>({ contractWorkCategoryName: '' });
  const [loading, setLoading] = useState(false);

  const [allPermissions, setAllPermissions] = useState<AllPermissions>({});
  const [loadingPermissions, setLoadingPermissions] = useState(true);
  const [userId, setUserId] = useState<number | null>(null);
  const [perms, setPerms] = useState<PermissionSet>({ edit: false, read: false, create: false, delete: false });

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const API_URL = 'https://enplerp.electrohelps.in/backend/contractworkcategory';
  const PERMISSIONS_API = 'https://enplerp.electrohelps.in/backend/user-permissions';

  const fetchPermissions = async (uid: number) => {
    try {
      const storedUserType = localStorage.getItem('userType');
      if (storedUserType === 'SUPERADMIN') {
        const all = { read: true, create: true, edit: true, delete: true };
        setAllPermissions({ SERVICE_CATEGORY: all });
        setPerms(all);
        setLoadingPermissions(false);
        return;
      }
      const res = await fetch(`${PERMISSIONS_API}/${uid}`);
      if (!res.ok) throw new Error('Failed');
      const raw = await res.text();
      if (!raw) { setLoadingPermissions(false); return; }
      const data = JSON.parse(raw);
      const p = data?.permissions?.permissions ?? {};
      setAllPermissions(p);
      setPerms(p.SERVICE_CATEGORY ?? { read: false, create: false, edit: false, delete: false });
    } catch { /* */ } finally { setLoadingPermissions(false); }
  };

  useEffect(() => { const id = localStorage.getItem('userId'); if (id) setUserId(Number(id)); }, []);
  useEffect(() => { if (userId) fetchPermissions(userId); }, [userId]);

  const fetchCategories = async () => {
    if (!perms.read) return;
    try {
      setLoading(true);
      const res = await fetch(API_URL);
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch { setCategories([]); } finally { setLoading(false); }
  };

  useEffect(() => { if (!loadingPermissions && perms.read) fetchCategories(); }, [loadingPermissions, perms.read]);

  const filtered = categories.filter(c =>
    c.contractWorkCategoryName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.id?.toString().includes(searchTerm)
  );
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const currentItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId && !perms.edit) return;
    if (!editingId && !perms.create) return;
    try {
      if (editingId) {
        const res = await fetch(`${API_URL}/${editingId}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contractWorkCategoryName: formData.contractWorkCategoryName }),
        });
        if (!res.ok) throw new Error('Failed');
      } else {
        const res = await fetch(API_URL, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!res.ok) throw new Error('Failed');
      }
      await fetchCategories();
      resetForm();
    } catch (err) { console.error('Error:', err); }
  };

  const handleEdit = (id: number) => {
    if (!perms.edit) return;
    const item = categories.find(c => c.id === id);
    if (item) {
      setFormData({ contractWorkCategoryName: item.contractWorkCategoryName });
      setEditingId(id);
      setShowPanel(true);
    }
  };

  const handleDelete = async (id: number) => {
    if (!perms.delete) return;
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      await fetchCategories();
    } catch (err) { console.error('Error:', err); }
  };

  const resetForm = () => { setShowPanel(false); setEditingId(null); setFormData({ contractWorkCategoryName: '' }); };

  const handleAddNew = () => {
    if (!perms.create) return;
    setFormData({ contractWorkCategoryName: '' });
    setEditingId(null);
    setShowPanel(true);
  };

  if (loadingPermissions) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
          <p className="text-sm text-gray-500">Loading permissions…</p>
        </div>
      </div>
    );
  }

  if (!perms.read) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center p-8 bg-white rounded-xl border border-gray-200 shadow-sm max-w-md">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <ShieldX className="w-6 h-6 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Access Denied</h3>
          <p className="text-sm text-gray-500">You don&apos;t have permission to view contract service categories.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Contract Service Categories</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage contract work category definitions</p>
        </div>
        <Button onClick={handleAddNew} disabled={!perms.create} className="gap-2">
          <Plus className="w-4 h-4" /> Add Category
        </Button>
      </div>

      <Separator />

      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search categories…" value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="pl-9" />
        </div>
        <Badge variant="secondary" className="shrink-0">{filtered.length} {filtered.length === 1 ? 'result' : 'results'}</Badge>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/80">
              <TableHead className="w-20">ID</TableHead>
              <TableHead>Category Name</TableHead>
              <TableHead className="w-28 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={3} className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" /></TableCell></TableRow>
            ) : currentItems.length > 0 ? (
              currentItems.map(item => (
                <TableRow key={item.id} className="hover:bg-gray-50/50">
                  <TableCell className="font-medium text-gray-500">#{item.id}</TableCell>
                  <TableCell className="font-medium text-gray-900">{item.contractWorkCategoryName}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(item.id!)} disabled={!perms.edit} className="h-8 w-8"><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id!)} disabled={!perms.delete} className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-12">
                  <p className="text-sm text-gray-500">{searchTerm ? 'No categories match your search' : 'No categories yet'}</p>
                  {!searchTerm && perms.create && (
                    <Button variant="outline" size="sm" onClick={handleAddNew} className="mt-3 gap-2"><Plus className="w-3.5 h-3.5" /> Add Your First Category</Button>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50/50">
            <p className="text-sm text-gray-500">Page {currentPage} of {totalPages}</p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft className="w-4 h-4" /></Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(page => (
                <Button key={page} variant={currentPage === page ? 'default' : 'outline'} size="icon" className="h-8 w-8" onClick={() => setCurrentPage(page)}>{page}</Button>
              ))}
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}><ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>
        )}
      </div>

      <SlideFormPanel title={editingId ? 'Edit Category' : 'Add Category'} description={editingId ? 'Update the contract service category' : 'Create a new contract service category'} isOpen={showPanel} onClose={resetForm} >
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="categoryName">Category Name</Label>
            <Input id="categoryName" value={formData.contractWorkCategoryName} onChange={e => setFormData({ ...formData, contractWorkCategoryName: e.target.value })} placeholder="Enter category name" required autoFocus />
          </div>
          <Separator />
          <div className="flex items-center gap-3">
            <Button type="submit" className="flex-1" disabled={editingId ? !perms.edit : !perms.create}>{editingId ? 'Update Category' : 'Create Category'}</Button>
            <Button type="button" variant="outline" onClick={resetForm} className="flex-1">Cancel</Button>
          </div>
        </form>
      </SlideFormPanel>
    </div>
  );
}
