'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Pencil, Trash2, Search, Loader2, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import SlideFormPanel from '@/components/ui/SlideFormPanel';
import { useToast } from '@/components/ui/toaster';

interface AddressBook {
  id: number;
  addressType: string;
  addressBookID: string;
  customerName: string;
  regdAddress: string;
  city?: string;
  state?: string;
  pinCode?: string;
  gstNo?: string;
}

interface Site {
  id?: number;
  addressBookId: number;
  siteID?: string;
  siteName: string;
  siteAddress: string;
  city?: string;
  state?: string;
  pinCode?: string;
  gstNo?: string;
  useCustomerData?: boolean;
}

interface SiteContact {
  id?: number;
  siteId: number;
  contactPerson: string;
  designation: string;
  contactNumber: string;
  emailAddress: string;
}

// Permission types
type CrudPerm = { read: boolean; create: boolean; edit: boolean; delete: boolean };
type PermissionsJson = Record<string, CrudPerm>;

export default function SitesPage() {
  const { toast } = useToast();
  const [sites, setSites] = useState<Site[]>([]);
  const [addressBooks, setAddressBooks] = useState<AddressBook[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [addressBookSearch, setAddressBookSearch] = useState('');
  const [showAddressBookDropdown, setShowAddressBookDropdown] = useState(false);
  const [isLoadingAddressBooks, setIsLoadingAddressBooks] = useState(true);
  const [formContacts, setFormContacts] = useState<SiteContact[]>([]);
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

  // Load address books, sites and permissions on component mount
  useEffect(() => {
    console.log('Component mounted, fetching address books and sites...');
    fetchAddressBooks();
    fetchSites();
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

      const response = await fetch(`https://enplerp.electrohelps.in/backend/user-permissions/${userId}`, {
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
          console.log('data.permissions:', data.permissions);

          if (data.permissions.permissions) {
            permissionsData = data.permissions.permissions;
            console.log('Extracted permissions from data.permissions.permissions:', permissionsData);
          } else {
            permissionsData = data.permissions;
            console.log('Extracted permissions from data.permissions:', permissionsData);
          }
        } else {
          permissionsData = data;
          console.log('Using data directly as permissions:', permissionsData);
        }

        if (permissionsData) {
          setPermissions(permissionsData);
          console.log('SITES permissions set to:', permissionsData.SITES);
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

  const [formData, setFormData] = useState<Site>({
    addressBookId: 0,
    siteName: '',
    siteAddress: '',
    city: '',
    state: '',
    pinCode: '',
    gstNo: '',
    useCustomerData: false
  });

  const fetchSites = async () => {
    try {
      setLoading(true);
      console.log('Fetching sites from backend...');

      const response = await fetch('https://enplerp.electrohelps.in/backend/sites');
      if (response.ok) {
        const data = await response.json();
        // Handle both array and object responses
        const sitesArray = Array.isArray(data) ? data : (data.data || []);
        setSites(sitesArray);
        console.log('Branches loaded successfully:', sitesArray.length, 'entries');
      } else {
        console.error('Failed to fetch sites:', response.status, response.statusText);
        setSites([]);
      }
    } catch (error) {
      console.error('Error fetching sites:', error);
      setSites([]);
    } finally {
      setLoading(false);
    }
  };

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
            city: office.District || '',
            state: office.State || ''
          }));
        }
      } catch (err) {
        console.error("PIN lookup error:", err);
      }
    };

    fetchCityState();
  }, [formData.pinCode]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.address-book-dropdown')) {
        setShowAddressBookDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchAddressBooks = async () => {
    try {
      setIsLoadingAddressBooks(true);
      console.log('Starting to fetch address books...');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch('https://enplerp.electrohelps.in/backend/address-book', {
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        // Handle both array and object responses
        const addressBooksArray = Array.isArray(data) ? data : (data.data || []);
        setAddressBooks(addressBooksArray);
        console.log('Address books loaded successfully:', addressBooksArray.length, 'entries');
      } else {
        console.error('Failed to fetch address books:', response.status, response.statusText);
        setAddressBooks([]);
      }
    } catch (error) {
      console.error('Error fetching address books:', error);
      setAddressBooks([]);
    } finally {
      setIsLoadingAddressBooks(false);
      console.log('Finished loading address books');
    }
  };

  // SAFE FILTERING - Check if addressBooks is an array before filtering
  const filteredAddressBooks = Array.isArray(addressBooks) 
    ? addressBooks.filter(ab => {
        if (!addressBookSearch.trim() || addressBookSearch.trim().length < 1) {
          return false;
        }

        const searchTerm = addressBookSearch.toLowerCase().trim();
        const customerName = (ab.customerName || '').toLowerCase();
        const addressBookID = (ab.addressBookID || '').toLowerCase();
        const addressType = (ab.addressType || '').toLowerCase();

        return customerName.includes(searchTerm) ||
          addressBookID.includes(searchTerm) ||
          addressType.includes(searchTerm);
      })
    : [];

  // Filter sites based on search term
  const filteredSites = Array.isArray(sites) 
    ? sites.filter(item =>
        item.siteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.siteID || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.siteAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.city || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.state || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredSites.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredSites.length / itemsPerPage);

  // Pagination controls
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };
  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  // Get SITES permissions with safe defaults
  const sitesPerm = {
    read: permissions?.SITES?.read ?? false,
    create: permissions?.SITES?.create ?? false,
    edit: permissions?.SITES?.edit ?? false,
    delete: permissions?.SITES?.delete ?? false,
  };

  // Keyboard navigation for dropdown
  const [activeIndex, setActiveIndex] = useState(-1);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (showAddressBookDropdown) {
      setActiveIndex(filteredAddressBooks.length > 0 ? 0 : -1);
    } else {
      setActiveIndex(-1);
    }
  }, [showAddressBookDropdown, filteredAddressBooks.length]);

  useEffect(() => {
    setActiveIndex(filteredAddressBooks.length > 0 ? 0 : -1);
  }, [addressBookSearch]);

  useEffect(() => {
    if (activeIndex >= 0 && itemRefs.current[activeIndex]) {
      itemRefs.current[activeIndex].scrollIntoView({
        block: "nearest",
      });
    }
  }, [activeIndex]);

  const handleAddressBookSelect = (addressBook: AddressBook) => {
    setFormData(prev => ({
      ...prev,
      addressBookId: addressBook.id
    }));

    setAddressBookSearch(`${addressBook.addressBookID} - ${addressBook.customerName}`);
    setShowAddressBookDropdown(false);

    if (formData.useCustomerData) {
      fetchCustomerFullData(addressBook.id);
    }
  };

  // Site Contact management functions
  const addContact = () => {
    const newContact: SiteContact = {
      siteId: 0,
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

  const updateContact = (index: number, field: keyof SiteContact, value: string) => {
    const updatedContacts = [...formContacts];
    updatedContacts[index] = { ...updatedContacts[index], [field]: value };
    setFormContacts(updatedContacts);
  };

  const handleSiteContacts = async (siteId: number) => {
    // First, fetch existing contacts to compare
    let existingContacts: SiteContact[] = [];
    try {
      const response = await fetch(`https://enplerp.electrohelps.in/backend/sites/${siteId}/contacts`);
      if (response.ok) {
        const data = await response.json();
        existingContacts = Array.isArray(data) ? data : (data.data || []);
      }
    } catch (error) {
      console.error('Error fetching existing contacts:', error);
    }

    // Find contacts to delete (exist in backend but not in form)
    const formContactIds = formContacts
      .filter(c => c.id)
      .map(c => c.id);
    
    const contactsToDelete = existingContacts.filter(
      existing => !formContactIds.includes(existing.id)
    );

    // Delete removed contacts
    for (const contact of contactsToDelete) {
      if (contact.id) {
        console.log('Deleting contact:', contact.id);
        await fetch(`https://enplerp.electrohelps.in/backend/sites/contacts/${contact.id}`, {
          method: 'DELETE',
        });
      }
    }

    // Update existing contacts and create new ones
    for (const contact of formContacts) {
      if (contact.contactPerson?.trim() && contact.contactNumber?.trim()) {
        const contactData = {
          contactPerson: contact.contactPerson,
          designation: contact.designation || null,
          contactNumber: contact.contactNumber,
          emailAddress: contact.emailAddress || null,
        };

        if (contact.id) {
          // Update existing contact
          await fetch(`https://enplerp.electrohelps.in/backend/sites/contacts/${contact.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(contactData),
          });
        } else {
          // Create new contact
          await fetch(`https://enplerp.electrohelps.in/backend/sites/${siteId}/contacts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(contactData),
          });
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if ((!editingId && !sitesPerm.create) || (editingId && !sitesPerm.edit)) {
      toast({ title: 'You do not have permission to perform this action', variant: 'error' });
      return;
    }

    setLoading(true);

    try {
      const siteData = {
        addressBookId: formData.addressBookId,
        siteName: formData.siteName,
        siteAddress: formData.siteAddress,
        city: formData.city || null,
        state: formData.state || null,
        pinCode: formData.pinCode || null,
        gstNo: formData.gstNo || null,
      };

      let siteId: number;

      if (editingId) {
        const response = await fetch(`https://enplerp.electrohelps.in/backend/sites/${editingId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(siteData),
        });

        if (response.ok) {
          siteId = editingId;
          await handleSiteContacts(siteId);
          await fetchSites();
          toast({ title: 'Site updated successfully', variant: 'success' });
          closeModal();
        } else {
          toast({ title: 'Failed to update site', variant: 'error' });
        }
      } else {
        const response = await fetch('https://enplerp.electrohelps.in/backend/sites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(siteData),
        });

        if (response.ok) {
          const newSite = await response.json();
          siteId = newSite.id;
          await handleSiteContacts(siteId);
          await fetchSites();
          toast({ title: 'Site created successfully', variant: 'success' });
          closeModal();
        } else {
          toast({ title: 'Failed to create site', variant: 'error' });
        }
      }
    } catch (error) {
      console.error('Error submitting site:', error);
      toast({ title: 'An error occurred', variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (id: number) => {
    if (!sitesPerm.edit) {
      toast({ title: 'You do not have permission to edit sites', variant: 'error' });
      return;
    }

    const item = sites.find(s => s.id === id);
    if (item) {
      setFormData({
        addressBookId: item.addressBookId,
        siteName: item.siteName || '',
        siteAddress: item.siteAddress || '',
        city: item.city || '',
        state: item.state || '',
        pinCode: item.pinCode || '',
        gstNo: item.gstNo || '',
        useCustomerData: item.useCustomerData || false
      });
      setEditingId(id);
      setShowForm(true);

      const addressBook = addressBooks.find(ab => ab.id === item.addressBookId);
      if (addressBook) {
        setAddressBookSearch(`${addressBook.addressBookID} - ${addressBook.customerName}`);
      }

      try {
        const response = await fetch(`https://enplerp.electrohelps.in/backend/sites/${id}/contacts`);
        if (response.ok) {
          const contactsData = await response.json();
          const contacts = Array.isArray(contactsData) ? contactsData : (contactsData.data || []);
          // Ensure all fields have at least empty string
          const formattedContacts = contacts.map((c: any) => ({
            ...c,
            contactPerson: c.contactPerson || '',
            designation: c.designation || '',
            contactNumber: c.contactNumber || '',
            emailAddress: c.emailAddress || '',
          }));
          setFormContacts(formattedContacts);
        } else {
          setFormContacts([]);
        }
      } catch (error) {
        console.error('Error fetching site contacts:', error);
        setFormContacts([]);
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (!sitesPerm.delete) {
      toast({ title: 'You do not have permission to delete sites', variant: 'error' });
      return;
    }

    if (confirm('Are you sure you want to delete this site?')) {
      try {
        setLoading(true);
        const response = await fetch(`https://enplerp.electrohelps.in/backend/sites/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setSites(sites.filter(s => s.id !== id));
          toast({ title: 'Site deleted successfully', variant: 'success' });
        } else {
          toast({ title: 'Failed to delete site', variant: 'error' });
        }
      } catch (error) {
        console.error('Error deleting site:', error);
        toast({ title: 'An error occurred', variant: 'error' });
      } finally {
        setLoading(false);
      }
    }
  };

  const fetchCustomerFullData = async (id: number) => {
    try {
      const res = await fetch(`https://enplerp.electrohelps.in/backend/address-book/${id}`);
      const data = await res.json();

      if (!data) return;

      const bestSite = data.sites?.length ? data.sites[0] : null;

      setFormData(prev => ({
        ...prev,
        siteAddress: bestSite?.siteAddress || data.regdAddress || '',
        city: bestSite?.city || data.city || '',
        state: bestSite?.state || data.state || '',
        pinCode: bestSite?.pinCode || data.pinCode || '',
        gstNo: bestSite?.gstNo || data.gstNo || '',
      }));

      if (data.contacts?.length > 0) {
        const converted = data.contacts.map((c: any) => ({
          ...(c.id && { id: undefined }),
          contactPerson: c.contactPerson || '',
          designation: c.designation || '',
          contactNumber: c.contactNumber || '',
          emailAddress: c.emailAddress || '',
        }));
        setFormContacts(converted);
      }
    } catch (err) {
      console.error("Auto-fill error:", err);
    }
  };

  const closeModal = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      addressBookId: 0,
      siteName: '',
      siteAddress: '',
      city: '',
      state: '',
      pinCode: '',
      gstNo: '',
      useCustomerData: false
    });
    setAddressBookSearch('');
    setShowAddressBookDropdown(false);
    setFormContacts([]);
  };

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="w-full -ml-13 sm:ml-0 px-4 py-4 sm:px-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Branches</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your site branches and contacts</p>
      </div>

      {/* Toolbar */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <Button
          onClick={() => setShowForm(true)}
          disabled={!sitesPerm.create}
          className="gap-2"
          title={sitesPerm.create ? 'Add new site' : 'No permission to create'}
        >
          <Plus className="h-4 w-4" />
          Add Branch
        </Button>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search sites..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Slide Form Panel */}
      <SlideFormPanel
        title={editingId ? 'Edit Site' : 'Add Site'}
        description={editingId ? 'Update the site details below' : 'Fill in the details to create a new site'}
        isOpen={showForm}
        onClose={closeModal}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Name - full width */}
            <div className="relative md:col-span-2 space-y-1.5">
              <Label>Customer Name</Label>

              {/* Same as customer checkbox */}
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  id="sameCustomer"
                  checked={formData.useCustomerData || false}
                  onChange={(e) => {
                    const checked = e.target.checked;

                    setFormData(prev => ({
                      ...prev,
                      useCustomerData: checked,
                      ...(checked === false
                        ? {
                          siteAddress: '',
                          city: '',
                          state: '',
                          pinCode: '',
                          gstNo: '',
                        }
                        : {})
                    }));

                    if (!checked) {
                      setFormContacts([]);
                    }

                    if (checked && formData.addressBookId) {
                      fetchCustomerFullData(formData.addressBookId);
                    }
                  }}
                  className="h-4 w-4"
                />
                <Label htmlFor="sameCustomer" className="text-sm font-normal text-gray-600">
                  Same as selected customer
                </Label>
              </div>

              <div className="relative address-book-dropdown">
                <Input
                  type="text"
                  value={addressBookSearch || ''}
                  onChange={(e) => {
                    setAddressBookSearch(e.target.value);

                    if (e.target.value.trim().length > 0) {
                      setShowAddressBookDropdown(true);
                    } else {
                      setShowAddressBookDropdown(false);
                      setFormData({ ...formData, addressBookId: 0 });
                    }
                  }}
                  onFocus={() => {
                    if (addressBookSearch.trim().length > 0) {
                      setShowAddressBookDropdown(true);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (!showAddressBookDropdown && addressBookSearch.trim().length > 0) {
                      setShowAddressBookDropdown(true);
                    }

                    if (!showAddressBookDropdown) return;

                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setActiveIndex((prev) => {
                        if (filteredAddressBooks.length === 0) return -1;
                        const next = prev < filteredAddressBooks.length - 1 ? prev + 1 : 0;
                        return next;
                      });
                    }

                    if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setActiveIndex((prev) => {
                        if (filteredAddressBooks.length === 0) return -1;
                        const next = prev > 0 ? prev - 1 : filteredAddressBooks.length - 1;
                        return next;
                      });
                    }

                    if (e.key === "Enter") {
                      e.preventDefault();

                      if (activeIndex >= 0 && filteredAddressBooks[activeIndex]) {
                        handleAddressBookSelect(filteredAddressBooks[activeIndex]);
                        setShowAddressBookDropdown(false);
                      }
                    }

                    if (e.key === "Escape") {
                      setShowAddressBookDropdown(false);
                    }
                  }}
                  placeholder="Search customer..."
                />

                {showAddressBookDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {isLoadingAddressBooks ? (
                      <div className="px-3 py-2 text-gray-500 flex items-center justify-between">
                        <span>Loading customers/vendors...</span>
                        <button
                          onClick={() => fetchAddressBooks()}
                          className="text-indigo-600 hover:text-indigo-800 text-sm"
                        >
                          Retry
                        </button>
                      </div>
                    ) : filteredAddressBooks.length > 0 ? (
                      filteredAddressBooks.map((addressBook, index) => (
                        <div
                          key={addressBook.id}
                          ref={(el) => {
                            if (el) {
                              itemRefs.current[index] = el;
                            }
                          }}
                          onMouseEnter={() => setActiveIndex(index)}
                          onClick={() => {
                            handleAddressBookSelect(addressBook);
                            setShowAddressBookDropdown(false);
                          }}
                          className={`px-3 py-2 cursor-pointer border-b border-gray-100 last:border-b-0
                            ${activeIndex === index ? "bg-indigo-50" : "hover:bg-gray-50"}
                          `}
                        >
                          <div className="font-medium text-gray-900">
                            {addressBook.addressBookID} - {addressBook.customerName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {addressBook.regdAddress}
                          </div>
                        </div>
                      ))
                    ) : addressBooks.length === 0 ? (
                      <div className="px-3 py-2 text-gray-500">
                        No customers/vendors found in database.
                      </div>
                    ) : addressBookSearch.trim().length === 0 ? (
                      <div className="px-3 py-2 text-gray-500">
                        Start typing to search for customers/vendors...
                      </div>
                    ) : (
                      <div className="px-3 py-2 text-gray-500">
                        No customers/vendors found matching &quot;{addressBookSearch}&quot;
                      </div>
                    )}
                  </div>
                )}
              </div>

              {formData.addressBookId === 0 && addressBookSearch && (
                <p className="text-red-500 text-sm mt-1">
                  Please select a customer/vendor from the dropdown
                </p>
              )}
            </div>

            {/* Site Name - full width */}
            <div className="md:col-span-2 space-y-1.5">
              <Label>Site/Branch Name <span className="text-red-500">*</span></Label>
              <Input
                type="text"
                value={formData.siteName || ''}
                onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
                required
              />
            </div>

            {/* Site Address - full width */}
            <div className="md:col-span-2 space-y-1.5">
              <Label>Site Address <span className="text-red-500">*</span></Label>
              <Textarea
                value={formData.siteAddress || ''}
                onChange={(e) => setFormData({ ...formData, siteAddress: e.target.value })}
                rows={3}
                required
              />
            </div>

            {/* Pin Code */}
            <div className="space-y-1.5">
              <Label>Pin Code</Label>
              <Input
                type="text"
                value={formData.pinCode || ''}
                maxLength={6}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  setFormData({ ...formData, pinCode: value });
                }}
              />
            </div>

            {/* GST Number */}
            <div className="space-y-1.5">
              <Label>GST Number</Label>
              <Input
                type="text"
                value={formData.gstNo || ''}
                onChange={(e) => setFormData({ ...formData, gstNo: e.target.value })}
              />
            </div>

            {/* City */}
            <div className="space-y-1.5">
              <Label>City (filled automatically by pincode)</Label>
              <Input
                type="text"
                value={formData.city || ''}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>

            {/* State */}
            <div className="space-y-1.5">
              <Label>State (filled automatically by pincode)</Label>
              <Input
                type="text"
                value={formData.state || ''}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              />
            </div>
          </div>

          {/* Site Contacts Section */}
          <Separator />
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">Site Contacts</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addContact}
                className="gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Contact
              </Button>
            </div>

            {formContacts.map((contact, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg mb-3 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-700">Contact {index + 1}</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeContact(index)}
                    className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50 gap-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Contact Person <span className="text-red-500">*</span></Label>
                    <Input
                      type="text"
                      value={contact.contactPerson || ''}
                      onChange={(e) => updateContact(index, 'contactPerson', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Designation <span className="text-red-500">*</span></Label>
                    <Input
                      type="text"
                      value={contact.designation || ''}
                      onChange={(e) => updateContact(index, 'designation', e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Contact Number <span className="text-red-500">*</span></Label>
                    <Input
                      type="text"
                      value={contact.contactNumber || ''}
                      onChange={(e) => updateContact(index, 'contactNumber', e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Email Address <span className="text-red-500">*</span></Label>
                    <Input
                      type="email"
                      value={contact.emailAddress || ''}
                      onChange={(e) => updateContact(index, 'emailAddress', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
            ))}

            {formContacts.length === 0 && (
              <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                <Users className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                <p className="text-sm font-medium mb-0.5">No site contacts added yet</p>
                <p className="text-xs text-gray-400">Click &quot;Add Contact&quot; to add contact information</p>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <Separator />
          <div className="flex gap-3 justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={closeModal}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || (editingId ? !sitesPerm.edit : !sitesPerm.create)}
              className="gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                editingId ? 'Update Site' : 'Add Site'
              )}
            </Button>
          </div>
        </form>
      </SlideFormPanel>

      {/* Main Content - Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-base font-semibold text-gray-900">Branches</h2>
          <div className="text-sm text-gray-500">
            Showing {currentItems.length} of {filteredSites.length} entries
            {searchTerm && (
              <span className="ml-2">(filtered from {sites.length} total)</span>
            )}
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <Table className="min-w-[720px]">
            <TableHeader>
              <TableRow>
                <TableHead>Branch ID</TableHead>
                <TableHead>Branch Name</TableHead>
                <TableHead>Branch Address</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Badge variant="secondary" className="font-mono text-xs">
                      {item.siteID || ''}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{item.siteName || ''}</TableCell>
                  <TableCell className="text-gray-600">{item.siteAddress || ''}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-gray-500 hover:text-indigo-600"
                        onClick={() => handleEdit(item.id!)}
                        disabled={!sitesPerm.edit}
                        title={sitesPerm.edit ? 'Edit' : 'No permission to edit'}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-gray-500 hover:text-red-600"
                        onClick={() => handleDelete(item.id!)}
                        disabled={!sitesPerm.delete}
                        title={sitesPerm.delete ? 'Delete' : 'No permission to delete'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Show message when no results found */}
          {currentItems.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Search className="h-10 w-10 mx-auto text-gray-300 mb-3" />
              <p className="text-sm font-medium">No sites found</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {searchTerm ? 'Try adjusting your search terms' : 'Add your first site to get started'}
              </p>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-5 py-3.5 border-t border-gray-100 bg-gray-50/50">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages} &bull; {filteredSites.length} entries
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevPage}
                  disabled={currentPage === 1}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                {/* Page Numbers */}
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => paginate(page)}
                      className="h-8 w-8 p-0"
                    >
                      {page}
                    </Button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={nextPage}
                  disabled={currentPage === totalPages}
                  className="gap-1"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}