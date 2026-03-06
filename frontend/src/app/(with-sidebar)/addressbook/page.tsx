'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, Pencil, Trash2, Search, Users, Loader2, ChevronLeft, ChevronRight, 
  Download, FileSpreadsheet 
} from 'lucide-react';
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
import * as XLSX from 'xlsx';

interface AddressBook {
  id?: number;
  addressType: string;
  addressBookID: string;
  customerName: string;
  regdAddress: string;
  city?: string;
  state?: string;
  pinCode?: string;
  gstNo?: string;
}

interface AddressBookContact {
  id?: number;
  addressBookId: number;
  contactPerson: string;
  designation?: string;
  contactNumber: string;
  emailAddress?: string;
}

interface AddressBookWithRelations extends AddressBook {
  contacts?: AddressBookContact[];
  sites?: Site[];
}

interface Site {
  id: number;
  addressBookId: number;
  siteID?: string;
  siteName: string;
  siteAddress: string;
  city?: string;
  state?: string;
  pinCode?: string;
  gstNo?: string;
}

interface PaginatedResponse {
  data: AddressBookWithRelations[];
  total: number;
  page?: number;
  limit?: number;
}

// Permission types
type CrudPerm = { read: boolean; create: boolean; edit: boolean; delete: boolean };
type PermissionsJson = Record<string, CrudPerm>;

export default function AddressBookPage() {
  const { toast } = useToast();
  const [addressBooks, setAddressBooks] = useState<AddressBook[]>([]);
  const [fullAddressBookData, setFullAddressBookData] = useState<AddressBookWithRelations[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
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
    fetchFullAddressBookData();
    if (userId) {
      fetchUserPermissions(userId);
    }
  }, [userId, currentPage]); // Add currentPage to dependencies

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
        let permissionsData = null;
        
        if (data && data.permissions) {
          if (data.permissions.permissions) {
            permissionsData = data.permissions.permissions;
          } else {
            permissionsData = data.permissions;
          }
        } else {
          permissionsData = data;
        }
        
        if (permissionsData) {
          setPermissions(permissionsData);
          console.log('CUSTOMERS permissions set to:', permissionsData.CUSTOMERS);
          localStorage.setItem('userPermissions', JSON.stringify(permissionsData));
        } else {
          console.error('No permissions data found in response');
          setPermissions({});
        }
      } else {
        console.error('Failed to fetch permissions:', response.status, response.statusText);
        const stored = localStorage.getItem('userPermissions');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            setPermissions(parsed);
          } catch (e) {
            setPermissions({});
          }
        } else {
          setPermissions({});
        }
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
      const stored = localStorage.getItem('userPermissions');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setPermissions(parsed);
        } catch (e) {
          setPermissions({});
        }
      } else {
        setPermissions({});
      }
    }
  };

  // PIN code auto-fill effect
  useEffect(() => {
    const pin = formData.pinCode;
    if (!pin || pin.length !== 6) return;

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
      setLoading(true);
      // Add pagination parameters to the API call
      const response = await fetch(`http://localhost:8000/address-book?page=${currentPage}&limit=${itemsPerPage}`);
      if (response.ok) {
        const data = await response.json();
        // Handle paginated response
        if (data.data && Array.isArray(data.data)) {
          setAddressBooks(data.data);
          setTotalRecords(data.total);
        } else if (Array.isArray(data)) {
          // Fallback for non-paginated response
          setAddressBooks(data);
          setTotalRecords(data.length);
        } else {
          setAddressBooks([]);
          setTotalRecords(0);
        }
      }
    } catch (error) {
      console.error('Error fetching address books:', error);
      setAddressBooks([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchFullAddressBookData = async () => {
    try {
      // For Excel export, we need to fetch ALL data (without pagination)
      // You might need a separate endpoint for this, or fetch multiple pages
      const response = await fetch('http://localhost:8000/address-book?limit=1000'); // Fetch more records
      if (response.ok) {
        const data = await response.json();
        // Handle paginated response
        if (data.data && Array.isArray(data.data)) {
          setFullAddressBookData(data.data);
        } else if (Array.isArray(data)) {
          setFullAddressBookData(data);
        } else {
          setFullAddressBookData([]);
        }
      }
    } catch (error) {
      console.error('Error fetching full address book data:', error);
    }
  };

  // Filter address books based on search term (client-side filtering)
  const filteredAddressBooks = addressBooks.filter(item =>
    item.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.addressBookID?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.gstNo && item.gstNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
    item.regdAddress?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination calculations - now using server-side pagination
  const totalPages = Math.ceil(totalRecords / itemsPerPage);

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

  const generateAddressBookId = async (addressType: string) => {
    try {
      const response = await fetch(`http://localhost:8000/address-book/next-id/${addressType}`);
      const data = await response.json();
      return data.nextId;
    } catch (error) {
      console.error('Error generating ID:', error);
      // Fallback to local generation
      const count = addressBooks.filter(ab => ab.addressType === 'Customer').length;
      const nextNumber = String(count + 1).padStart(4, '0');
      const currentYear = new Date().getFullYear().toString();
      return `ENPL/${currentYear}/${nextNumber}`;
    }
  };

  const addContact = () => {
    const newContact: AddressBookContact = {
      addressBookId: editingId || 0,
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
    
    if ((!editingId && !customersPerm.create) || (editingId && !customersPerm.edit)) {
      toast({ title: 'You do not have permission to perform this action', variant: 'error' });
      return;
    }
    
    setLoading(true);

    try {
      if (editingId) {
        // Update existing record
        const updateData = {
          addressType: formData.addressType,
          customerName: formData.customerName,
          regdAddress: formData.regdAddress,
          city: formData.city,
          state: formData.state,
          pinCode: formData.pinCode,
          gstNo: formData.gstNo,
        };

        const response = await fetch(`http://localhost:8000/address-book/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData),
        });

        if (response.ok) {
          // STEP 1: Fetch existing contacts from backend to compare
          const existingContactsResponse = await fetch(`http://localhost:8000/address-book/${editingId}/contacts`);
          let existingContacts: AddressBookContact[] = [];
          
          if (existingContactsResponse.ok) {
            const contactsData = await existingContactsResponse.json();
            existingContacts = contactsData.data || contactsData;
          }

          // STEP 2: Find contacts to delete (exist in backend but not in form)
          const formContactIds = formContacts
            .filter(c => c.id) // Only contacts that have an ID (already exist)
            .map(c => c.id);
          
          const contactsToDelete = existingContacts.filter(
            existing => !formContactIds.includes(existing.id)
          );

          // STEP 3: Delete removed contacts
          for (const contact of contactsToDelete) {
            if (contact.id) {
              console.log('Deleting contact:', contact.id);
              await fetch(`http://localhost:8000/address-book/contacts/${contact.id}`, {
                method: 'DELETE',
              });
            }
          }

          // STEP 4: Update existing contacts and create new ones
          for (const contact of formContacts) {
            if (contact.contactPerson.trim() && contact.contactNumber.trim()) {
              if (contact.id) {
                // Update existing contact
                await fetch(`http://localhost:8000/address-book/contacts/${contact.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    contactPerson: contact.contactPerson,
                    designation: contact.designation || null,
                    contactNumber: contact.contactNumber,
                    emailAddress: contact.emailAddress || null,
                  }),
                });
              } else {
                // Create new contact
                await fetch(`http://localhost:8000/address-book/${editingId}/contacts`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    contactPerson: contact.contactPerson,
                    designation: contact.designation || null,
                    contactNumber: contact.contactNumber,
                    emailAddress: contact.emailAddress || null,
                  }),
                });
              }
            }
          }

          toast({ title: 'Customer updated successfully', variant: 'success' });
          await fetchAddressBooks();
          await fetchFullAddressBookData();
          setShowForm(false);
          setEditingId(null);
          resetForm();
        } else {
          toast({ title: 'Failed to update customer', variant: 'error' });
        }
      } else {
        // Create new record (no deletion needed for new records)
        const response = await fetch('http://localhost:8000/address-book', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          const newAddressBook = await response.json();

          // Create contacts
          for (const contact of formContacts) {
            if (contact.contactPerson.trim() && contact.contactNumber.trim()) {
              await fetch(`http://localhost:8000/address-book/${newAddressBook.id}/contacts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contactPerson: contact.contactPerson,
                  designation: contact.designation || null,
                  contactNumber: contact.contactNumber,
                  emailAddress: contact.emailAddress || null,
                }),
              });
            }
          }

          toast({ title: 'Customer created successfully', variant: 'success' });
          await fetchAddressBooks();
          await fetchFullAddressBookData();
          setShowForm(false);
          resetForm();
        } else {
          toast({ title: 'Failed to create customer', variant: 'error' });
        }
      }
    } catch (error) {
      console.error('Error saving address book:', error);
      toast({ title: 'An error occurred', variant: 'error' });
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

      // Fetch existing contacts
      try {
        const response = await fetch(`http://localhost:8000/address-book/${id}/contacts`);
        if (response.ok) {
          const contactsData = await response.json();
          // Handle both paginated and non-paginated responses
          setFormContacts(contactsData.data || contactsData);
          console.log('Fetched contacts:', contactsData.data || contactsData);
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
          toast({ title: 'Customer deleted successfully', variant: 'success' });
          await fetchAddressBooks();
          await fetchFullAddressBookData();
        } else {
          toast({ title: 'Failed to delete customer', variant: 'error' });
        }
      } catch (error) {
        console.error('Error deleting customer:', error);
        toast({ title: 'An error occurred', variant: 'error' });
      }
    }
  };

  const closeModal = () => {
    setShowForm(false);
    setEditingId(null);
    resetForm();
  };

  // Download Excel functionality
  const downloadExcel = () => {
    try {
      setDownloading(true);
      
      // Prepare data for Excel
      const excelData = fullAddressBookData.map(item => {
        // Format contacts as a string
        const contactsList = item.contacts?.map(contact => 
          `${contact.contactPerson}${contact.designation ? ` (${contact.designation})` : ''} - ${contact.contactNumber}${contact.emailAddress ? `, ${contact.emailAddress}` : ''}`
        ).join('; ') || '';
        
        // Format sites as a string
        const sitesList = item.sites?.map(site => 
          `${site.siteName} - ${site.siteAddress}${site.city ? `, ${site.city}` : ''}${site.state ? `, ${site.state}` : ''}`
        ).join('; ') || '';
        
        return {
          'Customer ID': item.addressBookID,
          'Customer Name': item.customerName,
          'Registered Address': item.regdAddress,
          'City': item.city || '',
          'State': item.state || '',
          'Pin Code': item.pinCode || '',
          'GST No': item.gstNo || '',
          'Contacts': contactsList,
          'Sites/Branches': sitesList,
          'Number of Contacts': item.contacts?.length || 0,
          'Number of Sites': item.sites?.length || 0,
        };
      });

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);
      
      // Set column widths
      const colWidths = [
        { wch: 20 }, // Customer ID
        { wch: 30 }, // Customer Name
        { wch: 40 }, // Registered Address
        { wch: 20 }, // City
        { wch: 20 }, // State
        { wch: 15 }, // Pin Code
        { wch: 20 }, // GST No
        { wch: 50 }, // Contacts
        { wch: 50 }, // Sites/Branches
        { wch: 18 }, // Number of Contacts
        { wch: 18 }, // Number of Sites
      ];
      ws['!cols'] = colWidths;

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Customers');
      
      // Generate filename with current date
      const date = new Date();
      const dateStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
      const filename = `customers_${dateStr}.xlsx`;
      
      // Download file
      XLSX.writeFile(wb, filename);
      
      toast({ 
        title: 'Download successful', 
        description: `Exported ${excelData.length} customers to Excel`, 
        variant: 'success' 
      });
    } catch (error) {
      console.error('Error downloading Excel:', error);
      toast({ title: 'Failed to download Excel', variant: 'error' });
    } finally {
      setDownloading(false);
    }
  };

  // Download filtered data only
  const downloadFilteredExcel = () => {
    try {
      setDownloading(true);
      
      // Get full data for filtered customers
      const filteredIds = new Set(filteredAddressBooks.map(item => item.id));
      const filteredFullData = fullAddressBookData.filter(item => 
        item.id && filteredIds.has(item.id)
      );
      
      // Prepare data for Excel
      const excelData = filteredFullData.map(item => {
        const contactsList = item.contacts?.map(contact => 
          `${contact.contactPerson}${contact.designation ? ` (${contact.designation})` : ''} - ${contact.contactNumber}${contact.emailAddress ? `, ${contact.emailAddress}` : ''}`
        ).join('; ') || '';
        
        const sitesList = item.sites?.map(site => 
          `${site.siteName} - ${site.siteAddress}${site.city ? `, ${site.city}` : ''}${site.state ? `, ${site.state}` : ''}`
        ).join('; ') || '';
        
        return {
          'Customer ID': item.addressBookID,
          'Customer Name': item.customerName,
          'Registered Address': item.regdAddress,
          'City': item.city || '',
          'State': item.state || '',
          'Pin Code': item.pinCode || '',
          'GST No': item.gstNo || '',
          'Contacts': contactsList,
          'Sites/Branches': sitesList,
          'Number of Contacts': item.contacts?.length || 0,
          'Number of Sites': item.sites?.length || 0,
        };
      });

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);
      
      // Set column widths
      const colWidths = [
        { wch: 20 }, { wch: 30 }, { wch: 40 }, { wch: 20 }, 
        { wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 50 }, 
        { wch: 50 }, { wch: 18 }, { wch: 18 }
      ];
      ws['!cols'] = colWidths;

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Filtered Customers');
      
      // Generate filename with search term
      const date = new Date();
      const dateStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
      const searchSuffix = searchTerm ? `_${searchTerm.replace(/\s+/g, '_')}` : '';
      const filename = `customers${searchSuffix}_${dateStr}.xlsx`;
      
      // Download file
      XLSX.writeFile(wb, filename);
      
      toast({ 
        title: 'Download successful', 
        description: `Exported ${excelData.length} filtered customers to Excel`, 
        variant: 'success' 
      });
    } catch (error) {
      console.error('Error downloading filtered Excel:', error);
      toast({ title: 'Failed to download Excel', variant: 'error' });
    } finally {
      setDownloading(false);
    }
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
        <div className="flex gap-2 flex-wrap">
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
          
          {/* Excel Download Buttons */}
          <Button
            variant="outline"
            onClick={downloadExcel}
            disabled={downloading || fullAddressBookData.length === 0}
            className="gap-2 border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800"
            title="Download all customers to Excel"
          >
            {downloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4" />
            )}
            Export All ({fullAddressBookData.length})
          </Button>
          
          {searchTerm && filteredAddressBooks.length > 0 && (
            <Button
              variant="outline"
              onClick={downloadFilteredExcel}
              disabled={downloading}
              className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
              title="Download filtered customers to Excel"
            >
              <Download className="w-4 h-4" />
              Export Filtered ({filteredAddressBooks.length})
            </Button>
          )}
        </div>

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
                value={formData.customerName || ''}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                required
                placeholder="Enter customer name"
              />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label>Registered Address <span className="text-red-500">*</span></Label>
              <Textarea
                value={formData.regdAddress || ''}
                onChange={(e) => setFormData({ ...formData, regdAddress: e.target.value })}
                required
                placeholder="Enter registered address"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Pin Code</Label>
              <Input
                value={formData.pinCode || ''}
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
                value={formData.gstNo || ''}
                onChange={(e) => setFormData({ ...formData, gstNo: e.target.value })}
                placeholder="Enter GST number"
              />
            </div>
            <div className="space-y-1.5">
              <Label>City <span className="text-xs text-gray-400">(auto-filled by pincode)</span></Label>
              <Input value={formData.city || ''} readOnly className="bg-gray-50" />
            </div>
            <div className="space-y-1.5">
              <Label>State <span className="text-xs text-gray-400">(auto-filled by pincode)</span></Label>
              <Input value={formData.state || ''} readOnly className="bg-gray-50" />
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
                      value={contact.contactPerson || ''}
                      onChange={(e) => updateContact(index, 'contactPerson', e.target.value)}
                      className="h-8 text-sm"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Designation</Label>
                    <Input
                      value={contact.designation || ''}
                      onChange={(e) => updateContact(index, 'designation', e.target.value)}
                      className="h-8 text-sm"
                      placeholder="Optional"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Contact Number <span className="text-red-500">*</span></Label>
                    <Input
                      value={contact.contactNumber || ''}
                      onChange={(e) => updateContact(index, 'contactNumber', e.target.value)}
                      className="h-8 text-sm"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Email Address</Label>
                    <Input
                      type="email"
                      value={contact.emailAddress || ''}
                      onChange={(e) => updateContact(index, 'emailAddress', e.target.value)}
                      className="h-8 text-sm"
                      placeholder="Optional"
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
            Showing {addressBooks.length} of {totalRecords} entries
            {searchTerm && ` (filtered to ${filteredAddressBooks.length})`}
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
              {filteredAddressBooks.map((item) => (
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

          {filteredAddressBooks.length === 0 && (
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
              Page {currentPage} of {totalPages} &bull; {totalRecords} total records
            </span>
            <div className="flex items-center gap-1.5">
              <Button variant="outline" size="sm" onClick={prevPage} disabled={currentPage === 1} className="h-8 w-8 p-0">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm px-2">
                {currentPage} / {totalPages}
              </span>
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