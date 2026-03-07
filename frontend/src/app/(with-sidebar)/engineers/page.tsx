'use client';

import { useEffect, useState } from 'react';
import React from 'react';
import { Plus, Pencil, Trash2, Search, Loader2, ChevronLeft, ChevronRight, Send, ExternalLink, LinkIcon, Unlink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import SlideFormPanel from '@/components/ui/SlideFormPanel';

interface Engineer {
  id?: number;
  engineerId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  telegramChatId?: string;
  createdAt?: string;
  tasks?: any[];
}

interface PermissionSet {
  edit: boolean;
  read: boolean;
  create: boolean;
  delete: boolean;
}

interface AllPermissions {
  [key: string]: PermissionSet;
}

interface UserPermissionResponse {
  id: number;
  userId: number;
  permissions: {
    permissions: AllPermissions;
  };
  createdAt: string;
  updatedAt: string;
}

const API_URL = 'https://enplerp.electrohelps.in/backend/engineer';
const PERMISSIONS_API = 'https://enplerp.electrohelps.in/backend/user-permissions';
const TELEGRAM_API = 'https://enplerp.electrohelps.in/backend/telegram';

export default function EngineerPage() {
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Engineer>({
    engineerId: '', firstName: '', lastName: '', email: '', phoneNumber: '', telegramChatId: '',
  });
  const [loading, setLoading] = useState(false);

  const [allPermissions, setAllPermissions] = useState<AllPermissions>({});
  const [engineerPermissions, setEngineerPermissions] = useState<PermissionSet>({
    read: false, create: false, edit: false, delete: false,
  });
  const [loadingPermissions, setLoadingPermissions] = useState(true);
  const [userId, setUserId] = useState<number | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filteredEngineers, setFilteredEngineers] = useState<Engineer[]>([]);

  // Telegram bot info
  const [botInfo, setBotInfo] = useState<{ configured: boolean; botUsername?: string } | null>(null);
  const [telegramLinked, setTelegramLinked] = useState(false);
  const [deepLink, setDeepLink] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) setUserId(parseInt(storedUserId));
  }, []);

  useEffect(() => {
    if (userId) fetchPermissions(userId);
  }, [userId]);

  const fetchPermissions = async (uid: number) => {
    try {
      const storedUserType = localStorage.getItem('userType');
      if (storedUserType === 'SUPERADMIN') {
        const all = { read: true, create: true, edit: true, delete: true };
        setAllPermissions({ ENGINEERS: all });
        setEngineerPermissions(all);
        setLoadingPermissions(false);
        return;
      }
      const res = await fetch(`${PERMISSIONS_API}/${uid}`);
      if (!res.ok) throw new Error('Failed');
      const raw = await res.text();
      if (!raw) { setLoadingPermissions(false); return; }
      const data: UserPermissionResponse = JSON.parse(raw);
      const perms = data?.permissions?.permissions ?? {};
      setAllPermissions(perms);
      setEngineerPermissions(perms.ENGINEERS ?? { read: false, create: false, edit: false, delete: false });
    } catch (err) {
      console.error('Permission error:', err);
    } finally {
      setLoadingPermissions(false);
    }
  };

  const fetchEngineers = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_URL);
      const data = await res.json();
      setEngineers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching engineers:', err);
      setEngineers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEngineers(); fetchBotInfo(); }, []);

  const fetchBotInfo = async () => {
    try {
      const res = await fetch(`${TELEGRAM_API}/bot-info`);
      if (res.ok) setBotInfo(await res.json());
    } catch { /* bot info not available */ }
  };

  const fetchDeepLink = async (engineerCode: string) => {
    try {
      const res = await fetch(`${TELEGRAM_API}/deep-link/${engineerCode}`);
      if (res.ok) {
        const data = await res.json();
        setDeepLink(data.url || '');
      }
    } catch { setDeepLink(''); }
  };

  const checkTelegramLinked = async (engineerId: number) => {
    try {
      const res = await fetch(`${TELEGRAM_API}/linked/${engineerId}`);
      if (res.ok) {
        const data = await res.json();
        setTelegramLinked(data.linked);
      }
    } catch { setTelegramLinked(false); }
  };

  useEffect(() => {
    if (!engineerPermissions.read && !loadingPermissions) {
      setFilteredEngineers([]); return;
    }
    const term = searchTerm.toLowerCase();
    const filtered = engineers.filter(e =>
      e.engineerId.toLowerCase().includes(term) ||
      e.firstName.toLowerCase().includes(term) ||
      e.lastName.toLowerCase().includes(term) ||
      e.email.toLowerCase().includes(term) ||
      e.phoneNumber.includes(term)
    );
    setFilteredEngineers(filtered);
    setCurrentPage(1);
  }, [searchTerm, engineers, engineerPermissions, loadingPermissions]);

  const totalPages = Math.max(1, Math.ceil(filteredEngineers.length / itemsPerPage));
  const paginatedEngineers = filteredEngineers.slice(
    (currentPage - 1) * itemsPerPage, currentPage * itemsPerPage,
  );

  const handleOpenForm = async () => {
    try {
      const res = await fetch(`${API_URL}/next-id`);
      const data = await res.json();
      setFormData({ engineerId: data.nextId || '', firstName: '', lastName: '', email: '', phoneNumber: '', telegramChatId: '' });
      setEditingId(null);
      setTelegramLinked(false);
      setDeepLink('');
      setShowManualInput(false);
      if (data.nextId) fetchDeepLink(data.nextId);
      setShowForm(true);
    } catch (err) { console.error('Error fetching next ID:', err); }
  };

  const handleEdit = (eng: Engineer) => {
    setFormData({
      engineerId: eng.engineerId, firstName: eng.firstName, lastName: eng.lastName,
      email: eng.email, phoneNumber: eng.phoneNumber, telegramChatId: eng.telegramChatId || '',
    });
    setEditingId(eng.id!);
    setTelegramLinked(!!eng.telegramChatId);
    setShowManualInput(false);
    fetchDeepLink(eng.engineerId);
    if (eng.id) checkTelegramLinked(eng.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingId ? `${API_URL}/${editingId}` : API_URL;
      const method = editingId ? 'PATCH' : 'POST';
      const token = localStorage.getItem('access_token');
      const body: any = {
        firstName: formData.firstName, lastName: formData.lastName,
        email: formData.email, phoneNumber: formData.phoneNumber,
        telegramChatId: formData.telegramChatId || undefined,
      };
      await fetch(url, {
        method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(body),
      });
      setShowForm(false);
      fetchEngineers();
    } catch (err) { console.error('Error saving engineer:', err); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this engineer?')) return;
    try {
      await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      fetchEngineers();
    } catch (err) { console.error('Error deleting engineer:', err); }
  };

  if (loadingPermissions) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
        <span className="ml-2 text-gray-500 text-sm">Loading permissions...</span>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-6 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Engineers</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your engineer team members</p>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
        {engineerPermissions.create && (
          <Button onClick={handleOpenForm} className="gap-2">
            <Plus className="w-4 h-4" /> Add Engineer
          </Button>
        )}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search engineers..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
        </div>
      </div>

      <SlideFormPanel title={editingId ? 'Edit Engineer' : 'Add Engineer'} description={editingId ? 'Update engineer details' : 'Fill in the engineer information'} isOpen={showForm} onClose={() => setShowForm(false)} >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Engineer ID</Label>
            <Input value={formData.engineerId} disabled className="bg-gray-50 text-gray-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>First Name <span className="text-red-500">*</span></Label>
              <Input value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label>Last Name <span className="text-red-500">*</span></Label>
              <Input value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Email <span className="text-red-500">*</span></Label>
            <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
          </div>
          <div className="space-y-1.5">
            <Label>Phone Number <span className="text-red-500">*</span></Label>
            <Input value={formData.phoneNumber} onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>Telegram Integration</Label>
            <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-3 space-y-3">
              {/* Status indicator */}
              <div className="flex items-center gap-2">
                {telegramLinked ? (
                  <>
                    <LinkIcon className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">Linked</span>
                    <Badge variant="outline" className="text-xs text-green-700 border-green-300 bg-green-50">
                      {formData.telegramChatId}
                    </Badge>
                  </>
                ) : (
                  <>
                    <Unlink className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-medium text-amber-600">Not linked</span>
                  </>
                )}
              </div>

              {/* Deep link button */}
              {botInfo?.configured && deepLink && !telegramLinked && (
                <div className="space-y-1.5">
                  <p className="text-xs text-gray-500">
                    Send this link to the engineer. They tap it in Telegram to auto-link their account.
                  </p>
                  <div className="flex items-center gap-2">
                    <Input value={deepLink} readOnly className="text-xs bg-white font-mono flex-1" />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0 gap-1.5 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                      onClick={() => window.open(deepLink, '_blank')}
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Open
                    </Button>
                  </div>
                </div>
              )}

              {!botInfo?.configured && (
                <p className="text-xs text-gray-400">
                  Telegram bot is not configured. Set TELEGRAM_BOT_TOKEN in .env to enable.
                </p>
              )}

              {/* Manual fallback */}
              <button
                type="button"
                className="text-xs text-gray-400 hover:text-gray-600 underline"
                onClick={() => setShowManualInput(!showManualInput)}
              >
                {showManualInput ? 'Hide manual input' : 'Enter Chat ID manually'}
              </button>
              {showManualInput && (
                <Input
                  value={formData.telegramChatId || ''}
                  onChange={(e) => setFormData({ ...formData, telegramChatId: e.target.value })}
                  placeholder="e.g. 123456789"
                  className="text-sm"
                />
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            {(editingId ? engineerPermissions.edit : engineerPermissions.create) && (
              <Button type="submit">{editingId ? 'Update' : 'Create'}</Button>
            )}
          </div>
        </form>
      </SlideFormPanel>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-sm font-semibold text-gray-900">Engineer Records</h2>
          <span className="text-xs text-gray-500">Showing {paginatedEngineers.length} of {filteredEngineers.length}</span>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Engineer ID</TableHead>
                <TableHead>First Name</TableHead>
                <TableHead>Last Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Telegram</TableHead>
                <TableHead>Tasks</TableHead>
                <TableHead className="text-center w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8"><Loader2 className="w-5 h-5 animate-spin mx-auto text-indigo-600" /></TableCell></TableRow>
              ) : paginatedEngineers.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-gray-400"><Search className="w-8 h-8 mx-auto mb-2 text-gray-300" /><p className="text-sm">No engineers found</p></TableCell></TableRow>
              ) : (
                paginatedEngineers.map((eng) => (
                  <TableRow key={eng.id}>
                    <TableCell><Badge variant="secondary" className="font-mono text-xs">{eng.engineerId}</Badge></TableCell>
                    <TableCell className="font-medium text-gray-900">{eng.firstName}</TableCell>
                    <TableCell className="text-gray-700">{eng.lastName}</TableCell>
                    <TableCell className="text-gray-600">{eng.email}</TableCell>
                    <TableCell className="text-gray-600">{eng.phoneNumber}</TableCell>
                    <TableCell>
                      {eng.telegramChatId ? (
                        <Badge variant="outline" className="text-xs text-green-700 border-green-300 bg-green-50 gap-1">
                          <Send className="w-3 h-3" /> Linked
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-gray-400 border-gray-200 gap-1">
                          <Unlink className="w-3 h-3" /> —
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{eng.tasks?.length || 0}</Badge></TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        {engineerPermissions.edit && (
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(eng)} className="h-8 w-8 p-0 text-gray-500 hover:text-indigo-600" title="Edit"><Pencil className="w-3.5 h-3.5" /></Button>
                        )}
                        {engineerPermissions.delete && (
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(eng.id!)} className="h-8 w-8 p-0 text-gray-500 hover:text-red-600" title="Delete"><Trash2 className="w-3.5 h-3.5" /></Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <div className="px-5 py-3 border-t border-gray-100 flex justify-between items-center">
          <span className="text-xs text-gray-500">Page {currentPage} of {totalPages}</span>
          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="h-8 w-8 p-0"><ChevronLeft className="w-4 h-4" /></Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="h-8 w-8 p-0"><ChevronRight className="w-4 h-4" /></Button>
          </div>
        </div>
      </div>
    </div>
  );
}
