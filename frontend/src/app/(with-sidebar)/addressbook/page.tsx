'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, Users, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import SlideFormPanel from '@/components/ui/SlideFormPanel';
import { useToast } from '@/components/ui/toaster';

interface AddressBook {
  id?: number;
  addressType: string;
  addressBookID: string;
  customerName: string;
  regdAddress: string;
  city?: string;
  state?: string;
  pinCode?: string;
  gstNo: string;
}

interface AddressBookContact {
  id?: number;
  addressBookId: number;
  contactPerson: string;
  designation: string;
  contactNumber: string;
  emailAddress: string;
}

// Permission types
type CrudPerm = { read: boolean; create: boolean; edit: boolean; delete: boolean };
type PermissionsJson = Record<string, CrudPerm>;

export default function AddressBookPage() {
  const { toast } = useToast();
  const [addressBooks, setAddressBooks] = useState<AddressBook[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<AddressBook>({
    addressType: 'Customer',
    addressBookID: '',
    customerName: '',
    regdAddress: '',
    city: '',
    state: '',
    pinCode: '',
    gstNo: '',
  });
  const [generatedId, setGeneratedId] = useState<string>('');
  const [formContacts, setFormContacts] = useState<AddressBookContact[]>([]);
  const [permissions, setPermissions] = useState<PermissionsJson | null>(null);
  const [userId, setUserId] = useState<number | null>(null);

  // Search and Pagination states
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Get userId from localStorage on component mount
  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(parseInt(storedUserId));
    }
  }, []);

  // Load data from backend on component mount
  useEffect(() => {
    fetchAddressBooks();
    if (userId) {
      fetchUserPermissions(userId);
    }
  }, [userId]);

  // Fetch user permissions with dynamic userId
  const fetchUserPermissions = async (userId: number) => {
    try {
      // SUPERADMIN bypass: grant all permissions
      const storedUserType = localStorage.getItem('userType');
      if (storedUserType === 'SUPERADMIN') {
        const allPerms = { read: true, create: true, edit: true, delete: true };
        const superPerms: PermissionsJson = {
          CUSTOMERS: allPerms, SITES: allPerms, VENDORS: allPerms,
          CUSTOMER_REGISTRATION: allPerms, CATEGORIES: allPerms, SUBCATEGORIES: allPerms,
          PRODUCTS_SKU: allPerms, INVENTORY: allPerms, PURCHASE_INVOICE: allPerms,
          MATERIAL_OUTWARD: allPerms, VENDORS_PAYMENTS: allPerms, TASKS: allPerms,
          SERVICE_CONTRACTS: allPerms, DEPARTMENTS: allPerms, SERVICE_CATEGORY: allPerms,
          WORKSCOPE_CATEGORY: allPerms, USERS: allPerms, DASHBOARD: allPerms,
        };
        setPermissions(superPerms);
        return;
      }

      console.log('Fetching permissions for userId:', userId);
      
      // Try to get token from localStorage
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:8000/user-permissions/${userId}`, {
        headers: token ? {
          'Authorization': `Bearer ${token}`
        } : {}
      });

      if (response.ok) {
        const rawText = await response.text();
        if (!rawText) {
          console.warn('Empty response body for permissions');
          setPermissions({});
          return;
        }
        const data = JSON.parse(rawText);
        console.log('Full permissions API response:', data);
        
        // EXTRACTION LOGIC FOR YOUR API STRUCTURE:
        // Your API returns: { id: 1, userId: 1, permissions: { permissions: { CUSTOMERS: {...} } } }
        let permissionsData = null;
        
        if (data && data.permissions) {
          // First level: data.permissions
          console.log('data.permissions:', data.permissions);
          
          if (data.permissions.permissions) {
            // Second level: data.permissions.permissions
            permissionsData = data.permissions.permissions;
            console.log('Extracted permissions from data.permissions.permissions:', permissionsData);
          } else {
            // If permissions is directly the object
            permissionsData = data.permissions;
            console.log('Extracted permissions from data.permissions:', permissionsData);
          }
        } else {
          // If data is directly the permissions object
          permissionsData = data;
          console.log('Using data directly as permissions:', permissionsData);
        }
        
        if (permissionsData) {
          setPermissions(permissionsData);
          console.log('CUSTOMERS permissions set to:', permissionsData.CUSTOMERS);
          
          // Store in localStorage for persistence
          localStorage.setItem('userPermissions', JSON.stringify(permissionsData));
        } else {
          console.error('No permissions data found in response');
          // Set default permissions
          setPermissions({});
        }
      } else {
        console.error('Failed to fetch permissions:', response.status, response.statusText);
        // Fallback to localStorage if API fails
        const stored = localStorage.getItem('userPermissions');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            console.log('Using stored permissions from localStorage:', parsed);
            setPermissions(parsed);
          } catch (e) {
            console.error('Error parsing stored permissions:', e);
            setPermissions({});
          }
        } else {
          setPermissions({});
        }
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
      // Fallback to localStorage if API fails
      const stored = localStorage.getItem('userPermissions');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          console.log('Error fallback - Using stored permissions:', parsed);
          setPermissions(parsed);
        } catch (e) {
          console.error('Error parsing stored permissions:', e);
          setPermissions({});
        }
      } else {
        setPermissions({});
      }
    }
  };

  useEffect(() => {
    const pin = formData.pinCode;

    if (!pin || pin.length !== 6) return; // Only lookup when 6 digits

    const fetchCityState = async () => {
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
        const data = await res.json();

        if (data[0].Status === "Success") {
          const office = data[0].PostOffice[0];

          setFormData(prev => ({
            ...prev,
            city: office.District,
            state: office.State
          }));
        }
      } catch (err) {
        console.error("PIN lookup error:", err);
      }
    };

    fetchCityState();
  }, [formData.pinCode]);

  const fetchAddressBooks = async () => {
    try {
      const response = await fetch('http://localhost:8000/address-book');
      if (response.ok) {
        const data = await response.json();
        setAddressBooks(data);
      }
    } catch (error) {
      console.error('Error fetching address books:', error);
    }
  };

  // Filter address books based on search term
  const filteredAddressBooks = addressBooks.filter(item =>
    item.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.addressBookID.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.gstNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.regdAddress.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAddressBooks.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAddressBooks.length / itemsPerPage);

  // Pagination controls
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };
  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  // Get CUSTOMERS permissions with safe defaults
  const customersPerm = {
    read: permissions?.CUSTOMERS?.read ?? false,
    create: permissions?.CUSTOMERS?.create ?? false,
    edit: permissions?.CUSTOMERS?.edit ?? false,
    delete: permissions?.CUSTOMERS?.delete ?? false,
  };

  console.log('Current customersPerm:', customersPerm);

  const generateAddressBookId = async (addressType: string) => {
    try {
      const response = await fetch(`http://localhost:8000/address-book/next-id/${addressType}`);
      const data = await response.json();
      return data.nextId;
    } catch (error) {
      console.error('Error generating ID:', error);
      // Fallback to local generation
      const customerCount = addressBooks.filter(ab => ab.addressType === 'Customer').length;
      const vendorCount = addressBooks.filter(ab => ab.addressType === 'Vendor').length;

      if (addressType === 'Customer') {
        const nextNumber = String(customerCount + 1).padStart(3, '0');
        return `CUS/${nextNumber}`;
      } else if (addressType === 'Vendor') {
        const nextNumber = String(vendorCount + 1).padStart(3, '0');
        return `VEN/${nextNumber}`;
      }
      return '';
    }
  };

  const addContact = () => {
    const newContact: AddressBookContact = {
      addressBookId: 0, // Will be set when address book is created
      contactPerson: '',
      designation: '',
      contactNumber: '',
      emailAddress: '',
    };
    setFormContacts([...formContacts, newContact]);
  };

  const removeContact = (index: number) => {
    setFormContacts(formContacts.filter((_, i) => i !== index));
  };

  const updateContact = (index: number, field: keyof AddressBookContact, value: string) => {
    const updatedContacts = [...formContacts];
    updatedContacts[index] = { ...updatedContacts[index], [field]: value };
    setFormContacts(updatedContacts);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user has create/edit permission - USING CUSTOMERS PERMISSIONS
    if ((!editingId && !customersPerm.create) || (editingId && !customersPerm.edit)) {
      toast({ title: 'You do not have permission to perform this action', variant: 'error' });
      return;
    }
    
    setLoading(true);

    console.log('Form submission started:', { editingId, formData, formContacts });

    try {
      if (editingId) {
        // Update existing record
        console.log('Updating existing record with ID:', editingId);
        // Only send the fields that should be updated, excluding nested objects and addressBookID
        const updateData = {
          addressType: formData.addressType,
          customerName: formData.customerName,
          regdAddress: formData.regdAddress,
          city: formData.city,
          state: formData.state,
          pinCode: formData.pinCode,
          gstNo: formData.gstNo,
        };

        console.log('Update data being sent:', updateData);

        const response = await fetch(`http://localhost:8000/address-book/${editingId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        });

        console.log('Update response status:', response.status);

        if (response.ok) {
          console.log('Record updated successfully');

          // Handle contacts separately with better error handling
          try {
            for (const contact of formContacts) {
              if (contact.contactPerson.trim() && contact.designation.trim() && contact.contactNumber.trim() && contact.emailAddress.trim()) {
                if (contact.id) {
                  // Update existing contact
                  console.log('Updating existing contact:', contact.id);
                  const contactResponse = await fetch(`http://localhost:8000/address-book/contacts/${contact.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      contactPerson: contact.contactPerson,
                      designation: contact.designation,
                      contactNumber: contact.contactNumber,
                      emailAddress: contact.emailAddress,
                    }),
                  });

                  if (!contactResponse.ok) {
                    console.error('Failed to update contact:', contact.id, contactResponse.status);
                  }
                } else {
                  // Create new contact
                  console.log('Creating new contact for address book:', editingId);
                  const contactResponse = await fetch('http://localhost:8000/addressbookcontact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      ...contact,
                      addressBookId: editingId,
                    }),
                  });

                  if (!contactResponse.ok) {
                    console.error('Failed to create contact:', contactResponse.status);
                  }
                }
              }
            }
          } catch (contactError) {
            console.error('Error handling contacts:', contactError);
            // Don't fail the entire update if contacts fail
          }

          await fetchAddressBooks(); // Refresh the list
          setShowForm(false);
          setEditingId(null);
          resetForm();
          console.log('Form reset and closed');
        } else {
          console.error('Failed to update record:', response.status, response.statusText);
        }
      } else {
        // Create new record
        console.log('Creating new record');
        const response = await fetch('http://localhost:8000/address-book', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          const newAddressBook = await response.json();

          // Create contacts for this address book
          for (const contact of formContacts) {
            if (contact.contactPerson.trim() && contact.designation.trim() && contact.contactNumber.trim() && contact.emailAddress.trim()) {
              await fetch('http://localhost:8000/addressbookcontact', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  ...contact,
                  addressBookId: newAddressBook.id,
                }),
              });
            }
          }

          await fetchAddressBooks(); // Refresh the list
          setShowForm(false);
          resetForm();
        }
      }
    } catch (error) {
      console.error('Error saving address book:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      addressType: 'Customer',
      addressBookID: '',
      customerName: '',
      regdAddress: '',
      city: '',
      state: '',
      pinCode: '',
      gstNo: '',
    });
    setGeneratedId('');
    setFormContacts([]);
  };

  const handleEdit = async (id: number) => {
    // Check edit permission - USING CUSTOMERS PERMISSION
    if (!customersPerm.edit) {
      toast({ title: 'You do not have permission to edit customers', variant: 'error' });
      return;
    }
    
    const item = addressBooks.find(a => a.id === id);
    if (item) {
      setFormData(item);
      setGeneratedId(item.addressBookID);
      setEditingId(id);
      setShowForm(true);

      // Fetch existing contacts for this address book
      try {
        const response = await fetch(`http://localhost:8000/address-book/${id}/contacts`);
        if (response.ok) {
          const contactsData = await response.json();
          setFormContacts(contactsData);
        } else {
          setFormContacts([]);
        }
      } catch (error) {
        console.error('Error fetching contacts:', error);
        setFormContacts([]);
      }
    }
  };

  const handleDelete = async (id: number) => {
    // Check delete permission - USING CUSTOMERS PERMISSION
    if (!customersPerm.delete) {
      toast({ title: 'You do not have permission to delete customers', variant: 'error' });
      return;
    }
    
    if (confirm('Are you sure you want to delete this customer?')) {
      try {
        const response = await fetch(`http://localhost:8000/address-book/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          await fetchAddressBooks(); // Refresh the list
        }
      } catch (error) {
        console.error('Error deleting customer:', error);
      }
    }
  };

  const closeModal = () => {
    setShowForm(false);
    setEditingId(null);
    resetForm();
  };

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="w-full px-4 py-6 sm:px-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Address Book</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your customers and their contact information</p>
      </div>

      {/* Toolbar */}
      <div className="mb-5 flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        <Button
          onClick={async () => {
            if (!customersPerm.create) {
              toast({ title: 'You do not have permission to add new customers', variant: 'error' });
              return;
            }
            setEditingId(null);
            const genId = await generateAddressBookId('Customer');
            setGeneratedId(genId);
            setFormData({
              addressType: 'Customer',
              addressBookID: genId,
              customerName: '',
              regdAddress: '',
              city: '',
              state: '',
              pinCode: '',
              gstNo: '',
            });
            setShowForm(true);
          }}
          disabled={!customersPerm.create}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Customer
        </Button>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Slide Form Panel */}
      <SlideFormPanel
        title={editingId ? 'Edit Customer' : 'Add New Customer'}
        description={editingId ? 'Update customer details and contacts' : 'Fill in the customer information below'}
        isOpen={showForm}
        onClose={closeModal}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Address Type</Label>
              <Input value="Customer" readOnly className="bg-gray-50" />
            </div>
            <div className="space-y-1.5">
              <Label>Address Book ID</Label>
              <Input
                value={editingId ? formData.addressBookID : (generatedId || '')}
                readOnly
                className="bg-gray-50 text-gray-500"
                placeholder="Auto-generated"
              />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label>Customer Name <span className="text-red-500">*</span></Label>
              <Input
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                required
                placeholder="Enter customer name"
              />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label>Registered Address <span className="text-red-500">*</span></Label>
              <Textarea
                value={formData.regdAddress}
                onChange={(e) => setFormData({ ...formData, regdAddress: e.target.value })}
                required
                placeholder="Enter registered address"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Pin Code</Label>
              <Input
                value={formData.pinCode}
                maxLength={6}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  setFormData({ ...formData, pinCode: value });
                }}
                placeholder="6-digit pin code"
              />
            </div>
            <div className="space-y-1.5">
              <Label>GST Number</Label>
              <Input
                value={formData.gstNo}
                onChange={(e) => setFormData({ ...formData, gstNo: e.target.value })}
                placeholder="Enter GST number"
              />
            </div>
            <div className="space-y-1.5">
              <Label>City <span className="text-xs text-gray-400">(auto-filled by pincode)</span></Label>
              <Input value={formData.city} readOnly className="bg-gray-50" />
            </div>
            <div className="space-y-1.5">
              <Label>State <span className="text-xs text-gray-400">(auto-filled by pincode)</span></Label>
              <Input value={formData.state} readOnly className="bg-gray-50" />
            </div>
          </div>

          {/* Contacts Section */}
          <Separator />
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">Contacts</h3>
              <Button type="button" variant="outline" size="sm" onClick={addContact} className="gap-1.5 text-xs">
                <Plus className="w-3.5 h-3.5" />
                Add Contact
              </Button>
            </div>

            {formContacts.map((contact, index) => (
              <div key={index} className="bg-gray-50/80 p-4 rounded-lg mb-3 border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Contact {index + 1}</span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeContact(index)} className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 px-2 text-xs gap-1">
                    <Trash2 className="w-3 h-3" />
                    Remove
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Contact Person <span className="text-red-500">*</span></Label>
                    <Input
                      value={contact.contactPerson}
                      onChange={(e) => updateContact(index, 'contactPerson', e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Designation <span className="text-red-500">*</span></Label>
                    <Input
                      value={contact.designation}
                      onChange={(e) => updateContact(index, 'designation', e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Contact Number <span className="text-red-500">*</span></Label>
                    <Input
                      value={contact.contactNumber}
                      onChange={(e) => updateContact(index, 'contactNumber', e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Email Address <span className="text-red-500">*</span></Label>
                    <Input
                      type="email"
                      value={contact.emailAddress}
                      onChange={(e) => updateContact(index, 'emailAddress', e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}

            {formContacts.length === 0 && (
              <div className="text-center py-8 text-gray-400 border border-dashed border-gray-200 rounded-lg">
                <Users className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p className="text-sm font-medium">No contacts added yet</p>
                <p className="text-xs mt-0.5">Click &quot;Add Contact&quot; to add contact information</p>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <Separator />
          <div className="flex gap-3 justify-end pt-1">
            <Button type="button" variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || (editingId ? !customersPerm.edit : !customersPerm.create)}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                  Saving...
                </>
              ) : (
                editingId ? 'Update Customer' : 'Add Customer'
              )}
            </Button>
          </div>
        </form>
      </SlideFormPanel>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <h2 className="text-sm font-semibold text-gray-900">All Customers</h2>
          <span className="text-xs text-gray-500">
            Showing {currentItems.length} of {filteredAddressBooks.length} entries
            {searchTerm && ` (filtered from ${addressBooks.length} total)`}
          </span>
        </div>

        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer ID</TableHead>
                <TableHead>Customer Name</TableHead>
                <TableHead>GST No</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Badge variant="secondary" className="font-mono text-xs">{item.addressBookID}</Badge>
                  </TableCell>
                  <TableCell className="font-medium text-gray-900">{item.customerName}</TableCell>
                  <TableCell className="font-mono text-gray-600">{item.gstNo || <span className="text-gray-300">—</span>}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(item.id!)}
                        disabled={!customersPerm.edit}
                        className="h-8 w-8 p-0 text-gray-500 hover:text-indigo-600"
                        title={customersPerm.edit ? 'Edit' : 'No permission'}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item.id!)}
                        disabled={!customersPerm.delete}
                        className="h-8 w-8 p-0 text-gray-500 hover:text-red-600"
                        title={customersPerm.delete ? 'Delete' : 'No permission'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {currentItems.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <Search className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p className="text-sm font-medium text-gray-500">No customers found</p>
              <p className="text-xs mt-1">
                {searchTerm ? 'Try adjusting your search terms' : 'Add your first customer to get started'}
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-gray-500">
              Page {currentPage} of {totalPages} &bull; {filteredAddressBooks.length} entries
            </span>
            <div className="flex items-center gap-1.5">
              <Button variant="outline" size="sm" onClick={prevPage} disabled={currentPage === 1} className="h-8 w-8 p-0">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => paginate(page)}
                  className="h-8 w-8 p-0 text-xs"
                >
                  {page}
                </Button>
              ))}
              <Button variant="outline" size="sm" onClick={nextPage} disabled={currentPage === totalPages} className="h-8 w-8 p-0">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}