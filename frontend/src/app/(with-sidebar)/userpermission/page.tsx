'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Plus, Pencil, Trash2, Search, RefreshCw, Eye, EyeOff, Shield,
  ChevronLeft, ChevronRight, Loader2, X,
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
interface User {
  id?: number; username: string; password?: string; fullName?: string;
  email?: string; userType?: string; department?: string; createdAt?: string;
}
interface Department { id: number; departmentName: string; }
type CrudPerm = { read: boolean; create: boolean; edit: boolean; delete: boolean };
type PermissionsJson = Record<string, CrudPerm>;

/* ── API endpoints ─────────────────────────────────────── */
const API = {
  LIST: 'https://enplerp.electrohelps.in/backend/auth/users',
  REGISTER: 'https://enplerp.electrohelps.in/backend/auth/register',
  UPDATE: 'https://enplerp.electrohelps.in/backend/auth/users',
  DELETE: 'https://enplerp.electrohelps.in/backend/auth/users',
  PERMISSION: (uid: number) => `https://enplerp.electrohelps.in/backend/user-permissions/${uid}`,
  DEPARTMENTS: 'https://enplerp.electrohelps.in/backend/department',
};

/* ── modules ───────────────────────────────────────────── */
const MODULES: { key: string; label: string }[] = [
  { key: 'DASHBOARD', label: 'Dashboard' },
  { key: 'CUSTOMERS', label: 'Customers' },
  { key: 'SITES', label: 'Sites' },
  { key: 'VENDORS', label: 'Vendors' },
  { key: 'CUSTOMER_REGISTRATION', label: 'Customer Registration' },
  { key: 'CATEGORIES', label: 'Categories' },
  { key: 'SUBCATEGORIES', label: 'Subcategories' },
  { key: 'PRODUCTS_SKU', label: 'Products SKU' },
  { key: 'INVENTORY', label: 'Inventory' },
  { key: 'PURCHASE_INVOICE', label: 'Purchase Invoice' },
  { key: 'MATERIAL_OUTWARD', label: 'Material Outward' },
  { key: 'VENDORS_PAYMENTS', label: 'Vendors Payments' },
  { key: 'TASKS', label: 'Tasks' },
  { key: 'SERVICE_CONTRACTS', label: 'Service Contracts' },
  { key: 'DEPARTMENTS', label: 'Departments' },
  { key: 'SERVICE_CATEGORY', label: 'Service Category' },
  { key: 'WORKSCOPE_CATEGORY', label: 'WorkScope Category' },
  { key: 'USERS', label: 'Users Permission' },
  { key: 'DASHBOARD_METRICS', label: 'Dashboard Key Metrics' },
  { key: 'DASHBOARD_INVENTORY', label: 'Dashboard Inventory Metrics' },
  { key: 'DASHBOARD_TASKS', label: 'Dashboard Task Analysis' },
  { key: 'DASHBOARD_RESOURCES', label: 'Dashboard Additional Resources' },
  { key: 'DASHBOARD_QUICK_ACTIONS', label: 'Dashboard Quick Actions' },
];

const emptyCrud = (): CrudPerm => ({ read: false, create: false, edit: false, delete: false });

function normalizePermissions(raw: any): PermissionsJson {
  const base: PermissionsJson = {};
  for (const m of MODULES) base[m.key] = emptyCrud();
  if (!raw) return base;
  const p = raw?.permissions?.permissions ?? raw?.permissions ?? raw;
  if (p && typeof p === 'object') {
    for (const k of Object.keys(p)) {
      const v = p[k];
      if (!v || typeof v !== 'object') continue;
      if (base.hasOwnProperty(k)) base[k] = { read: !!v.read, create: !!v.create, edit: !!v.edit, delete: !!v.delete };
    }
  }
  return base;
}

const safeFetchJson = async (r: Response) => { const t = await r.text(); if (!t.trim()) return null; try { return JSON.parse(t); } catch { return null; } };
const getAuthHeaders = () => { const t = localStorage.getItem('access_token'); return { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) }; };

const selectCls = 'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';

/* ── grouped modules ───────────────────────────────────── */
const groupedModules: Record<string, typeof MODULES> = {
  'Main Modules': MODULES.filter(m => ['DASHBOARD','CUSTOMERS','SITES','VENDORS','CUSTOMER_REGISTRATION','TASKS','SERVICE_CONTRACTS'].includes(m.key)),
  'Dashboard Modules': MODULES.filter(m => m.key.startsWith('DASHBOARD_')),
  'Inventory Modules': MODULES.filter(m => ['CATEGORIES','SUBCATEGORIES','PRODUCTS_SKU','INVENTORY','PURCHASE_INVOICE','MATERIAL_OUTWARD','VENDORS_PAYMENTS'].includes(m.key)),
  'Setup Modules': MODULES.filter(m => ['DEPARTMENTS','SERVICE_CATEGORY','WORKSCOPE_CATEGORY','USERS'].includes(m.key)),
};

/* ═══════════════════════════════════════════════════════ */
export default function UsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [usersError, setUsersError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  /* user form panel */
  const [showUserPanel, setShowUserPanel] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [userForm, setUserForm] = useState<User>({ username: '', password: '', fullName: '', userType: '', email: '', department: '' });
  const [savingUser, setSavingUser] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  /* permissions panel */
  const [showPermPanel, setShowPermPanel] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<PermissionsJson>(() => normalizePermissions(null));
  const [loadingPerm, setLoadingPerm] = useState(false);
  const [savingPerm, setSavingPerm] = useState(false);
  const [permError, setPermError] = useState('');
  const [selectAll, setSelectAll] = useState(false);

  /* pagination */
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginated = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  /* ── fetch ────────────────────────────────────────────── */
  const fetchDepartments = useCallback(async () => {
    try { const r = await fetch(API.DEPARTMENTS, { headers: getAuthHeaders() }); if (r.ok) { const d = await safeFetchJson(r); if (Array.isArray(d)) setDepartments(d); } } catch { /* */ }
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true); setUsersError('');
    try { const r = await fetch(API.LIST, { headers: getAuthHeaders() }); if (!r.ok) throw new Error(`${r.status}`); const d = await safeFetchJson(r); setUsers(Array.isArray(d) ? d : []); } catch (e: any) { setUsersError(e.message); setUsers([]); } finally { setLoadingUsers(false); }
  }, []);

  useEffect(() => { fetchUsers(); fetchDepartments(); }, [fetchUsers, fetchDepartments]);

  useEffect(() => {
    const t = search.toLowerCase();
    setFilteredUsers(users.filter(u => u.username?.toLowerCase().includes(t) || u.fullName?.toLowerCase().includes(t) || u.userType?.toLowerCase().includes(t) || u.email?.toLowerCase().includes(t) || u.department?.toLowerCase().includes(t)));
    setCurrentPage(1);
  }, [search, users]);

  /* ── user CRUD ────────────────────────────────────────── */
  const openAddUser = () => { setEditingId(null); setUserForm({ username: '', password: '', fullName: '', userType: '', email: '', department: '' }); setShowPwd(false); setShowUserPanel(true); };
  const openEditUser = (u: User) => { setEditingId(u.id || null); setUserForm({ username: u.username || '', password: '', fullName: u.fullName || '', userType: u.userType || '', email: u.email || '', department: u.department || '' }); setShowPwd(false); setShowUserPanel(true); };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSavingUser(true);
    try {
      const payload: any = { username: userForm.username, fullName: userForm.fullName, userType: userForm.userType, email: userForm.email, department: userForm.department };
      if (!editingId) payload.password = userForm.password; else if (userForm.password?.trim()) payload.password = userForm.password;
      const url = editingId ? `${API.UPDATE}/${editingId}` : API.REGISTER;
      const r = await fetch(url, { method: editingId ? 'PATCH' : 'POST', headers: getAuthHeaders(), body: JSON.stringify(payload) });
      if (!r.ok) { const t = await r.text(); throw new Error(t); }
      setShowUserPanel(false); fetchUsers();
    } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'error' }); } finally { setSavingUser(false); }
  };

  const deleteUser = async (id?: number) => {
    if (!id || !confirm('Delete this user?')) return;
    try { const r = await fetch(`${API.DELETE}/${id}`, { method: 'DELETE', headers: getAuthHeaders() }); if (!r.ok) throw new Error(); fetchUsers(); } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'error' }); }
  };

  /* ── permissions ──────────────────────────────────────── */
  const openPermissions = async (user: User) => {
    if (!user.id) return;
    setSelectedUser(user); setShowPermPanel(true); setPermError(''); setLoadingPerm(true); setSelectAll(false);
    try {
      const r = await fetch(API.PERMISSION(user.id), { headers: getAuthHeaders() });
      if (r.status === 404) { setPermissions(normalizePermissions(null)); return; }
      if (!r.ok) throw new Error(`${r.status}`);
      const d = await safeFetchJson(r); setPermissions(normalizePermissions(d));
    } catch (e: any) { setPermError(e.message); setPermissions(normalizePermissions(null)); } finally { setLoadingPerm(false); }
  };

  const savePermissions = async () => {
    if (!selectedUser?.id) return;
    setPermError(''); setSavingPerm(true);
    try {
      const r = await fetch(API.PERMISSION(selectedUser.id), { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify({ permissions }) });
      if (!r.ok) throw new Error(`${r.status}`);
      setShowPermPanel(false); setSelectedUser(null);
    } catch (e: any) { setPermError(e.message); } finally { setSavingPerm(false); }
  };

  const isAllChecked = (p: CrudPerm) => p.read && p.create && p.edit && p.delete;
  const toggleAllForModule = (key: string, checked: boolean) => setPermissions(prev => ({ ...prev, [key]: { read: checked, create: checked, edit: checked, delete: checked } }));
  const setModulePerm = (key: string, patch: Partial<CrudPerm>) => setPermissions(prev => ({ ...prev, [key]: { ...(prev[key] || emptyCrud()), ...patch } }));
  const toggleSelectAll = () => {
    const nv = !selectAll; setSelectAll(nv);
    const np = { ...permissions }; MODULES.forEach(m => { np[m.key] = { read: nv, create: nv, edit: nv, delete: nv }; }); setPermissions(np);
  };

  const typeBadge = (t?: string) => {
    switch (t) {
      case 'SUPERADMIN': return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Superadmin</Badge>;
      case 'ADMIN': return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Admin</Badge>;
      case 'USER': return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">User</Badge>;
      default: return <Badge variant="outline">Not set</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-xl font-semibold text-gray-900">Users &amp; Permissions</h1><p className="text-sm text-gray-500 mt-0.5">Manage system users and their access permissions</p></div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchUsers} disabled={loadingUsers} className="gap-2"><RefreshCw className={`w-4 h-4 ${loadingUsers ? 'animate-spin' : ''}`} /> Refresh</Button>
          <Button onClick={openAddUser} className="gap-2"><Plus className="w-4 h-4" /> Add User</Button>
        </div>
      </div>
      <Separator />

      {usersError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          <strong>Error loading users:</strong> {usersError}
          <button onClick={fetchUsers} className="ml-2 underline hover:text-red-800">Try again</button>
        </div>
      )}

      {/* search */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><Input placeholder="Search users…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>
        <Badge variant="secondary" className="shrink-0">{filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'}</Badge>
      </div>

      {/* table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80">
                <TableHead>Username</TableHead><TableHead>Full Name</TableHead><TableHead>Type</TableHead>
                <TableHead>Department</TableHead><TableHead>Email</TableHead><TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingUsers ? (
                <TableRow><TableCell colSpan={6} className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" /></TableCell></TableRow>
              ) : paginated.length > 0 ? paginated.map(u => (
                <TableRow key={u.id} className="hover:bg-gray-50/50 text-sm">
                  <TableCell><div className="font-medium">{u.username}</div><div className="text-xs text-gray-400">ID #{u.id}</div></TableCell>
                  <TableCell>{u.fullName || '—'}</TableCell>
                  <TableCell>{typeBadge(u.userType)}</TableCell>
                  <TableCell>{u.department || '—'}</TableCell>
                  <TableCell>{u.email || '—'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditUser(u)} className="h-8 w-8" title="Edit User"><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteUser(u.id)} className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" title="Delete User"><Trash2 className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => openPermissions(u)} className="h-8 w-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50" title="Manage Permissions"><Shield className="w-3.5 h-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={6} className="text-center py-12"><p className="text-sm text-gray-500">{search ? 'No users match your search' : 'No users found'}</p></TableCell></TableRow>
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

      {/* ── User Slide Panel ──────────────────────────────── */}
      <SlideFormPanel title={editingId ? 'Edit User' : 'Add User'} description="Create or update a user account" isOpen={showUserPanel} onClose={() => setShowUserPanel(false)}>
        <form onSubmit={handleUserSubmit} className="p-6 space-y-5">
          <div className="space-y-2"><Label>Username <span className="text-red-500">*</span></Label><Input value={userForm.username} onChange={e => setUserForm(f => ({ ...f, username: e.target.value }))} required disabled={savingUser} /></div>
          <div className="space-y-2">
            <Label>Password {editingId && <span className="text-xs text-gray-400 ml-1">(leave blank to keep current)</span>}</Label>
            <div className="relative">
              <Input type={showPwd ? 'text' : 'password'} value={userForm.password || ''} onChange={e => setUserForm(f => ({ ...f, password: e.target.value }))} required={!editingId} disabled={savingUser} className="pr-10" />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setShowPwd(!showPwd)}>{showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
            </div>
          </div>
          <div className="space-y-2"><Label>Full Name</Label><Input value={userForm.fullName || ''} onChange={e => setUserForm(f => ({ ...f, fullName: e.target.value }))} disabled={savingUser} /></div>
          <div className="space-y-2"><Label>User Type</Label><select value={userForm.userType || ''} onChange={e => setUserForm(f => ({ ...f, userType: e.target.value }))} className={selectCls} disabled={savingUser}><option value="">Select type</option><option value="SUPERADMIN">SUPERADMIN</option><option value="USER">USER</option></select></div>
          <div className="space-y-2"><Label>Email</Label><Input type="email" value={userForm.email || ''} onChange={e => setUserForm(f => ({ ...f, email: e.target.value }))} disabled={savingUser} /></div>
          <div className="space-y-2"><Label>Department</Label><select value={userForm.department || ''} onChange={e => setUserForm(f => ({ ...f, department: e.target.value }))} className={selectCls} disabled={savingUser}><option value="">Select department</option>{departments.map(d => <option key={d.id} value={d.departmentName}>{d.departmentName}</option>)}</select></div>
          <Separator />
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={savingUser} className="flex-1 gap-2">{savingUser && <Loader2 className="w-4 h-4 animate-spin" />}{editingId ? 'Update' : 'Add'}</Button>
            <Button type="button" variant="outline" onClick={() => setShowUserPanel(false)} disabled={savingUser} className="flex-1">Cancel</Button>
          </div>
        </form>
      </SlideFormPanel>

      {/* ── Permissions Slide Panel ───────────────────────── */}
      <SlideFormPanel title={`Permissions: ${selectedUser?.username || ''}`} description={`${selectedUser?.fullName || ''} • ${selectedUser?.department || 'No department'}`} isOpen={showPermPanel} onClose={() => { if (!savingPerm) { setShowPermPanel(false); setSelectedUser(null); } }} >
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-120px)]">
          {permError && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">{permError}</div>}

          {loadingPerm ? (
            <div className="py-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto" /><p className="text-sm text-gray-500 mt-3">Loading permissions…</p></div>
          ) : (
            <>
              {/* Select All */}
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50/80">
                <div><p className="text-sm font-medium text-gray-900">Select All Permissions</p><p className="text-xs text-gray-500">Toggle all permissions for all modules</p></div>
                <input type="checkbox" className="h-5 w-5 accent-indigo-600 cursor-pointer" checked={selectAll} onChange={toggleSelectAll} />
              </div>

              {Object.entries(groupedModules).map(([group, mods]) => mods.length > 0 && (
                <div key={group} className="space-y-2">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{group}</h4>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50/80">
                          <TableHead>Module</TableHead><TableHead className="text-center w-20">All</TableHead>
                          <TableHead className="text-center w-20">Read</TableHead><TableHead className="text-center w-20">Create</TableHead>
                          <TableHead className="text-center w-20">Edit</TableHead><TableHead className="text-center w-20">Delete</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mods.map(m => {
                          const p = permissions[m.key] || emptyCrud();
                          return (
                            <TableRow key={m.key} className="hover:bg-gray-50/50">
                              <TableCell className="font-medium text-sm">{m.label}</TableCell>
                              <TableCell className="text-center"><input type="checkbox" className="h-4 w-4 accent-indigo-600 cursor-pointer" checked={isAllChecked(p)} onChange={e => toggleAllForModule(m.key, e.target.checked)} /></TableCell>
                              <TableCell className="text-center"><input type="checkbox" className="h-4 w-4 accent-indigo-600 cursor-pointer" checked={p.read} onChange={e => setModulePerm(m.key, { read: e.target.checked })} /></TableCell>
                              <TableCell className="text-center"><input type="checkbox" className="h-4 w-4 accent-indigo-600 cursor-pointer" checked={p.create} onChange={e => setModulePerm(m.key, { create: e.target.checked })} /></TableCell>
                              <TableCell className="text-center"><input type="checkbox" className="h-4 w-4 accent-indigo-600 cursor-pointer" checked={p.edit} onChange={e => setModulePerm(m.key, { edit: e.target.checked })} /></TableCell>
                              <TableCell className="text-center"><input type="checkbox" className="h-4 w-4 accent-indigo-600 cursor-pointer" checked={p.delete} onChange={e => setModulePerm(m.key, { delete: e.target.checked })} /></TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ))}
            </>
          )}
          <Separator />
          <div className="flex items-center gap-3">
            <Button onClick={savePermissions} disabled={savingPerm || loadingPerm} className="flex-1 gap-2">{savingPerm && <Loader2 className="w-4 h-4 animate-spin" />}Save Permissions</Button>
            <Button variant="outline" onClick={() => { setShowPermPanel(false); setSelectedUser(null); }} disabled={savingPerm} className="flex-1">Cancel</Button>
          </div>
        </div>
      </SlideFormPanel>
    </div>
  );
}
