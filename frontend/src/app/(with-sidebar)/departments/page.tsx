'use client';

import { useEffect, useState } from 'react';
import { nanoid } from 'nanoid';
import React from 'react';
import { Plus, Pencil, Trash2, Search, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import SlideFormPanel from '@/components/ui/SlideFormPanel';
import { useToast } from '@/components/ui/toaster';

interface Department {
  id?: number;
  departmentName: string;
  emails?: DepartmentEmail[];
}

interface PermissionSet {
  edit: boolean;
  read: boolean;
  create: boolean;
  delete: boolean;
}

interface DepartmentEmail {
  id?: string;
  email: string;
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

export default function DepartmentsPage() {
  const { toast } = useToast();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Department>({
    departmentName: '',
    emails: [{ id: nanoid(), email: '' }],
  });

  const [loading, setLoading] = useState(false);

  // Permissions state
  const [allPermissions, setAllPermissions] = useState<AllPermissions>({});
  const [loadingPermissions, setLoadingPermissions] = useState(true);
  const [userId, setUserId] = useState<number | null>(null);

  const [departmentPermissions, setDepartmentPermissions] = useState<PermissionSet>({
    edit: false,
    read: false,
    create: false,
    delete: false,
  });

  // Pagination and Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filteredDepartments, setFilteredDepartments] = useState<Department[]>([]);

  const API_URL = 'https://enplerp.electrohelps.in/backend/department';
  const PERMISSIONS_API = 'https://enplerp.electrohelps.in/backend/user-permissions';

  // Fetch permissions
  const fetchPermissions = async (uid: number) => {
    try {
      const storedUserType = localStorage.getItem('userType');
      if (storedUserType === 'SUPERADMIN') {
        const allPerms = { read: true, create: true, edit: true, delete: true };
        setAllPermissions({ DEPARTMENTS: allPerms });
        setDepartmentPermissions(allPerms);
        localStorage.setItem('userPermissions', JSON.stringify({ DEPARTMENTS: allPerms }));
        setLoadingPermissions(false);
        return;
      }

      const res = await fetch(`${PERMISSIONS_API}/${uid}`);
      if (!res.ok) throw new Error('Failed to fetch permissions');

      const rawText = await res.text();
      if (!rawText) { setLoadingPermissions(false); return; }
      const data: UserPermissionResponse = JSON.parse(rawText);
      const perms = data?.permissions?.permissions ?? {};

      setAllPermissions(perms);
      localStorage.setItem('userPermissions', JSON.stringify(perms));

      setDepartmentPermissions(
        perms.DEPARTMENTS ?? {
          read: false,
          create: false,
          edit: false,
          delete: false,
        }
      );

      console.log('✅ Department permissions loaded:', perms.DEPARTMENTS);
    } catch (err) {
      console.error('❌ Error fetching permissions:', err);
    } finally {
      setLoadingPermissions(false);
    }
  };

  // Filter departments based on search term and read permission
  useEffect(() => {
    if (!departmentPermissions.read && !loadingPermissions) {
      setFilteredDepartments([]);
      return;
    }

    const filtered = departments.filter(dept =>
      dept.departmentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dept.id?.toString().includes(searchTerm)
    );
    setFilteredDepartments(filtered);
    setCurrentPage(1);
  }, [searchTerm, departments, departmentPermissions.read, loadingPermissions]);

  // Calculate pagination values
  const totalPages = Math.ceil(filteredDepartments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentDepartments = filteredDepartments.slice(startIndex, startIndex + itemsPerPage);

  // Pagination handlers
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Fetch departments
  const fetchDepartments = async () => {
    if (!departmentPermissions.read) {
      console.log('No read permission for DEPARTMENTS');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(API_URL);
      const data = await res.json();
      setDepartments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching departments:', err);
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchPermissions(userId);
    }
  }, [userId]);

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(Number(storedUserId));
    }
  }, []);

  useEffect(() => {
    if (!loadingPermissions && departmentPermissions.read) {
      fetchDepartments();
    }
  }, [loadingPermissions, departmentPermissions.read]);

  // Create or Update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingId && !departmentPermissions.edit) {
      toast({ title: 'You do not have permission to edit departments', variant: 'error' });
      return;
    }

    if (!editingId && !departmentPermissions.create) {
      toast({ title: 'You do not have permission to create departments', variant: 'error' });
      return;
    }

    try {
      if (editingId) {
        const emails = formData.emails
          ?.map(e => e.email.trim())
          .filter(Boolean);

        const payload = {
          departmentName: formData.departmentName.trim(),
          emails,
        };

        const res = await fetch(`${API_URL}/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error('Failed to update department');
      } else {
        const emails = formData.emails
          ?.map(e => e.email.trim())
          .filter(Boolean);

        const payload = {
          departmentName: formData.departmentName.trim(),
          emails,
        };

        const res = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to add department');
      }

      await fetchDepartments();
      resetForm();
    } catch (err) {
      console.error('Error saving department:', err);
    }
  };

  // Edit
  const handleEdit = (id: number) => {
    if (!departmentPermissions.edit) return;

    const dept = departments.find(d => d.id === id);
    if (!dept) return;

    setFormData({
      departmentName: dept.departmentName,
      emails:
        dept.emails && dept.emails.length > 0
          ? dept.emails.map(e => ({
              id: nanoid(),
              email: e.email,
            }))
          : [{ id: nanoid(), email: '' }],
    });

    setEditingId(id);
    setShowPanel(true);
  };

  // Delete
  const handleDelete = async (id: number) => {
    if (!departmentPermissions.delete) {
      toast({ title: 'You do not have permission to delete departments', variant: 'error' });
      return;
    }

    if (!confirm('Are you sure you want to delete this department?')) return;
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete department');
      await fetchDepartments();
    } catch (err) {
      console.error('Error deleting department:', err);
    }
  };

  // Reset form
  const resetForm = () => {
    setShowPanel(false);
    setEditingId(null);
    setFormData({
      departmentName: '',
      emails: [{ id: nanoid(), email: '' }],
    });
  };

  // Handle Add
  const handleAddNew = () => {
    if (!departmentPermissions.create) {
      toast({ title: 'You do not have permission to create departments', variant: 'error' });
      return;
    }

    setFormData({
      departmentName: '',
      emails: [{ id: nanoid(), email: '' }],
    });
    setEditingId(null);
    setShowPanel(true);
  };

  // Loading state while permissions are being fetched
  if (loadingPermissions) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading permissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full -ml-13 sm:ml-0 px-4 py-4 sm:px-6 text-black">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Departments</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your organization&apos;s departments and contact emails</p>
      </div>

      {/* Search and Controls */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <Button
          onClick={handleAddNew}
          disabled={!departmentPermissions.create}
          title={departmentPermissions.create ? 'Add new department' : 'No create permission'}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Department
        </Button>

        {/* Search Box */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <Input
            type="text"
            placeholder="Search departments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {currentDepartments.length} of {filteredDepartments.length} departments
        {searchTerm && (
          <span> for &quot;<strong>{searchTerm}</strong>&quot;</span>
        )}
      </div>

      {/* Slide Form Panel */}
      <SlideFormPanel
        isOpen={showPanel}
        onClose={resetForm}
        title={editingId ? 'Edit Department' : 'Add Department'}
        description={editingId ? 'Update department details below' : 'Fill in the details to create a new department'}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="departmentName">Department Name <span className="text-red-500">*</span></Label>
            <Input
              id="departmentName"
              type="text"
              value={formData.departmentName}
              onChange={(e) => {
                if (!editingId) {
                  setFormData(prev => ({
                    ...prev,
                    departmentName: e.target.value,
                  }));
                }
              }}
              readOnly={!!editingId}
              required
              placeholder="Enter department name"
            />
          </div>

          <Separator />

          <div className="space-y-3">
            <Label>Department Emails</Label>

            {formData.emails?.map(item => (
              <div key={item.id} className="flex gap-2">
                <Input
                  type="email"
                  value={item.email}
                  onChange={e => {
                    const value = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      emails: prev.emails?.map(em =>
                        em.id === item.id ? { ...em, email: value } : em
                      ),
                    }));
                  }}
                  placeholder="email@company.com"
                  required
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() =>
                    setFormData(prev => ({
                      ...prev,
                      emails: prev.emails?.filter(e => e.id !== item.id),
                    }))
                  }
                  disabled={(formData.emails?.length || 0) === 1}
                  className="shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                setFormData(prev => ({
                  ...prev,
                  emails: [...(prev.emails || []), { id: nanoid(), email: '' }],
                }))
              }
              className="text-indigo-600 hover:text-indigo-700"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add another email
            </Button>
          </div>

          <Separator />

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              className="flex-1"
              disabled={editingId ? !departmentPermissions.edit : !departmentPermissions.create}
              title={
                editingId
                  ? departmentPermissions.edit ? 'Update department' : 'No edit permission'
                  : departmentPermissions.create ? 'Create department' : 'No create permission'
              }
            >
              {editingId ? 'Update' : 'Add'}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={resetForm}
            >
              Cancel
            </Button>
          </div>
        </form>
      </SlideFormPanel>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-white hover:bg-white">
                <TableHead className="font-semibold text-gray-700">ID</TableHead>
                <TableHead className="font-semibold text-gray-700">Department Name</TableHead>
                <TableHead className="font-semibold text-gray-700">Emails</TableHead>
                <TableHead className="font-semibold text-gray-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-indigo-600 mx-auto" />
                    <span className="text-sm text-gray-500 mt-2 block">Loading...</span>
                  </TableCell>
                </TableRow>
              ) : currentDepartments.length > 0 ? (
                currentDepartments.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Badge variant="secondary">{item.id}</Badge>
                    </TableCell>
                    <TableCell className="font-medium text-gray-900">{item.departmentName}</TableCell>
                    <TableCell className="text-gray-600">
                      {item.emails?.map(e => e.email).join(', ')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0 text-gray-500 hover:text-indigo-600"
                          onClick={() => handleEdit(item.id!)}
                          disabled={!departmentPermissions.edit}
                          title={departmentPermissions.edit ? 'Edit department' : 'No edit permission'}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0 text-gray-500 hover:text-red-600"
                          onClick={() => handleDelete(item.id!)}
                          disabled={!departmentPermissions.delete}
                          title={departmentPermissions.delete ? 'Delete department' : 'No delete permission'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                    {searchTerm ? 'No departments found matching your search' : 'No departments found'}
                    {!searchTerm && departmentPermissions.create && (
                      <div className="mt-4">
                        <Button onClick={handleAddNew} size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Your First Department
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPrevPage}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>

                  {/* Page Numbers */}
                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <Button
                        key={page}
                        variant={currentPage === page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => goToPage(page)}
                        className="w-8 px-0"
                      >
                        {page}
                      </Button>
                    ))}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}