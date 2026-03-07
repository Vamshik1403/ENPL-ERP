'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/toaster';
import { 
  Headphones, 
  LogOut, 
  Ticket,
  FileText,
  CheckSquare,
  MessageSquare,
  User,
  Bell,
  HelpCircle,
  Home,
  ChevronRight,
  Menu,
  X,
  Filter,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Search
} from 'lucide-react';

/* -------------------- Sidebar Component -------------------- */
interface CustomerSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  session: any;
}

function CustomerSidebar({ isCollapsed, setIsCollapsed, session }: CustomerSidebarProps) {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('customerSession');
    router.push('/customerlogin');
  };

  const sidebarContent = (
    <>
      {/* Logo/Brand */}
      <div className="p-4 border-b border-blue-800/30">
        <div className="flex items-center justify-center">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600">
                <Ticket className="w-5 h-5 text-white" />
              </div>
              <h1 className=" text-xl bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                Customer Portal
              </h1>
            </div>
          )}
          {isCollapsed && (
            <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600">
              <Ticket className="w-6 h-6 text-white" />
            </div>
          )}
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-b border-blue-800/30">
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-3">
            <div className="w-12 h-12 rounded-full bg-linear-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-gray-900 flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          </div>
          
          {!isCollapsed && (
            <>
              <h3 className="text-lg uppercase font-semibold text-white mb-1">
                {session?.custFirstName} {session?.custLastName}
              </h3>
              <p className="text-sm text-blue-200 mb-2">Customer Account</p>
            </>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4">
        <div className="space-y-1 px-2">
          {/* Main Navigation Item - Active */}
          <div className={`
            relative flex items-center py-3 px-3 rounded-xl
            bg-linear-to-r from-blue-600/20 to-indigo-600/20
            border-l-4 border-cyan-400
            text-white shadow-lg
            ${!isCollapsed && 'pr-4'}
          `}>
            <div className="flex items-center w-full">
              <div className="relative">
                <FileText className="w-5 h-5 text-cyan-300" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              
              {!isCollapsed && (
                <>
                  <span className="ml-3 font-medium">Tickets</span>
                  <div className="ml-auto flex items-center">
                    <ChevronRight className="w-4 h-4 ml-2 text-cyan-300" />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Logout Button */}
      <div className="p-4 border-t border-blue-800/30">
        <button
          onClick={handleLogout}
          className={`
            w-full flex items-center justify-center py-3 px-3 rounded-xl cursor-pointer
           bg-red-500
            text-white hover:text-white
            border border-red-700/30
            transition-all duration-200
            ${!isCollapsed && 'justify-between'}
          `}
        >
          <div className="flex items-center">
            <LogOut className="w-5 h-5" />
            {!isCollapsed && <span className="ml-3 font-medium">Logout</span>}
          </div>
          {!isCollapsed && (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
      </div>
    </>
  );

  // Mobile sidebar overlay
  if (isMobileMenuOpen) {
    return (
      <>
        {/* Mobile Overlay */}
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
        
        {/* Mobile Sidebar */}
        <div className="fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white z-50 lg:hidden shadow-2xl">
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600">
                <Ticket className="w-5 h-5 text-white" />
              </div>
              <h1 className="font-bold text-xl bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                Customer Portal
              </h1>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 hover:bg-gray-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {sidebarContent}
        </div>
      </>
    );
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={`
        hidden lg:flex flex-col
        bg-gradient-to-b from-gray-900 to-gray-800 text-white
        ${isCollapsed ? 'w-20' : 'w-64'}
        h-screen fixed left-0 top-0 z-30 border-r border-gray-700
        transition-all duration-300 shadow-2xl
      `}>
        {/* Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-6 bg-gray-800 border border-gray-700 rounded-full p-1.5 hover:bg-gray-700 transition z-10"
        >
          <ChevronRight className={`w-4 h-4 transition-transform ${isCollapsed ? '' : 'rotate-180'}`} />
        </button>

        {sidebarContent}
      </div>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-lg shadow-lg"
      >
        <Menu className="w-6 h-6" />
      </button>
    </>
  );
}

/* -------------------- Main Component -------------------- */
export default function CustomerComplaintPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [session, setSession] = useState<any>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [customerSites, setCustomerSites] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number>(0);
  const [remarkModalOpen, setRemarkModalOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<any>(null);
  const [remarkText, setRemarkText] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [siteId, setSiteId] = useState<number>(0);
  const [departmentId, setDepartmentId] = useState<number>(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // New state for complete task modal
  const [completeTaskModalOpen, setCompleteTaskModalOpen] = useState(false);
  const [taskToComplete, setTaskToComplete] = useState<any>(null);
  const [completeDescription, setCompleteDescription] = useState('');
  const [isCompleting, setIsCompleting] = useState(false);

  // Sidebar state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Filter states
  const [filterCustomerId, setFilterCustomerId] = useState<number>(0);
  const [filterSiteId, setFilterSiteId] = useState<number>(0);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterSearch, setFilterSearch] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Status options for filter
  const statusOptions = [
    'All',
    'Open',
    'Work in Progress',
    'Completed',
    'On-hold',
    'Rescheduled',
    'Scheduled',
    'Reopened',
    'Closed'
  ];

  /* ---------------- STATUS FUNCTIONS ---------------- */

  const normalizeStatus = (raw?: string): string => {
    if (!raw) return 'Open';

    const s = raw.trim();

    // Handle specific cases
    if (s.toLowerCase() === 'reopen') return 'Reopened';

    // Return original for everything else
    return s;
  };

  const getStatusBadgeStyle = (status: string) => {
    const s = status.toLowerCase();

    if (s === 'completed') return 'bg-green-100 text-green-800';
    if (s === 'work in progress') return 'bg-yellow-100 text-yellow-800';
    if (s === 'on-hold') return 'bg-orange-100 text-orange-800';
    if (s === 'rescheduled') return 'bg-purple-100 text-purple-800';
    if (s === 'scheduled') return 'bg-blue-100 text-blue-800';
    if (s === 'reopen' || s === 'reopened') return 'bg-red-100 text-red-800';
    if (s === 'open') return 'bg-blue-100 text-blue-800';
    if (s === 'closed') return 'bg-green-100 text-green-800';

    return 'bg-gray-100 text-gray-800';
  };

  /* ---------------- GET TICKET STATUS ---------------- */

  const getTaskStatus = (task: any): string => {
    if (!task.remarks || task.remarks.length === 0) return 'Open';

    const latest = [...task.remarks].sort(
      (a, b) => (b.id || 0) - (a.id || 0),
    )[0];

    return latest?.status || 'Open';
  };

  const getDisplayStatus = (task: any): string => {
    const status = getTaskStatus(task);
    return normalizeStatus(status);
  };

  const getLatestStatus = (task: any): string => {
    return getDisplayStatus(task);
  };

  /* ---------------- GET LATEST REMARK DATE ---------------- */

  const getLatestRemarkDate = (task: any): Date | null => {
    if (!task.remarks || task.remarks.length === 0) return null;
    
    const sortedRemarks = [...task.remarks].sort(
      (a, b) => (b.id || 0) - (a.id || 0)
    );
    
    return new Date(sortedRemarks[0].createdAt);
  };

  const formatRemarkDate = (task: any): string => {
    const latestDate = getLatestRemarkDate(task);
    
    if (!latestDate) {
      return formatDate(task.createdAt);
    }
    
    return latestDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /* ---------------- CALCULATE STATS ---------------- */
  
  const calculateStats = () => {
    const stats = {
      total: filteredTasks.length,
      open: 0,
      workInProgress: 0,
      completed: 0
    };

    filteredTasks.forEach(task => {
      const status = getTaskStatus(task).toLowerCase();
      
      if (status === 'open') {
        stats.open++;
      } else if (status === 'completed') {
        stats.completed++;
      } else {
        stats.workInProgress++;
      }
    });

    return stats;
  };

  const stats = calculateStats();

  /* ---------------- FILTER FUNCTIONS ---------------- */

  // Use useCallback to memoize the applyFilters function
  const applyFilters = useCallback(() => {
    if (!tasks || tasks.length === 0) {
      setFilteredTasks([]);
      return;
    }

    let filtered = [...tasks];

    // Filter by customer
    if (filterCustomerId > 0) {
      filtered = filtered.filter(task => 
        task.addressBook?.id === filterCustomerId
      );
    }

    // Filter by site
    if (filterSiteId > 0) {
      filtered = filtered.filter(task => 
        task.site?.id === filterSiteId
      );
    }

    // Filter by status
    if (filterStatus && filterStatus !== 'All') {
      filtered = filtered.filter(task => {
        const taskStatus = getTaskStatus(task).toLowerCase();
        return taskStatus === filterStatus.toLowerCase() || 
               normalizeStatus(taskStatus) === filterStatus;
      });
    }

    // Filter by search text
    if (filterSearch.trim()) {
      const searchTerm = filterSearch.toLowerCase();
      filtered = filtered.filter(task =>
        task.taskID?.toLowerCase().includes(searchTerm) ||
        task.title?.toLowerCase().includes(searchTerm) ||
        task.addressBook?.customerName?.toLowerCase().includes(searchTerm) ||
        task.site?.siteName?.toLowerCase().includes(searchTerm) ||
        task.department?.departmentName?.toLowerCase().includes(searchTerm)
      );
    }

    setFilteredTasks(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [tasks, filterCustomerId, filterSiteId, filterStatus, filterSearch]);

  const resetFilters = () => {
    setFilterCustomerId(0);
    setFilterSiteId(0);
    setFilterStatus('');
    setFilterSearch('');
    setCurrentPage(1);
  };

  // This useEffect should ALWAYS run - no conditions
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  /* ---------------- PAGINATION FUNCTIONS ---------------- */

  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredTasks.slice(startIndex, endIndex);
  };

  const currentPageData = getCurrentPageData();

  useEffect(() => {
    const total = Math.ceil(filteredTasks.length / itemsPerPage);
    setTotalPages(total || 1);
    
    // Adjust current page if it exceeds total pages
    if (currentPage > total && total > 0) {
      setCurrentPage(total);
    }
  }, [filteredTasks, itemsPerPage, currentPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  /* ---------------- GET SITES FOR SELECTED CUSTOMER ---------------- */

  // Get sites for the selected customer in filter
  const getSitesForSelectedCustomer = () => {
    if (filterCustomerId === 0) {
      return []; // No customer selected
    }
    
    // Filter customerSites for the selected customer
    return customerSites.filter(site => 
      site.customerId === filterCustomerId || 
      site.addressBookId === filterCustomerId
    );
  };

  /* ---------------- INIT ---------------- */

  const fetchTasksByCustomers = async (customerIds: number[]) => {
    setIsLoading(true);
    try {
      const res = await fetch('https://enplerp.electrohelps.in/backend/task/by-customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerIds }),
      });

      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error(err);
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const data = localStorage.getItem('customerSession');
    if (!data) {
      router.push('/customerlogin');
      return;
    }

    const parsed = JSON.parse(data);
    setSession(parsed);

    fetch('https://enplerp.electrohelps.in/backend/department')
      .then(res => res.json())
      .then(setDepartments);

    const customerIds: number[] = Array.from(
      new Set(
        (parsed.sites as any[]).map((s) => Number(s.customerId))
      ),
    );

    fetchTasksByCustomers(customerIds);
    fetchMappedCustomers(customerIds);
  }, []);

  const fetchMappedCustomers = async (customerIds: number[]) => {
    try {
      const res = await fetch('https://enplerp.electrohelps.in/backend/address-book');
      const allCustomers = await res.json();

      const mappedCustomers = allCustomers.filter((customer: any) =>
        customerIds.includes(customer.id)
      );

      setCustomers(mappedCustomers);

      if (mappedCustomers.length > 0) {
        const firstCustomerId = mappedCustomers[0].id;
        setSelectedCustomerId(firstCustomerId);
        fetchCustomerSites(firstCustomerId);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchCustomerSites = async (addressBookId: number) => {
    try {
      const res = await fetch(
        `https://enplerp.electrohelps.in/backend/sites/based-on-cust?addressBookId=${addressBookId}`,
      );
      const data = await res.json();
      setCustomerSites(data);
    } catch (error) {
      console.error('Error fetching sites:', error);
    }
  };

  const handleCustomerChange = (customerId: number) => {
    setSelectedCustomerId(customerId);
    setSiteId(0);
    fetchCustomerSites(customerId);
  };

  if (!session) return null;

  /* ---------------- SUBMIT TICKET ---------------- */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCustomerId || !siteId || !departmentId || !title) {
      toast({ title: 'Please fill all required fields', variant: 'warning' });
      return;
    }

    setIsLoading(true);
    try {
      const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
      const selectedSite = customerSites.find(s => s.id === siteId);

      const payload = {
        departmentId: departmentId,
        addressBookId: selectedCustomerId,
        siteId: siteId,
        status: 'Open',
        remarks: [
          {
            remark: description,
            createdBy: `${selectedCustomer?.customerName || 'Customer'} - ${selectedSite?.siteName || 'Site'} (${session.custFirstName} ${session.custLastName})`,
          },
        ],
        title: title
      };

      const response = await fetch('https://enplerp.electrohelps.in/backend/task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create task');
      }

      const result = await response.json();
      console.log('Task created successfully:', result);

      setShowModal(false);
      setSiteId(0);
      setDepartmentId(0);
      setTitle('');
      setDescription('');

      const customerIds: number[] = Array.from(
        new Set(
          (session.sites as any[]).map((s) => Number(s.customerId))
        ),
      );
      fetchTasksByCustomers(customerIds);

    } catch (error: any) {
      console.error('Error creating task:', error);
      toast({ title: 'Error', description: error.message || 'Failed to create task', variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  /* ---------------- FORMAT DATE ---------------- */

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /* ---------------- MODAL RESET ---------------- */

  const openModal = () => {
    setShowModal(true);
    if (customers.length > 0 && !selectedCustomerId) {
      setSelectedCustomerId(customers[0].id);
      fetchCustomerSites(customers[0].id);
    }
    setSiteId(0);
    setDepartmentId(0);
    setTitle('');
    setDescription('');
  };

  /* ---------------- COMPLETE TASK FUNCTIONS ---------------- */

  const openCompleteTaskModal = (task: any) => {
    setTaskToComplete(task);
    setCompleteDescription('');
    setCompleteTaskModalOpen(true);
  };

  const handleCompleteTask = async () => {
    if (!completeDescription.trim()) {
      toast({ title: 'Please add a description for completion', variant: 'warning' });
      return;
    }

    setIsCompleting(true);
    try {
      const payload = {
        remark: completeDescription,
        createdBy: `${taskToComplete.addressBook?.customerName || 'Customer'} - ${taskToComplete.site?.siteName || 'Site'} (${session.custFirstName} ${session.custLastName})`,
        status: 'Completed'
      };

      console.log('Sending completion payload:', payload);

      const response = await fetch(
        `https://enplerp.electrohelps.in/backend/task/${taskToComplete.id}/customer-remark`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.message || 'Failed to mark task as completed');
      }

      const result = await response.json();
      console.log('Task completed successfully:', result);

      toast({ title: 'Task marked as completed successfully!', variant: 'success' });

      const customerIds: number[] = Array.from(
        new Set(
          (session.sites as any[]).map((s) => Number(s.customerId))
        ),
      );
      await fetchTasksByCustomers(customerIds);

      setCompleteTaskModalOpen(false);
      setCompleteDescription('');
      setTaskToComplete(null);

    } catch (error: any) {
      console.error('Error completing task:', error);
      toast({ title: 'Error', description: error.message || 'Failed to mark task as completed', variant: 'error' });
    } finally {
      setIsCompleting(false);
    }
  };

  /* ===================================================== */

  return (
    <div className="min-h-screen bg-gradient-to-br text-black from-gray-50 to-gray-100">
      {/* Sidebar */}
      <CustomerSidebar 
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        session={session}
      />

      {/* Main Content */}
      <div className={`
        transition-all duration-300
        ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}
        p-4 md:p-6 lg:p-8
      `}>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                Customer Tickets & Complaints
              </h1>
              <p className="text-gray-600 uppercase mt-2">
                Welcome back, <span className="text-blue-600 font-semibold">{session.custFirstName} {session.custLastName}</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Customer ID: {customers.find(c => c.id === selectedCustomerId)?.addressBookID}
              </p>
            </div>

            <button
              onClick={openModal}
              disabled={isLoading || customers.length === 0}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 group"
            >
              <svg className="w-5 h-5 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Ticket
            </button>
          </div>

          {/* Filter Section */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Filter Tickets</h3>
                <p className="text-sm text-gray-600">
                  Showing {filteredTasks.length} of {tasks.length} total tickets
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                >
                  <Filter className="w-4 h-4" />
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
                </button>
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
                >
                  Reset Filters
                </button>
              </div>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                {/* Search Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search tickets..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      value={filterSearch}
                      onChange={(e) => setFilterSearch(e.target.value)}
                    />
                  </div>
                </div>

                {/* Customer Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer
                  </label>
                  <select
                    className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
                    value={filterCustomerId}
                    onChange={(e) => {
                      const newCustomerId = Number(e.target.value);
                      setFilterCustomerId(newCustomerId);
                      // Reset site filter when customer changes
                      setFilterSiteId(0);
                    }}
                  >
                    <option value="0">All Customers</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.customerName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Site Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Site
                  </label>
                  <select
                    className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
                    value={filterSiteId}
                    onChange={(e) => setFilterSiteId(Number(e.target.value))}
                  >
                    {/* When "All Customers" is selected */}
                    {filterCustomerId === 0 ? (
                      <option value="0">Select a customer first</option>
                    ) : (
                      <>
                        {/* "All Sites" option for the selected customer */}
                        <option value="0">All Sites</option>
                        {/* Individual sites for the selected customer */}
                        {getSitesForSelectedCustomer().map(site => (
                          <option key={site.id} value={site.id}>
                            {site.siteName}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                  {filterCustomerId > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      {getSitesForSelectedCustomer().length} site(s) available
                    </p>
                  )}
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    {statusOptions.map(status => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Total Tickets Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600 mb-2">Total Tickets</div>
                  <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
                </div>
                <div className="bg-blue-50 p-3 rounded-full">
                  <Ticket className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Open Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600 mb-2">Open</div>
                  <div className="text-3xl font-bold text-blue-600">{stats.open}</div>
                </div>
                <div className="bg-blue-50 p-3 rounded-full">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Work In Progress Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600 mb-2">Work In Progress</div>
                  <div className="text-3xl font-bold text-yellow-600">{stats.workInProgress}</div>
                </div>
                <div className="bg-yellow-50 p-3 rounded-full">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Completed Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600 mb-2">Completed</div>
                  <div className="text-3xl font-bold text-green-600">{stats.completed}</div>
                </div>
                <div className="bg-green-50 p-3 rounded-full">
                  <CheckSquare className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Tickets Table */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-gray-50">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">All Tickets</h3>
                  <p className="text-sm text-gray-600">
                    {isLoading ? 'Loading tickets...' : `Showing ${currentPageData.length} of ${filteredTasks.length} tickets`}
                  </p>
                </div>
                
                <div className="flex items-center gap-4">
                  {/* Items per page selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Show:</span>
                    <select
                      className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      value={itemsPerPage}
                      onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                    >
                      <option value="5">5</option>
                      <option value="10">10</option>
                      <option value="25">25</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                    </select>
                    <span className="text-sm text-gray-600">per page</span>
                  </div>

                  {/* Refresh button */}
                  {tasks.length > 0 && (
                    <button
                      onClick={() => {
                        const customerIds: number[] = Array.from(
                          new Set(
                            (session.sites as any[]).map((s) => Number(s.customerId))
                          ),
                        );
                        fetchTasksByCustomers(customerIds);
                      }}
                      disabled={isLoading}
                      className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Refresh
                    </button>
                  )}
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="py-12 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                <p className="text-gray-500 mt-4">Loading tickets...</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Ticket ID
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Site
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Department
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Title
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Last Updated on
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {currentPageData.map(task => (
                        <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-blue-700">
                              {task.taskID}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">
                              {task.addressBook?.customerName || 'Unknown Customer'}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">
                              {task.site?.siteName || 'Unknown Site'}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">
                              {task.department?.departmentName || 'Unknown Department'}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">
                              {task.title}
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            {(() => {
                              const status = getTaskStatus(task);
                              const displayStatus = normalizeStatus(status);
                              return (
                                <span
                                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeStyle(
                                    status,
                                  )}`}
                                >
                                  {displayStatus}
                                </span>
                              );
                            })()}
                          </td>

                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {formatRemarkDate(task)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {(() => {
                                const latestRemarkDate = getLatestRemarkDate(task);
                                if (!latestRemarkDate) {
                                  return 'No remarks yet';
                                }
                                
                                const taskCreatedDate = new Date(task.createdAt);
                                if (latestRemarkDate.getTime() > taskCreatedDate.getTime() + 1000) {
                                  return 'Updated';
                                }
                                return 'Initial';
                              })()}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              {/* Edit/Complete Button */}
                              {getTaskStatus(task).toLowerCase() !== 'completed' && (
                                <button
                                  onClick={() => openCompleteTaskModal(task)}
                                  className="text-green-600 hover:text-green-800 transition-colors p-1.5 hover:bg-green-50 rounded"
                                  title="Mark as Completed"
                                >
                                 <CheckSquare className="w-5 h-5" />
                                </button>
                              )}
                              
                              {/* View Details Button */}
                              <button
                                onClick={() => {
                                  setActiveTask(task);
                                  setRemarkText('');
                                  setRemarkModalOpen(true);
                                }}
                                className="text-blue-600 hover:text-blue-800 transition-colors p-1.5 hover:bg-blue-50 rounded"
                                title="View Details"
                              >
                                <MessageSquare className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}

                      {currentPageData.length === 0 && (
                        <tr>
                          <td colSpan={8} className="px-6 py-12 text-center">
                            <div className="text-gray-400 mb-2">
                              <Ticket className="w-16 h-16 mx-auto" />
                            </div>
                            <h4 className="text-lg font-medium text-gray-600 mb-2">
                              {filteredTasks.length === 0 && tasks.length > 0 ? 'No tickets match your filters' : 'No tickets found'}
                            </h4>
                            <p className="text-gray-500 mb-4">
                              {filteredTasks.length === 0 && tasks.length > 0 
                                ? 'Try adjusting your filters'
                                : 'Get started by creating your first ticket'}
                            </p>
                            <button
                              onClick={openModal}
                              disabled={customers.length === 0}
                              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg inline-flex items-center gap-2"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              Create First Ticket
                            </button>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {filteredTasks.length > 0 && (
                  <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                      <div className="text-sm text-gray-700">
                        Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                        <span className="font-medium">
                          {Math.min(currentPage * itemsPerPage, filteredTasks.length)}
                        </span>{' '}
                        of <span className="font-medium">{filteredTasks.length}</span> tickets
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {/* Previous Button */}
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Previous
                        </button>
                        
                        {/* Page Numbers */}
                        <div className="flex items-center space-x-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }
                            
                            return (
                              <button
                                key={pageNum}
                                onClick={() => handlePageChange(pageNum)}
                                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                  currentPage === pageNum
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-700 hover:bg-gray-100'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                          
                          {totalPages > 5 && currentPage < totalPages - 2 && (
                            <>
                              <span className="px-2 text-gray-500">...</span>
                              <button
                                onClick={() => handlePageChange(totalPages)}
                                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                  currentPage === totalPages
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-700 hover:bg-gray-100'
                                }`}
                              >
                                {totalPages}
                              </button>
                            </>
                          )}
                        </div>
                        
                        {/* Next Button */}
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                        >
                          Next
                          <ChevronRightIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Complete Task Modal */}
          {completeTaskModalOpen && taskToComplete && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl animate-fadeIn">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Mark Ticket as Completed</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Ticket ID: <span className="font-semibold">{taskToComplete.taskID}</span> | 
                      Title: <span className="font-semibold">{taskToComplete.title}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => setCompleteTaskModalOpen(false)}
                    disabled={isCompleting}
                    className="text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition p-2 rounded-full hover:bg-gray-100"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Task Information */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Customer</p>
                        <p className="text-sm font-medium text-gray-900">
                          {taskToComplete.addressBook?.customerName || 'Unknown Customer'}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500">Site</p>
                        <p className="text-sm font-medium text-gray-900">
                          {taskToComplete.site?.siteName || 'Unknown Site'}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500">Current Status</p>
                        <p className="text-sm font-medium">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeStyle(getTaskStatus(taskToComplete))}`}>
                            {getDisplayStatus(taskToComplete)}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Completion Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Completion Description *
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <textarea
                      className="w-full border text-black border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition h-48"
                      value={completeDescription}
                      onChange={(e) => setCompleteDescription(e.target.value)}
                      placeholder="Describe the completion details, work done, results, etc..."
                      required
                    />
                  </div>

                  {/* Modal Footer */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={handleCompleteTask}
                      disabled={isCompleting || !completeDescription.trim()}
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                    >
                      {isCompleting ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                          Marking as Completed...
                        </>
                      ) : (
                        <>
                          <CheckSquare className="w-5 h-5" />
                          Mark as Completed
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCompleteTaskModalOpen(false)}
                      disabled={isCompleting}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-gray-800 px-6 py-3 rounded-lg font-medium transition duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Remark Modal */}
          {remarkModalOpen && activeTask && (
            <div className="fixed inset-0 text-black bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white w-full max-w-2xl rounded-xl shadow-xl">
                <div className="flex justify-between items-center px-6 py-4 border-b">
                  <div>
                    <h2 className="text-lg  font-bold">
                      Remarks for Ticket: {activeTask.taskID}
                    </h2>
                    <p className="text-sm text-gray-600">
                      Current Status: <span className="font-medium">{getLatestStatus(activeTask)}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => setRemarkModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <textarea
                    className="w-full border rounded p-3"
                    placeholder="Enter your message..."
                    value={remarkText}
                    onChange={e => setRemarkText(e.target.value)}
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={async () => {
                        try {
                          const payload = {
                            remark: remarkText,
                            createdBy: `${activeTask.addressBook?.customerName || 'Customer'} - ${activeTask.site?.siteName || 'Site'} (${session.custFirstName} ${session.custLastName})`,
                          };

                          const response = await fetch(
                            `https://enplerp.electrohelps.in/backend/task/${activeTask.id}/customer-remark`,
                            {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify(payload),
                            },
                          );

                          if (!response.ok) {
                            const errorData = await response.json();
                            throw new Error(errorData.message || 'Failed to add remark');
                          }

                          toast({ title: 'Remark added successfully!', variant: 'success' });
                          setRemarkModalOpen(false);
                          const customerIds: number[] = Array.from(
                            new Set(
                              (session.sites as any[]).map((s) => Number(s.customerId))
                            ),
                          );
                          fetchTasksByCustomers(customerIds);
                        } catch (error: any) {
                          console.error('Error adding remark:', error);
                          toast({ title: 'Error', description: error.message || 'Failed to add remark', variant: 'error' });
                        }
                      }}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded transition"
                    >
                      Add Remark
                    </button>

                    {/* Only show Reopen button if task is Completed */}
                    {getLatestStatus(activeTask) === 'Completed' && (
                      <button
                        onClick={async () => {
                          try {
                            const payload = {
                              remark: remarkText || 'Reopened by customer',
                              createdBy: `${activeTask.addressBook?.customerName || 'Customer'} - ${activeTask.site?.siteName || 'Site'} (${session.custFirstName} ${session.custLastName})`,
                              status: 'Reopen',
                            };

                            const response = await fetch(
                              `https://enplerp.electrohelps.in/backend/task/${activeTask.id}/customer-remark`,
                              {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(payload),
                              },
                            );

                            if (!response.ok) {
                              const errorData = await response.json();
                              throw new Error(errorData.message || 'Failed to reopen ticket');
                            }

                            toast({ title: 'Ticket reopened successfully!', variant: 'success' });
                            setRemarkModalOpen(false);
                            const customerIds: number[] = Array.from(
                              new Set(
                                (session.sites as any[]).map((s) => Number(s.customerId))
                              ),
                            );
                            fetchTasksByCustomers(customerIds);
                          } catch (error: any) {
                            console.error('Error reopening ticket:', error);
                            toast({ title: 'Error', description: error.message || 'Failed to reopen ticket', variant: 'error' });
                          }
                        }}
                        className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-4 py-2 rounded transition"
                      >
                        Reopen Ticket
                      </button>
                    )}
                  </div>
                  <div className="space-y-3 max-h-64 overflow-y-auto border-t pt-4">
                    {[...activeTask.remarks]
                      .sort((a, b) => b.id - a.id)
                      .map((r: any) => (
                        <div key={r.id} className="border rounded p-3 text-sm">
                          <div className="flex justify-between">
                            <span className="font-semibold">{r.createdBy}</span>
                            <span className="text-xs text-gray-500">
                              {new Date(r.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <div className="mt-1">{r.remark}</div>
                          {r.status && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeStyle(r.status)}`}>
                              {r.status}
                            </span>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Create Task Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl animate-fadeIn">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Create New Ticket</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Create a new ticket/complaint for your customer account
                    </p>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    disabled={isLoading}
                    className="text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition p-2 rounded-full hover:bg-gray-100"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                  {/* Customer, Site, Department Row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Customer Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Customer *
                      </label>
                      <select
                        className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
                        value={selectedCustomerId || ''}
                        onChange={e => handleCustomerChange(Number(e.target.value))}
                        required
                        disabled={isLoading || customers.length === 0}
                      >
                        <option value="">
                          {customers.length === 0 ? 'No customers available' : 'Select a customer'}
                        </option>
                        {customers.map(customer => (
                          <option key={customer.id} value={customer.id}>
                            {customer.customerName}
                          </option>
                        ))}
                      </select>
                      {selectedCustomerId > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          ID: {customers.find(c => c.id === selectedCustomerId)?.addressBookID}
                        </p>
                      )}
                    </div>

                    {/* Site Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Site *
                      </label>
                      <select
                        className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
                        value={siteId || ''}
                        onChange={e => setSiteId(Number(e.target.value))}
                        required
                        disabled={isLoading || customerSites.length === 0 || !selectedCustomerId}
                      >
                        <option value="">
                          {!selectedCustomerId ? 'Select customer first' : customerSites.length === 0 ? 'No sites available' : 'Select a site'}
                        </option>
                        {customerSites.map(site => (
                          <option key={site.id} value={site.id}>
                            {site.siteName}
                          </option>
                        ))}
                      </select>
                      {siteId > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          Site ID: {customerSites.find(s => s.id === siteId)?.siteID}
                        </p>
                      )}
                    </div>

                    {/* Department Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Department *
                      </label>
                      <select
                        className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
                        value={departmentId || ''}
                        onChange={e => setDepartmentId(Number(e.target.value))}
                        required
                        disabled={isLoading}
                      >
                        <option value="">Select a department</option>
                        {departments.map(d => (
                          <option key={d.id} value={d.id}>
                            {d.departmentName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ticket Title *
                    </label>
                    <input
                      placeholder="Enter a brief title for the ticket"
                      className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      placeholder="Provide detailed description of the ticket or complaint (optional)"
                      className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition h-32"
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>

                  {/* User Information */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Logged in as</p>
                        <p className="text-sm font-medium text-gray-900">
                          {session.custFirstName} {session.custLastName}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Default Status</p>
                        <p className="text-sm font-medium text-blue-600">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Open
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                    <button
                      type="submit"
                      disabled={isLoading || customers.length === 0 || customerSites.length === 0}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                          Creating...
                        </>
                      ) : customers.length === 0 ? (
                        'No Customers Available'
                      ) : customerSites.length === 0 ? (
                        'No Sites Available'
                      ) : (
                        'Create Ticket'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      disabled={isLoading}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-gray-800 px-6 py-3 rounded-lg font-medium transition duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}