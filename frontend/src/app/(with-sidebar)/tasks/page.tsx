'use client';

import {
  PlusIcon, Pencil, Trash2, MessageSquare, Search, ChevronLeft, ChevronRight,
  Loader2, ShieldX, ExternalLink, Send, X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Dispatch, FormEvent, SetStateAction } from "react";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/components/ui/table';
import SlideFormPanel from '@/components/ui/SlideFormPanel';
import { useToast } from '@/components/ui/toaster';


interface Department {
  id: number;
  departmentName: string;
}

interface Engineer {
  id: number;
  engineerId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  telegramChatId?: string;
}

interface ServiceWorkscopeCategory {
  id: number;
  workscopeCategoryName: string;
}

interface AddressBook {
  id: number;
  addressBookID: string | null;
  customerName: string;
  addressType: string;
}

interface Site {
  id: number;
  siteID: string;
  siteName: string;
  addressBookId: number | null;
}

interface TaskInventory {
  productTypeId?: number;
  productName?: string;
  makeModel?: string;
  snMac?: string;
  description?: string;
  purchaseDate?: string;
  warrantyPeriod?: string;
  thirdPartyPurchase?: boolean;
  warrantyStatus?: string;
}

type TaskType = "SERVICE" | "PRODUCT_INQUIRY" | "PURCHASE_ORDER";
type PurchaseType = "INQUIRY" | "ORDER";

interface TaskPurchaseProduct {
  id?: number;
  make?: string;
  model?: string;
  description?: string;
  warranty?: string;
  rate?: number | string;
  vendor?: string;
  validity?: string;      // datetime-local string
  availability?: string;  // Inquiry only
}

interface TaskPurchase {
  purchaseType: PurchaseType;  // INQUIRY / ORDER
  customerName?: string;       // inquiry free text
  address?: string;            // inquiry free text
  products: TaskPurchaseProduct[];
  // attachments: handled later (see step 6)
}


interface Task {
  id?: number;
  taskID: string;
  userId: number;
  departmentId: number | null;
  addressBookId: number | null;
  siteId: number | null;
  status: string;
  department?: string;
  customer?: string;
  site?: string;
  addressBook?: string;
  workscopeCat?: string;
  createdBy: string;
  description?: string;
  title?: string;
  createdAt: string;
  contacts?: TasksContacts[];
  workscopeDetails?: TasksWorkscopeDetails[];
  schedule?: TasksSchedule[];
  remarks?: TasksRemarks[];
  taskInventories?: TaskInventory[];
  engineerId?: number | null;
  engineerTaskId?: string;
  engineer?: Engineer;
  taskType?: TaskType;        // 🔥 NEW
  purchase?: TaskPurchase;    // 🔥 NEW
  taskPurchaseAttachments?: {
    id: number;
    filename: string;
    filepath: string;
    mimeType: string;
    fileSize: number;
  }[];

}

interface TasksContacts {
  id?: number;
  taskId: number;
  contactName: string;
  contactNumber: string;
  contactEmail: string;
}

interface TasksWorkscopeDetails {
  id?: number;
  taskId: number;
  workscopeCategoryId: number;
  workscopeDetails: string;
  extraNote?: string;
}

interface TasksSchedule {
  id?: number;
  taskId: number;
  proposedDateTime: string;
  priority: string;
}

interface TasksRemarks {
  id?: number;
  taskId: number;
  remark: string;
  status: string;
  createdBy: string;
  description?: string;
  createdAt: string;
}

interface TaskFormData {
  // Core task fields
  id?: number;
  taskID?: string;
  departmentId: number | null;
  userId?: number | null;
  addressBookId: number | null;
  siteId: number | null;
  taskType?: string;
  engineerId?: number | null;

  title?: string;
  description?: string;
  priority?: string;
  status?: string;
  createdBy?: string;
  createdAt?: string;

  // SALES-only temporary fields
  customerName?: string;
  address?: string;
  contactName?: string;
  contactNumber?: string;
  contactEmail?: string;

  // PURCHASE
  purchase?: {
    purchaseType: "INQUIRY" | "ORDER";
    customerName?: string;
    address?: string;
    products: any[];
  };

  // Collections
  contacts: TasksContacts[];
  workscopeDetails: TasksWorkscopeDetails[];
  schedule: TasksSchedule[];
  remarks: TasksRemarks[];
}


// TaskModal Component
interface TaskModalProps {
  loading: boolean;
  isPurchaseDepartment: boolean;
  isTechnicalDepartment: boolean;
  isBillingDepartment: boolean;
  isSalesDepartment: boolean;
  isHRAdminDepartment: boolean;
  showModal: boolean;
  editingId: number | null;
  formData: TaskFormData;
  departments: Department[];
  engineers: Engineer[];
  addressBooks: AddressBook[];
  sites: Site[];
  serviceWorkscopeCategories: ServiceWorkscopeCategory[];
  departmentSearch: string;
  customerSearch: string;
  workscopeCategorySearch: string;
  showDepartmentDropdown: boolean;
  showCustomerDropdown: boolean;
  showWorkscopeDropdown: boolean;
  filteredDepartments: Department[];
  filteredCustomers: AddressBook[];
  filteredWorkscopeCategories: ServiceWorkscopeCategory[];
  filteredSites: Site[];
  savedContacts: TasksContacts[];
  savedWorkscopeDetails: TasksWorkscopeDetails[];
  savedSchedule: TasksSchedule[];
  savedRemarks: TasksRemarks[];
  editingSavedContact: number | null;
  editingSavedWorkscope: number | null;
  editingSavedSchedule: number | null;
  purchaseFile: File | null;
  setPurchaseFile: Dispatch<SetStateAction<File | null>>;
  inventories: any[];
  productTypes: any[];
  onClose: () => void;
  onSubmit: (e: FormEvent) => void;
  onDepartmentSearchChange: (value: string) => void;
  onCustomerSearchChange: (value: string) => void;
  onWorkscopeCategorySearchChange: (value: string) => void;
  onShowDepartmentDropdownChange: (show: boolean) => void;
  onShowCustomerDropdownChange: (show: boolean) => void;
  onShowWorkscopeDropdownChange: (show: boolean) => void;
  onFormDataChange: (data: TaskFormData) => void;
  onAddContact: () => void;
  onRemoveContact: (index: number) => void;
  onUpdateContact: (index: number, field: keyof TasksContacts, value: string) => void;
  onAddWorkscopeDetail: () => void;
  onRemoveWorkscopeDetail: (index: number) => void;
  onUpdateWorkscopeDetail: (index: number, field: keyof TasksWorkscopeDetails, value: string | number) => void;
  onAddSchedule: () => void;
  onRemoveSchedule: (index: number) => void;
  onUpdateSchedule: (index: number, field: keyof TasksSchedule, value: string) => void;
  onAddRemark: () => void;
  onRemoveRemark: (index: number) => void;
  onUpdateRemark: (index: number, field: keyof TasksRemarks, value: string) => void;
  onSaveContact: (index: number) => void;
  onSaveWorkscopeDetail: (index: number) => void;
  onSaveSchedule: () => void;
  onSaveRemark: (index: number) => void;
  onRemoveSavedContact: (id: number) => void;
  onRemoveSavedWorkscopeDetail: (id: number) => void;
  onRemoveSavedSchedule: (id: number) => void;
  onRemoveSavedRemark: (id: number) => void;
  onStartEditSavedContact: (id: number) => void;
  onSaveEditedContact: (id: number, updatedContact: TasksContacts) => void;
  onCancelEditSavedContact: () => void;
  onStartEditSavedWorkscope: (id: number) => void;
  onSaveEditedWorkscope: (id: number, updatedWorkscope: TasksWorkscopeDetails) => void;
  onCancelEditSavedWorkscope: () => void;
  onStartEditSavedSchedule: (id: number) => void;
  onSaveEditedSchedule: (id: number, updatedSchedule: TasksSchedule) => void;
  onCancelEditSavedSchedule: () => void;
  isTaskClosed: () => boolean;
  onEditLatestRemark: (remark: TasksRemarks) => void;
  onOpenInventoryModal: () => void;
  onRemoveInventory: (index: number) => void;
  savedPurchaseAttachments: any[];

}


const getAuthToken = () =>
  localStorage.getItem("access_token") ||
  localStorage.getItem("token");

// TaskModal Component - Updated structure
const TaskModal: React.FC<TaskModalProps> = ({
  loading,
  isPurchaseDepartment,
  isTechnicalDepartment,
  isBillingDepartment,
  isSalesDepartment,
  isHRAdminDepartment,
  showModal,
  editingId,
  formData,
  departments,
  engineers,
  addressBooks,
  serviceWorkscopeCategories,
  customerSearch,
  showCustomerDropdown,
  filteredCustomers,
  filteredSites,
  savedContacts,
  savedWorkscopeDetails,
  savedSchedule,
  savedRemarks,
  inventories,
  purchaseFile,
  setPurchaseFile,
  savedPurchaseAttachments,
  onClose,
  onSubmit,
  onCustomerSearchChange,
  onShowCustomerDropdownChange,
  onFormDataChange,
  onAddContact,
  onRemoveContact,
  onUpdateContact,
  onAddWorkscopeDetail,
  onRemoveWorkscopeDetail,
  onUpdateWorkscopeDetail,
  onAddRemark,
  onUpdateRemark,
  onUpdateSchedule,
  onSaveContact,
  onSaveWorkscopeDetail,
  onSaveSchedule,
  onRemoveSavedContact,
  onRemoveSavedWorkscopeDetail,
  onRemoveSavedSchedule,
  isTaskClosed,
  onEditLatestRemark,
  onOpenInventoryModal,
  onRemoveInventory,

}) => {
  // ✅ Hooks MUST be before any return
  const [customerActiveIndex, setCustomerActiveIndex] = useState(-1);
  const customerItemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!showModal) return; // ✅ safe inside effect

    if (showCustomerDropdown) {
      setCustomerActiveIndex(filteredCustomers.length > 0 ? 0 : -1);
    } else {
      setCustomerActiveIndex(-1);
    }
  }, [showModal, showCustomerDropdown, filteredCustomers.length]);

  useEffect(() => {
    if (!showModal) return; // ✅ safe inside effect
    setCustomerActiveIndex(filteredCustomers.length > 0 ? 0 : -1);
  }, [showModal, customerSearch, filteredCustomers.length]);

  useEffect(() => {
    if (!showModal) return; // ✅ safe inside effect

    if (customerActiveIndex >= 0 && customerItemRefs.current[customerActiveIndex]) {
      customerItemRefs.current[customerActiveIndex]?.scrollIntoView({
        block: "nearest",
      });
    }
  }, [showModal, customerActiveIndex]);

  return (
    <SlideFormPanel
      title={editingId ? 'Edit Task' : 'Add Task'}
      description={editingId ? 'Update the task details below' : 'Fill in the task information to create a new task'}
      isOpen={showModal}
      onClose={onClose}
    >
          <form onSubmit={onSubmit} className="space-y-6">
            {/* Basic Task Information - Always show */}
            <div className="border-b pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Department
                  </label>
                  <select
                    value={formData.departmentId ?? ""}
                    onChange={(e) =>
                      onFormDataChange({
                        ...formData,
                        departmentId: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    required
                  >
                    <option value="" disabled>
                      Select Department
                    </option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.departmentName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Engineer
                  </label>
                  <select
                    value={formData.engineerId ?? ""}
                    onChange={(e) =>
                      onFormDataChange({
                        ...formData,
                        engineerId: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  >
                    <option value="">Select Engineer (Optional)</option>
                    {engineers.map((eng) => (
                      <option key={eng.id} value={eng.id}>
                        {eng.engineerId} - {eng.firstName} {eng.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* PURCHASE DEPARTMENT SECTION */}
            {isPurchaseDepartment && (
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Purchase</h3>

                {/* Task Type Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Task Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.purchase?.purchaseType || "INQUIRY"}
                      onChange={(e) => {
                        const purchaseType = e.target.value as "INQUIRY" | "ORDER";

                        const newData = {
                          ...formData,
                          taskType: (purchaseType === "INQUIRY" ? "PRODUCT_INQUIRY" : "PURCHASE_ORDER") as TaskType,
                          purchase: {
                            ...(formData.purchase || { products: [] }),
                            purchaseType,
                            // Clear inquiry fields when switching to ORDER
                            customerName: purchaseType === "INQUIRY" ? (formData.purchase?.customerName || "") : "",
                            address: purchaseType === "INQUIRY" ? (formData.purchase?.address || "") : "",
                            products: formData.purchase?.products || [],
                          },
                        };

                        // Reset customer/site selection for Inquiry
                        if (purchaseType === "INQUIRY") {
                          newData.addressBookId = null;
                          newData.siteId = null;

                          onCustomerSearchChange("");
                        }

                        onFormDataChange(newData);
                      }}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                      required
                    >
                      <option value="INQUIRY">Product Inquiry</option>
                      <option value="ORDER">Purchase Order</option>
                    </select>
                  </div>
                </div>

                {/* CUSTOMER SELECTION FOR PURCHASE ORDER */}
                {(formData.purchase?.purchaseType || "INQUIRY") === "ORDER" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        Customer <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={customerSearch}
                        onChange={(e) => {
                          onCustomerSearchChange(e.target.value);
                          onShowCustomerDropdownChange(true);
                        }}
                        onFocus={() => onShowCustomerDropdownChange(true)}
                        onKeyDown={(e) => {
                          if (!showCustomerDropdown && customerSearch.trim().length > 0) {
                            onShowCustomerDropdownChange(true);
                          }

                          if (!showCustomerDropdown) return;

                          if (e.key === "ArrowDown") {
                            e.preventDefault();
                            setCustomerActiveIndex((prev) => {
                              if (filteredCustomers.length === 0) return -1;
                              return prev < filteredCustomers.length - 1 ? prev + 1 : 0;
                            });
                          }

                          if (e.key === "ArrowUp") {
                            e.preventDefault();
                            setCustomerActiveIndex((prev) => {
                              if (filteredCustomers.length === 0) return -1;
                              return prev > 0 ? prev - 1 : filteredCustomers.length - 1;
                            });
                          }

                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (customerActiveIndex >= 0 && filteredCustomers[customerActiveIndex]) {
                              const customer = filteredCustomers[customerActiveIndex];

                              onFormDataChange({ ...formData, addressBookId: customer.id, siteId: null });
                              onCustomerSearchChange(`${customer.addressBookID} - ${customer.customerName}`);
                              onShowCustomerDropdownChange(false);
                            }
                          }

                          if (e.key === "Escape") {
                            onShowCustomerDropdownChange(false);
                          }
                        }}
                        placeholder="Search customer..."
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                        required
                      />

                      {showCustomerDropdown && customerSearch && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {filteredCustomers.map((customer, index) => (
                            <div
                              key={customer.id}
                              ref={(el) => { customerItemRefs.current[index] = el; }}
                              onMouseEnter={() => setCustomerActiveIndex(index)}
                              className={`px-3 py-2 cursor-pointer text-gray-900
          ${customerActiveIndex === index ? "bg-blue-100" : "hover:bg-gray-100"}
        `}
                              onClick={() => {
                                onFormDataChange({ ...formData, addressBookId: customer.id, siteId: null });
                                onCustomerSearchChange(`${customer.addressBookID} - ${customer.customerName}`);
                                onShowCustomerDropdownChange(false);
                              }}
                            >
                              {customer.addressBookID} - {customer.customerName}
                            </div>
                          ))}

                          {filteredCustomers.length === 0 && (
                            <div className="px-3 py-2 text-gray-500">No customers found</div>
                          )}
                        </div>
                      )}


                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        Address (Inquiry) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.purchase?.address || ""}
                        onChange={(e) =>
                          onFormDataChange({
                            ...formData,
                            purchase: {
                              ...(formData.purchase || { purchaseType: "INQUIRY", products: [] }),
                              address: e.target.value,
                            },
                          })
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                        placeholder="Enter address for inquiry"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* TITLE FIELD - FOR BOTH INQUIRY AND ORDER */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title || ''}
                    onChange={(e) =>
                      onFormDataChange({ ...formData, title: e.target.value })
                    }
                    placeholder="Enter title..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    required
                  />
                </div>

                {/* PRODUCTS REQUIREMENTS */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Products Requirements <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.description || ""}
                    onChange={(e) => onFormDataChange({ ...formData, description: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white min-h-[90px]"
                    placeholder="Enter products requirements..."
                    required
                  />
                </div>

                {/* PRODUCTS TABLE */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-md font-semibold text-gray-900">Products</h4>
                    <button
                      type="button"
                      onClick={() => (window as any).__addPurchaseProductRow?.()}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                    >
                      + Add Product
                    </button>
                  </div>

                  <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-blue-50">
                        <tr>
                          <th className="p-2 text-left text-blue-800 font-semibold">Make</th>
                          <th className="p-2 text-left text-blue-800 font-semibold">Model</th>
                          <th className="p-2 text-left text-blue-800 font-semibold">Description</th>
                          <th className="p-2 text-left text-blue-800 font-semibold">Warranty</th>
                          <th className="p-2 text-left text-blue-800 font-semibold">Rate</th>
                          <th className="p-2 text-left text-blue-800 font-semibold">Vendor</th>

                          {/* Inquiry-only fields */}
                          {(formData.purchase?.purchaseType || "INQUIRY") === "INQUIRY" && (
                            <>
                              <th className="p-2 text-left text-blue-800 font-semibold">Validity</th>
                              <th className="p-2 text-left text-blue-800 font-semibold">Availability</th>
                            </>
                          )}
                          <th className="p-2 text-left text-blue-800 font-semibold w-20">Action</th>
                        </tr>
                      </thead>

                      <tbody>
                        {(formData.purchase?.products || []).length === 0 ? (
                          <tr>
                            <td className="p-3 text-gray-500" colSpan={(formData.purchase?.purchaseType || "INQUIRY") === "INQUIRY" ? 10 : 8}>
                              No products added yet.
                            </td>
                          </tr>
                        ) : (
                          (formData.purchase?.products || []).map((p, idx) => (
                            <tr key={idx} className="border-t">
                              <td className="p-2">
                                <input
                                  value={p.make || ""}
                                  onChange={(e) => (window as any).__updatePurchaseProductRow?.(idx, "make", e.target.value)}
                                  className="w-40 border rounded px-2 py-1 text-gray-900"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  value={p.model || ""}
                                  onChange={(e) => (window as any).__updatePurchaseProductRow?.(idx, "model", e.target.value)}
                                  className="w-40 border rounded px-2 py-1 text-gray-900"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  value={p.description || ""}
                                  onChange={(e) => (window as any).__updatePurchaseProductRow?.(idx, "description", e.target.value)}
                                  className="w-64 border rounded px-2 py-1 text-gray-900"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  value={p.warranty || ""}
                                  onChange={(e) => (window as any).__updatePurchaseProductRow?.(idx, "warranty", e.target.value)}
                                  className="w-32 border rounded px-2 py-1 text-gray-900"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  value={String(p.rate ?? "")}
                                  onChange={(e) => (window as any).__updatePurchaseProductRow?.(idx, "rate", e.target.value)}
                                  className="w-28 border rounded px-2 py-1 text-gray-900"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  value={p.vendor || ""}
                                  onChange={(e) => (window as any).__updatePurchaseProductRow?.(idx, "vendor", e.target.value)}
                                  className="w-40 border rounded px-2 py-1 text-gray-900"
                                />
                              </td>

                              {/* Inquiry-only fields */}
                              {(formData.purchase?.purchaseType || "INQUIRY") === "INQUIRY" && (
                                <>
                                  <td className="p-2">
                                    <input
                                      type="datetime-local"
                                      value={p.validity || ""}
                                      onChange={(e) => (window as any).__updatePurchaseProductRow?.(idx, "validity", e.target.value)}
                                      className="w-56 border rounded px-2 py-1 text-gray-900"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <input
                                      value={p.availability || ""}
                                      onChange={(e) => (window as any).__updatePurchaseProductRow?.(idx, "availability", e.target.value)}
                                      className="w-40 border rounded px-2 py-1 text-gray-900"
                                    />
                                  </td>
                                </>
                              )}

                              <td className="p-2">
                                <button
                                  type="button"
                                  onClick={() => (window as any).__removePurchaseProductRow?.(idx)}
                                  className="text-red-600 hover:text-red-800 text-sm"
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* ATTACHMENT */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Attachment
                  </label>

                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setPurchaseFile(file);
                    }}
                  />
                  {savedPurchaseAttachments.length > 0 && (
                    <div className="mt-3 space-y-2 text-black">
                      <div className="text-sm font-medium text-gray-700">
                        Existing Attachments
                      </div>

                      {savedPurchaseAttachments.map(att => (
                        <div
                          key={att.id}
                          className="flex items-center justify-between bg-gray-50 border rounded px-3 py-2"
                        >
                          <span className="text-sm text-gray-800 truncate">
                            {att.filename}
                          </span>

                          <div className="flex gap-3 text-sm">
                            <a
                              href={`http://localhost:8000/${String(att.filepath).replace(/\\/g, "/")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              View
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {purchaseFile && (
                    <div className="text-xs text-green-600 mt-1">
                      Selected: {purchaseFile.name}
                    </div>
                  )}

                  <div className="text-xs text-gray-500 mt-1">
                    Max file size: 10MB. Supported formats: PDF, DOC, DOCX, JPG, PNG
                  </div>
                </div>
              </div>
            )}

            {/* REGULAR TASK FIELDS FOR TECHNICAL, BILLING, HR&ADMIN, SALES */}
            {!isPurchaseDepartment && (
              <>
                {/* Customer and Site Selection for Technical & Billing */}
                {(isTechnicalDepartment || isBillingDepartment) && (
                  <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Customer Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="relative">
                        <label className="block text-sm font-medium text-gray-900 mb-1">
                          Customer <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={customerSearch}
                          onChange={(e) => {
                            onCustomerSearchChange(e.target.value);
                            onShowCustomerDropdownChange(true);
                          }}
                          onFocus={() => onShowCustomerDropdownChange(true)}
                          onKeyDown={(e) => {
                            if (!showCustomerDropdown && customerSearch.trim().length > 0) {
                              onShowCustomerDropdownChange(true);
                            }

                            if (!showCustomerDropdown) return;

                            if (e.key === "ArrowDown") {
                              e.preventDefault();
                              setCustomerActiveIndex((prev) => {
                                if (filteredCustomers.length === 0) return -1;
                                return prev < filteredCustomers.length - 1 ? prev + 1 : 0;
                              });
                            }

                            if (e.key === "ArrowUp") {
                              e.preventDefault();
                              setCustomerActiveIndex((prev) => {
                                if (filteredCustomers.length === 0) return -1;
                                return prev > 0 ? prev - 1 : filteredCustomers.length - 1;
                              });
                            }

                            if (e.key === "Enter") {
                              e.preventDefault();

                              if (customerActiveIndex >= 0 && filteredCustomers[customerActiveIndex]) {
                                const customer = filteredCustomers[customerActiveIndex];

                                onFormDataChange({ ...formData, addressBookId: customer.id, siteId: null });
                                onCustomerSearchChange(`${customer.addressBookID} - ${customer.customerName}`);
                                onShowCustomerDropdownChange(false);
                              }
                            }

                            if (e.key === "Escape") {
                              onShowCustomerDropdownChange(false);
                            }
                          }}
                          placeholder="Search customer..."
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                          required={isTechnicalDepartment || isBillingDepartment}
                        />

                        {showCustomerDropdown && customerSearch && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {filteredCustomers.map((customer, index) => (
                              <div
                                key={customer.id}
                                ref={(el) => { customerItemRefs.current[index] = el; }}
                                onMouseEnter={() => setCustomerActiveIndex(index)}
                                className={`px-3 py-2 cursor-pointer text-gray-900
      ${customerActiveIndex === index ? "bg-blue-100" : "hover:bg-gray-100"}
    `}
                                onClick={() => {
                                  onFormDataChange({ ...formData, addressBookId: customer.id, siteId: null });
                                  onCustomerSearchChange(`${customer.addressBookID} - ${customer.customerName}`);
                                  onShowCustomerDropdownChange(false);
                                }}
                              >
                                {customer.addressBookID} - {customer.customerName}
                              </div>
                            ))}

                            {filteredCustomers.length === 0 && (
                              <div className="px-3 py-2 text-gray-500">No customers found</div>
                            )}
                          </div>
                        )}
                        {formData.addressBookId !== null && formData.addressBookId > 0 && (
                          <div className="mt-1 text-sm text-green-600">
                            Selected: {addressBooks.find(ab => ab.id === formData.addressBookId)?.customerName}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-1">
                          {isBillingDepartment ? "Branch" : "Site"} <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.siteId ?? ""}
                          onChange={(e) =>
                            onFormDataChange({
                              ...formData,
                              siteId: e.target.value ? Number(e.target.value) : null,
                            })
                          }
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                          required={isTechnicalDepartment || isBillingDepartment}
                          disabled={!formData.addressBookId}
                        >
                          <option value="" disabled>
                            Select {isBillingDepartment ? "Branch" : "Site"}
                          </option>
                          {filteredSites.map((site) => (
                            <option key={site.id} value={site.id}>
                              {site.siteID} - {site.siteName}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* SALES DEPARTMENT FIELDS */}
                {isSalesDepartment && (
                  <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Sales Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Customer Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-1">
                          Customer Name <span className="text-red-500">*</span>
                        </label>

                        <input
                          type="text"
                          value={formData.purchase?.customerName || ""}
                          onChange={(e) =>
                            onFormDataChange({
                              ...formData,
                              purchase: {
                                ...(formData.purchase || { purchaseType: "INQUIRY", products: [] }),
                                purchaseType: "INQUIRY",
                                customerName: e.target.value, // ✅ correct field
                                address: formData.purchase?.address || "",
                                products: formData.purchase?.products || [],
                              },
                            })
                          }
                          placeholder="Enter customer name"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                          required
                        />
                      </div>

                      {/* Address */}
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-1">
                          Address <span className="text-red-500">*</span>
                        </label>

                        <input
                          type="text"
                          value={formData.purchase?.address || ""}
                          onChange={(e) =>
                            onFormDataChange({
                              ...formData,
                              purchase: {
                                ...(formData.purchase || { purchaseType: "INQUIRY", products: [] }),
                                purchaseType: "INQUIRY",
                                customerName: formData.purchase?.customerName || "",
                                address: e.target.value, // ✅ correct field
                                products: formData.purchase?.products || [],
                              },
                            })
                          }
                          placeholder="Enter address"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                          required
                        />
                      </div>


                      {/* <div>
                        <label className="block text-sm font-medium text-gray-900 mb-1">
                          Contact Name demooooooo *
                        </label>
                        <input
                          type="text"
                          value={formData.contactName || ''}
                          onChange={(e) =>
                            onFormDataChange({ ...formData, contactName: e.target.value })
                          }
                          placeholder="Enter contact name"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-1">
                          Contact Number *
                        </label>
                        <input
                          type="text"
                          value={formData.contactNumber || ''}
                          onChange={(e) =>
                            onFormDataChange({ ...formData, contactNumber: e.target.value })
                          }
                          placeholder="Enter contact number"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                          required
                        />
                      </div> */}

                      {/* <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-900 mb-1">
                          Contact Email
                        </label>
                        <input
                          type="email"
                          value={formData.contactEmail || ''}
                          onChange={(e) =>
                            onFormDataChange({ ...formData, contactEmail: e.target.value })
                          }
                          placeholder="Enter contact email"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                        />
                      </div> */}
                    </div>
                  </div>
                )}

                {/* COMMON FIELDS FOR ALL DEPARTMENTS (except Purchase) */}
                <div className="border-b pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Task Details</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.title || ''}
                        onChange={(e) =>
                          onFormDataChange({ ...formData, title: e.target.value })
                        }
                        placeholder="Enter task title..."
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        Description
                      </label>
                      <textarea
                        value={formData.description || ''}
                        onChange={(e) =>
                          onFormDataChange({ ...formData, description: e.target.value })
                        }
                        placeholder="Add a task description..."
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white min-h-[100px]"
                        rows={4}
                      />
                    </div>
                  </div>
                </div>

                {/* ATTACHMENT SECTION FOR BILLING, HR&ADMIN, SALES */}
                {(isBillingDepartment || isHRAdminDepartment || isSalesDepartment) && (
                  <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Attachment</h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        File Attachment
                      </label>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setPurchaseFile(file);
                        }}
                        className="w-full"
                      />
                      {purchaseFile && (
                        <div className="text-xs text-green-600 mt-1">
                          Selected: {purchaseFile.name}
                        </div>
                      )}
                      <div className="text-xs text-gray-500 mt-1">
                        Max file size: 10MB. Supported formats: PDF, DOC, DOCX, JPG, PNG
                      </div>
                    </div>
                  </div>
                )}

                {/* Task Contacts (Only for Technical & Sales) */}
                {(isTechnicalDepartment || isSalesDepartment) && (
                  <div className="border-b pb-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">Task Contacts</h3>
                      <button
                        type="button"
                        onClick={onAddContact}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                      >
                        + Add Contact
                      </button>
                    </div>

                    {formData.contacts.length > 0 && formData.contacts.map((contact, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-white rounded-lg border">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Contact Name
                          </label>
                          <input
                            type="text"
                            value={contact.contactName}
                            onChange={(e) => onUpdateContact(index, "contactName", e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-black bg-white"
                            placeholder="Enter contact name"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Contact Number
                          </label>
                          <input
                            type="text"
                            value={contact.contactNumber}
                            onChange={(e) => onUpdateContact(index, "contactNumber", e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-black bg-white"
                            placeholder="Enter contact number"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Contact Email
                          </label>
                          <input
                            type="email"
                            value={contact.contactEmail}
                            onChange={(e) => onUpdateContact(index, "contactEmail", e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-black bg-white"
                            placeholder="Enter contact email"
                          />
                        </div>

                        <div className="flex items-end gap-2">
                          <button
                            type="button"
                            onClick={() => onSaveContact(index)}
                            disabled={!contact.contactName || !contact.contactNumber}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                          >
                            Save Contact
                          </button>
                          {formData.contacts.length > 1 && (
                            <button
                              type="button"
                              onClick={() => onRemoveContact(index)}
                              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    ))}

                    {savedContacts.length > 0 && (
                      <div className="bg-white rounded-lg border overflow-hidden mb-4">
                        <table className="w-full text-sm">
                          <thead className="bg-blue-50">
                            <tr>
                              <th className="p-3 text-left text-blue-800 font-semibold">Name</th>
                              <th className="p-3 text-left text-blue-800 font-semibold">Number</th>
                              <th className="p-3 text-left text-blue-800 font-semibold">Email</th>
                              <th className="p-3 text-left text-blue-800 font-semibold w-20">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {savedContacts.map((contact) => (
                              <tr key={contact.id} className="border-t border-gray-200 hover:bg-gray-50">
                                <td className="p-3 text-gray-700">{contact.contactName}</td>
                                <td className="p-3 text-gray-700">{contact.contactNumber}</td>
                                <td className="p-3 text-gray-700">{contact.contactEmail || "N/A"}</td>
                                <td className="p-3">
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() => onRemoveSavedContact(contact.id!)}
                                      className="text-red-600 hover:text-red-800 font-medium text-sm"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* Workscope Details (Only for Technical) */}
                {isTechnicalDepartment && (
                  <div className="border-b pb-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">Workscope Details</h3>
                      <button
                        type="button"
                        onClick={onAddWorkscopeDetail}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                      >
                        + Add WorkScope
                      </button>
                    </div>

                    {formData.workscopeDetails.length > 0 && formData.workscopeDetails.map((detail, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-white rounded-lg border">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Workscope Category
                          </label>
                          <select
                            value={detail.workscopeCategoryId || 0}
                            onChange={(e) => onUpdateWorkscopeDetail(index, "workscopeCategoryId", parseInt(e.target.value))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-black bg-white"
                          >
                            <option value={0}>Select Category</option>
                            {serviceWorkscopeCategories.map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.workscopeCategoryName}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Workscope Details
                          </label>
                          <textarea
                            value={detail.workscopeDetails || ''}
                            onChange={(e) => onUpdateWorkscopeDetail(index, 'workscopeDetails', e.target.value)}
                            placeholder="Enter workscope details..."
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-black bg-white min-h-[42px] resize-vertical"
                            rows={2}
                          />
                        </div>

                        <div className="flex justify-end items-end gap-2 md:col-span-2">
                          <button
                            type="button"
                            onClick={() => onSaveWorkscopeDetail(index)}
                            disabled={!detail.workscopeDetails || detail.workscopeCategoryId === 0}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                          >
                            Save Workscope
                          </button>
                          {formData.workscopeDetails.length > 1 && (
                            <button
                              type="button"
                              onClick={() => onRemoveWorkscopeDetail(index)}
                              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    ))}

                    {savedWorkscopeDetails.length > 0 && (
                      <div className="bg-white rounded-lg border overflow-hidden mb-4">
                        <table className="w-full text-sm">
                          <thead className="bg-blue-50">
                            <tr>
                              <th className="p-3 text-left text-blue-800 font-semibold">Category</th>
                              <th className="p-3 text-left text-blue-800 font-semibold">Details</th>
                              <th className="p-3 text-left text-blue-800 font-semibold w-20">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {savedWorkscopeDetails.map((workscope) => (
                              <tr key={workscope.id} className="border-t border-gray-200 hover:bg-gray-50">
                                <td className="p-3 text-gray-700">
                                  {serviceWorkscopeCategories.find(cat => cat.id === workscope.workscopeCategoryId)?.workscopeCategoryName || 'N/A'}
                                </td>
                                <td className="p-3 text-gray-700">{workscope.workscopeDetails}</td>
                                <td className="p-3">
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() => onRemoveSavedWorkscopeDetail(workscope.id!)}
                                      className="text-red-600 hover:text-red-800 font-medium text-sm"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* Schedule (Only for Technical) */}
                {isTechnicalDepartment && (
                  <div className="border-b pb-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">Schedule</h3>
                    </div>

                    {formData.schedule.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-white rounded-lg border">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Proposed Date & Time
                          </label>
                          <input
                            type="datetime-local"
                            value={formData.schedule[0]?.proposedDateTime || ''}
                            onChange={(e) => onUpdateSchedule(0, 'proposedDateTime', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-black bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Priority
                          </label>
                          <select
                            value={formData.schedule[0]?.priority || 'Medium'}
                            onChange={(e) => onUpdateSchedule(0, 'priority', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-black bg-white"
                          >
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                            <option value="Urgent">Urgent</option>
                          </select>
                        </div>

                        <div className="flex items-end gap-2">
                          <button
                            type="button"
                            onClick={onSaveSchedule}
                            disabled={!formData.schedule[0]?.proposedDateTime || !formData.schedule[0]?.priority}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                          >
                            Add Schedule
                          </button>
                        </div>
                      </div>
                    )}

                    {savedSchedule.length > 0 && (
                      <div className="bg-white rounded-lg border overflow-hidden mb-4">
                        <table className="w-full text-sm">
                          <thead className="bg-blue-50">
                            <tr>
                              <th className="p-3 text-left text-blue-800 font-semibold">Date & Time</th>
                              <th className="p-3 text-left text-blue-800 font-semibold">Priority</th>
                              <th className="p-3 text-left text-blue-800 font-semibold w-20">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {savedSchedule.map((schedule) => (
                              <tr key={schedule.id} className="border-t border-gray-200 hover:bg-gray-50">
                                <td className="p-3 text-gray-700">
                                  {new Date(schedule.proposedDateTime).toLocaleString()}
                                </td>
                                <td className="p-3 text-gray-700">{schedule.priority}</td>
                                <td className="p-3">
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() => onRemoveSavedSchedule(schedule.id!)}
                                      className="text-red-600 hover:text-red-800 font-medium text-sm"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* Inventory Section (Only for Technical) */}
                {isTechnicalDepartment && (
                  <div className="border-b pb-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">Inventory Items</h3>
                      <button
                        type="button"
                        onClick={onOpenInventoryModal}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                      >
                        + Add Inventory Item
                      </button>
                    </div>

                    {inventories.length > 0 ? (
                      <div className="bg-white rounded-lg border overflow-hidden mb-4">
                        <table className="w-full text-sm">
                          <thead className="bg-blue-50">
                            <tr>
                              <th className="p-3 text-left text-blue-800 font-semibold">Product Type</th>
                              <th className="p-3 text-left text-blue-800 font-semibold">Make & Model</th>
                              <th className="p-3 text-left text-blue-800 font-semibold">SN/MAC</th>
                              <th className="p-3 text-left text-blue-800 font-semibold">Warranty</th>
                              <th className="p-3 text-left text-blue-800 font-semibold">3rd Party</th>
                              <th className="p-3 text-left text-blue-800 font-semibold w-20">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {inventories.map((inv, i) => (
                              <tr key={i} className="border-t hover:bg-gray-50">
                                <td className="p-3 text-gray-700">{inv.productName}</td>
                                <td className="p-3 text-gray-700">{inv.makeModel}</td>
                                <td className="p-3 text-gray-700">{inv.snMac}</td>
                                <td className="p-3 text-gray-700">{inv.warrantyStatus}</td>
                                <td className="p-3 text-gray-700">{inv.thirdPartyPurchase ? "Yes" : "No"}</td>
                                <td className="p-3">
                                  <button
                                    type="button"
                                    onClick={() => onRemoveInventory(i)}
                                    className="text-red-600 hover:text-red-800 text-sm"
                                  >
                                    Remove
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg border">
                        No inventory items added yet
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Task Remarks - KEEP THIS FOR ALL DEPARTMENTS */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-gray-900">Task Remarks</h3>
              </div>

              {!editingId && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-white rounded-lg border">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Remark
                    </label>
                    <textarea
                      value={formData.remarks[0]?.remark || ''}
                      onChange={(e) => onUpdateRemark(0, 'remark', e.target.value)}
                      placeholder="Enter new remark..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-black bg-white min-h-[42px] resize-vertical"
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={formData.remarks[0]?.status || 'Open'}
                      onChange={(e) => onUpdateRemark(0, 'status', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 text-black bg-white"
                      disabled
                    >
                      <option value="Open">Open</option>
                    </select>
                    <div className="text-xs text-gray-500 mt-1">
                      Status can only be updated in the Remarks modal
                    </div>
                  </div>

                  <div className="justify-end flex items-end gap-2 md:col-span-3">
                    <button
                      type="button"
                      onClick={onAddRemark}
                      disabled={isTaskClosed() || !formData.remarks[0]?.remark || !formData.remarks[0]?.status}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      Add Remark
                    </button>
                  </div>
                </div>
              )}

              {savedRemarks.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-md font-semibold text-gray-900 mb-3">
                    {editingId ? 'Task Remarks' : 'Saved Remarks'}
                  </h4>
                  <div className="space-y-3">
                    {[...savedRemarks]
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((remark) => (
                        <div
                          key={remark.id}
                          className="p-3 bg-gray-50 border border-gray-200 rounded-lg flex justify-between items-start"
                        >
                          <div className="flex-1">
                            <div className="text-sm text-gray-800 mb-1">
                              <strong>Status:</strong> {remark.status}
                            </div>
                            <div className="text-gray-700">{remark.remark}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {new Date(remark.createdAt).toLocaleString()} — {remark.createdBy}
                            </div>
                          </div>

                          {remark.id === [...savedRemarks]
                            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]?.id && (
                              <button
                                type="button"
                                onClick={() => onEditLatestRemark(remark)}
                                className="text-blue-600 hover:text-blue-800 text-sm ml-2 flex items-center gap-1"
                                title="Edit latest remark"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit
                              </button>
                            )}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Form Actions - ALWAYS SHOW */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 cursor-pointer text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading && (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                )}
                {!loading && (editingId ? "Update Task" : "Create Task")}
              </button>

            </div>
          </form>
    </SlideFormPanel>
  );
};

// Remarks Only Modal Component
// Remarks Only Modal Component
interface RemarksModalProps {
  showModal: boolean;
  task: Task | null;
  savedRemarks: TasksRemarks[];
  onClose: () => void;
  onAddRemark: (remark: string, status: string) => Promise<void>;
  onRemoveRemark: (id: number) => void;
  onEditLatestRemark: (remark: TasksRemarks) => void;
  getAllowedStatuses: (currentStatus: string) => string[];
  isTechnicalDepartment?: boolean;
}

/* ──────────────────────────────────────────────
   Chatbot-style Floating Remarks Panel (shadcn)
────────────────────────────────────────────── */
const remarkStatusColor = (s: string) => {
  const m: Record<string, string> = {
    Completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    Closed: 'bg-green-100 text-green-800 border-green-200',
    'Work in Progress': 'bg-amber-100 text-amber-700 border-amber-200',
    'On-Hold': 'bg-orange-100 text-orange-700 border-orange-200',
    Rescheduled: 'bg-purple-100 text-purple-700 border-purple-200',
    Scheduled: 'bg-blue-100 text-blue-700 border-blue-200',
    Assigned: 'bg-blue-100 text-blue-700 border-blue-200',
    Reopen: 'bg-red-100 text-red-700 border-red-200',
    Open: 'bg-slate-100 text-slate-700 border-slate-200',
  };
  return m[s] ?? 'bg-gray-100 text-gray-700 border-gray-200';
};

const RemarksModal: React.FC<RemarksModalProps> = ({
  showModal,
  task,
  savedRemarks,
  onClose,
  onAddRemark,
  onRemoveRemark,
  onEditLatestRemark,
  getAllowedStatuses,
  isTechnicalDepartment,
}) => {
  const [newRemark, setNewRemark] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const normalizeStatus = (status: string) => {
    if (!status) return 'Open';
    const normalized = status.trim().toLowerCase().replace(/\b\w/g, c => c.toUpperCase()).replace(/\s+/g, ' ');
    if (normalized.includes('Progress') || normalized.includes('Wip') || normalized === 'Wip') return 'Work in Progress';
    return normalized;
  };

  const getCurrentTaskStatus = () => {
    if (!task?.remarks || task.remarks.length === 0) return 'Open';
    const latest = [...task.remarks].sort((a, b) => (b.id || 0) - (a.id || 0))[0];
    return normalizeStatus(latest.status);
  };

  const currentStatus = getCurrentTaskStatus();
  const allowedStatuses = getAllowedStatuses(currentStatus);
  const [newStatus, setNewStatus] = useState<string>(allowedStatuses[0] ?? currentStatus);

  useEffect(() => {
    if (!showModal || !task) return;
    const curr = getCurrentTaskStatus();
    const allowed = getAllowedStatuses(curr);
    setNewStatus(allowed[0] ?? curr);
    setNewRemark('');
    setIsSubmitting(false);
  }, [showModal, task?.id, savedRemarks.length]);

  // Auto-scroll to bottom when remarks change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [savedRemarks.length, showModal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !newRemark.trim()) return;
    setIsSubmitting(true);
    try {
      await onAddRemark(newRemark.trim(), newStatus);
      setNewRemark('');
      const updatedAllowedStatuses = getAllowedStatuses(newStatus);
      setNewStatus(updatedAllowedStatuses[0] || 'Scheduled');
    } catch (error) {
      console.error('Failed to add remark:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!showModal || !task) return null;

  const sorted = [...savedRemarks].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-[60]" onClick={onClose} />

      {/* Floating chat panel — bottom-right, mimics AI chatbot */}
      <div className="fixed bottom-6 right-6 z-[70] w-[420px] max-w-[calc(100vw-2rem)] flex flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden"
        style={{ maxHeight: 'calc(100vh - 3rem)' }}
      >
        {/* ─── Header ─── */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <MessageSquare className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold truncate">Remarks · {task.taskID}</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] opacity-80">Status:</span>
                <span className={`inline-flex px-1.5 py-[1px] rounded text-[10px] font-medium ${remarkStatusColor(currentStatus)}`}>
                  {currentStatus}
                </span>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-white hover:bg-white/20 rounded-full shrink-0"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* ─── Messages area ─── */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-slate-50/70 min-h-[220px] max-h-[420px]">
          {sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 py-10">
              <MessageSquare className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-xs">No remarks yet. Start the conversation below.</p>
            </div>
          ) : (
            sorted.map((remark, index) => {
              const isLatest = index === sorted.length - 1;
              return (
                <div key={remark.id ?? index} className="group">
                  {/* Chat bubble */}
                  <div className="relative bg-white rounded-xl px-3.5 py-2.5 shadow-sm border border-slate-100 hover:shadow transition-shadow">
                    {/* Status + edit */}
                    <div className="flex items-center justify-between mb-1">
                      <Badge className={`text-[10px] px-1.5 py-0 h-[18px] border font-medium ${remarkStatusColor(remark.status)}`}>
                        {remark.status}
                      </Badge>
                      {isLatest && (
                        <button
                          onClick={() => onEditLatestRemark(remark)}
                          className="text-[10px] text-blue-600 hover:text-blue-800 font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Edit
                        </button>
                      )}
                    </div>

                    {/* Remark text */}
                    <p className="text-[13px] text-slate-800 leading-relaxed">{remark.remark}</p>

                    {/* Meta */}
                    <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-400">
                      <span className="font-medium">{remark.createdBy}</span>
                      <span>{new Date(remark.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ─── Input area ─── */}
        <form onSubmit={handleSubmit} className="shrink-0 border-t border-slate-200 bg-white px-3 py-3 space-y-2">
          {/* Status selector */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider shrink-0">Status</span>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="flex-1 text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
            >
              {allowedStatuses.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Text + send */}
          <div className="flex items-end gap-2">
            <textarea
              value={newRemark}
              onChange={(e) => setNewRemark(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Type a remark..."
              rows={1}
              className="flex-1 resize-none border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 bg-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 max-h-24 overflow-y-auto"
              required
            />
            <Button
              type="submit"
              disabled={isSubmitting || !newRemark.trim()}
              size="sm"
              className="h-9 w-9 p-0 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 shrink-0"
            >
              {isSubmitting ? (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <Send className="h-4 w-4 text-white" />
              )}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
};


// Main TasksPage Component
export default function TasksPage() {
  const { toast } = useToast();
  const [purchaseFile, setPurchaseFile] = useState<File | null>(null);
  const [savedPurchaseAttachments, setSavedPurchaseAttachments] = useState<any[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [addressBooks, setAddressBooks] = useState<AddressBook[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [serviceWorkscopeCategories, setServiceWorkscopeCategories] = useState<ServiceWorkscopeCategory[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showRemarksModal, setShowRemarksModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);


  const [error, setError] = useState<string | null>(null);
  const [inventories, setInventories] = useState<any[]>([]);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [productTypes, setProductTypes] = useState<any[]>([]);
  const [currentUserName, setCurrentUserName] = useState<string>('User');



  type CrudPerm = {
    read: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
  };

  type PermissionsJson = Record<string, CrudPerm>;

  const [userId, setUserId] = useState<number | null>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<PermissionsJson | null>(null);
  const [loggedUser, setLoggedUser] = useState<any>(null);
  const [userDepartmentId, setUserDepartmentId] = useState<number | null>(null);


  const taskPermissions: CrudPerm = {
    read: permissions?.TASKS?.read ?? false,
    create: permissions?.TASKS?.create ?? false,
    edit: permissions?.TASKS?.edit ?? false,
    delete: permissions?.TASKS?.delete ?? false,
  };



  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    const storedUserType = localStorage.getItem("userType");

    if (storedUserId) setUserId(Number(storedUserId));
    if (storedUserType) setUserType(storedUserType);
  }, []);

  const HOURS_24 = 24 * 60 * 60 * 1000;

  const isTaskOpen = (task: Task) =>
    task.status?.toLowerCase() === "open";

  const isTaskOlderThan24Hours = (task: Task) => {
    if (!task.createdAt) return false;

    const createdTime = new Date(task.createdAt).getTime();
    const now = Date.now();

    return now - createdTime > HOURS_24;
  };

  const hasTaskBeenAttempted = (task: Task) => {
    return task.remarks && task.remarks.length > 0;
  };


  const addPurchaseProductRow = () => {
    setFormData(prev => ({
      ...prev,
      purchase: {
        ...(prev.purchase || { purchaseType: "INQUIRY", products: [] }),
        products: [
          ...(prev.purchase?.products || []),
          {
            make: "",
            model: "",
            description: "",
            warranty: "",
            rate: "",
            vendor: "",
            validity: "",
            availability: "",
          },
        ],
      },
    }));
  };

  const removePurchaseProductRow = (index: number) => {
    setFormData(prev => ({
      ...prev,
      purchase: {
        ...(prev.purchase || { purchaseType: "INQUIRY", products: [] }),
        products: (prev.purchase?.products || []).filter((_, i) => i !== index),
      },
    }));
  };

  const updatePurchaseProductRow = (
    index: number,
    field: keyof TaskPurchaseProduct,
    value: any
  ) => {
    setFormData(prev => ({
      ...prev,
      purchase: {
        ...(prev.purchase || { purchaseType: "INQUIRY", products: [] }),
        products: (prev.purchase?.products || []).map((p, i) =>
          i === index ? { ...p, [field]: value } : p
        ),
      },
    }));
  };

  useEffect(() => {
    (window as any).__addPurchaseProductRow = addPurchaseProductRow;
    (window as any).__updatePurchaseProductRow = updatePurchaseProductRow;
    (window as any).__removePurchaseProductRow = removePurchaseProductRow;

    return () => {
      delete (window as any).__addPurchaseProductRow;
      delete (window as any).__updatePurchaseProductRow;
      delete (window as any).__removePurchaseProductRow;
    };
  }, [addPurchaseProductRow, updatePurchaseProductRow, removePurchaseProductRow]);

  const fetchProductTypes = async () => {
    try {
      const res = await fetch("http://localhost:8000/products");
      const data = await res.json();
      setProductTypes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load product types:", err);
      setProductTypes([]);
    }
  };

  const removeInventory = (index: number) => {
    setInventories(prev => prev.filter((_, i) => i !== index));
  };

  const normalizeStatus = (status?: string) => {
    if (!status) return "Open";

    const s = status.trim().toLowerCase();

    if (s === "wip" || s.includes("progress")) return "Work in Progress";
    if (s === "on-hold" || s === "on hold") return "On-Hold";
    if (s === "re-open" || s === "reopen") return "Reopen";

    return s.replace(/\b\w/g, c => c.toUpperCase());
  };


  // 🔥 Fixed Allowed status transitions
  const getAllowedStatuses = (currentStatusRaw: string) => {
    const currentStatus = normalizeStatus(currentStatusRaw);

    switch (currentStatus) {
      case "Open":
        return ["Scheduled"];

      case "Scheduled":
        return ["Work in Progress", "Rescheduled", "On-Hold"];

      case "Work in Progress":
        return ["On-Hold", "Completed"];

      case "Rescheduled":
        return ["Work in Progress", "On-Hold"];

      case "On-Hold":
        return ["Rescheduled"];

      case "Completed":
        return ["Reopen"];

      case "Reopen":
        return ["Rescheduled"];

      default:
        return [];
    }
  };

  // 🔍 Search & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;



  const visibleTasks = tasks.filter(task => {
    // SUPERADMIN sees everything
    if (userType === "SUPERADMIN") return true;

    // wait until user context is ready
    if (!userId || userDepartmentId === null) return false;

    // HYBRID VISIBILITY RULE
    return (
      task.userId === userId ||
      task.departmentId === userDepartmentId
    );
  });








  const filteredTasks = visibleTasks.filter((task) => {
    const term = searchTerm.toLowerCase();
    const departmentName =
      departments.find(d => d.id === task.departmentId)?.departmentName?.toLowerCase() || '';
    const customerName =
      addressBooks.find(a => a.id === task.addressBookId)?.customerName?.toLowerCase() || '';
    const siteName =
      sites.find(s => s.id === task.siteId)?.siteName?.toLowerCase() || '';

    return (
      task.taskID.toLowerCase().includes(term) ||
      departmentName.includes(term) ||
      customerName.includes(term) ||
      siteName.includes(term) ||
      task.status.toLowerCase().includes(term)
    );
  });

  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const aOpen = isTaskOpen(a);
    const bOpen = isTaskOpen(b);

    // Open tasks always first
    if (aOpen && !bOpen) return -1;
    if (!aOpen && bOpen) return 1;

    // If both same status, newest first
    return (
      new Date(b.createdAt).getTime() -
      new Date(a.createdAt).getTime()
    );
  });

  const paginatedTasks = sortedTasks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    if (!userId) return;

    setFormData(prev => ({
      ...prev,
      userId,
    }));
  }, [userId]);


  // Form state - Initialize with empty arrays
  const [formData, setFormData] = useState<TaskFormData>({
    taskID: "",
    userId: userId ?? null,
    departmentId: departments.length > 0 ? departments[0].id : null,
    addressBookId: null,
    siteId: null,
    status: 'Open',
    createdBy: currentUserName,
    createdAt: new Date().toISOString(),
    description: '',
    title: '',
    contacts: [], // Start with empty array
    workscopeDetails: [], // Start with empty array
    schedule: [], // Start with empty array
    remarks: [], // Start with empty array
    taskType: "SERVICE",
    purchase: {
      purchaseType: "INQUIRY",
      customerName: "",
      address: "",
      products: [],
    },

  });


  useEffect(() => {
    if (departments.length === 0) return;

    setFormData(prev => ({
      ...prev,
      departmentId: prev.departmentId ?? departments[0].id,
    }));
  }, [departments]);


  // Calculate department flags BEFORE all components that use them
  const selectedDepartmentName =
    departments.find(d => d.id === formData.departmentId)?.departmentName
      ?.trim()
      ?.toLowerCase() || "";

  const isPurchaseDepartment = selectedDepartmentName === "purchase";
  const isTechnicalDepartment = selectedDepartmentName === "technical";
  const isBillingDepartment = selectedDepartmentName === "billing";
  const isHRAdminDepartment =
    selectedDepartmentName === "hr" ||
    selectedDepartmentName === "hr&admin" ||
    selectedDepartmentName === "hradmin";
  const isSalesDepartment = selectedDepartmentName === "sales";


  // Search and dropdown states
  const [departmentSearch, setDepartmentSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [workscopeCategorySearch, setWorkscopeCategorySearch] = useState('');
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showWorkscopeDropdown, setShowWorkscopeDropdown] = useState(false);

  // Saved items state
  const [savedContacts, setSavedContacts] = useState<TasksContacts[]>([]);
  const [savedWorkscopeDetails, setSavedWorkscopeDetails] = useState<TasksWorkscopeDetails[]>([]);
  const [savedSchedule, setSavedSchedule] = useState<TasksSchedule[]>([]);
  const [savedRemarks, setSavedRemarks] = useState<TasksRemarks[]>([]);

  // Editing states
  const [editingSavedContact, setEditingSavedContact] = useState<number | null>(null);
  const [editingSavedWorkscope, setEditingSavedWorkscope] = useState<number | null>(null);
  const [editingSavedSchedule, setEditingSavedSchedule] = useState<number | null>(null);

  // Remark editing states
  const [showEditRemarkModal, setShowEditRemarkModal] = useState(false);
  const [remarkToEdit, setRemarkToEdit] = useState<TasksRemarks | null>(null);
  const [editRemarkText, setEditRemarkText] = useState("");
  const [editRemarkStatus, setEditRemarkStatus] = useState("");
  const [taskForRemarkEdit, setTaskForRemarkEdit] = useState<Task | null>(null);

  // Filtered data
  const filteredDepartments = departments.filter(dept =>
    dept.departmentName.toLowerCase().includes(departmentSearch.toLowerCase())
  );

  const filteredCustomers = addressBooks.filter(customer =>
    customer.customerName.toLowerCase().includes(customerSearch.toLowerCase()) ||
    (customer.addressBookID?.toLowerCase() || '').includes(customerSearch.toLowerCase())
  );

  const filteredWorkscopeCategories = serviceWorkscopeCategories.filter(cat =>
    cat.workscopeCategoryName.toLowerCase().includes(workscopeCategorySearch.toLowerCase())
  );

  const filteredSites = sites.filter(site =>
    site.addressBookId === formData.addressBookId
  );

  // ✅ Auto-fill Task Contacts when a site is selected
  useEffect(() => {
    if (!showModal) return;
    if (!formData.siteId || formData.siteId === 0) return;

    // 🚨 DO NOT override if user already saved contacts
    if (savedContacts.length > 0) return;

    const fetchSiteContacts = async () => {
      try {
        const res = await fetch(`http://localhost:8000/sites/${formData.siteId}`);
        const data = await res.json();

        const converted =
          (data?.contacts || []).map((c: any) => ({
            taskId: 0,
            contactName: c.contactPerson || "",
            contactNumber: c.contactNumber || "",
            contactEmail: c.emailAddress || "",
          }));

        if (converted.length > 0) {
          setFormData(prev => ({
            ...prev,
            contacts: converted
          }));
        }
      } catch (err) {
        console.error("Auto-fill site contacts failed:", err);
      }
    };

    fetchSiteContacts();
  }, [showModal, formData.siteId, savedContacts.length]);

  const fetchUserPermissions = async (uid: number) => {
    try {
      // SUPERADMIN bypass: grant all permissions
      const storedUserType = localStorage.getItem("userType");
      if (storedUserType === "SUPERADMIN") {
        const allPerms = { read: true, create: true, edit: true, delete: true };
        setPermissions({
          CUSTOMERS: allPerms, SITES: allPerms, VENDORS: allPerms,
          CUSTOMER_REGISTRATION: allPerms, CATEGORIES: allPerms, SUBCATEGORIES: allPerms,
          PRODUCTS_SKU: allPerms, INVENTORY: allPerms, PURCHASE_INVOICE: allPerms,
          MATERIAL_OUTWARD: allPerms, VENDORS_PAYMENTS: allPerms, TASKS: allPerms,
          SERVICE_CONTRACTS: allPerms, DEPARTMENTS: allPerms, SERVICE_CATEGORY: allPerms,
          WORKSCOPE_CATEGORY: allPerms, USERS: allPerms, DASHBOARD: allPerms,
        });
        return;
      }

      const token =
        localStorage.getItem("access_token") ||
        localStorage.getItem("token");

      const res = await fetch(
        `http://localhost:8000/user-permissions/${uid}`,
        {
          headers: token
            ? { Authorization: `Bearer ${token}` }
            : {},
        }
      );

      if (!res.ok) throw new Error("Permission fetch failed");

      const rawText = await res.text();
      if (!rawText) { setPermissions({}); return; }
      const data = JSON.parse(rawText);

      let perms = null;

      if (data?.permissions?.permissions) {
        perms = data.permissions.permissions;
      } else if (data?.permissions) {
        perms = data.permissions;
      } else {
        perms = data;
      }

      setPermissions(perms);
      localStorage.setItem("userPermissions", JSON.stringify(perms));
    } catch (err) {
      console.error(err);
      const stored = localStorage.getItem("userPermissions");
      if (stored) {
        setPermissions(JSON.parse(stored));
      } else {
        setPermissions({});
      }
    }
  };


  // Fetch data
  useEffect(() => {
    fetchTasks();
    fetchDepartments();
    fetchEngineers();
    fetchAddressBooks();
    fetchSites();
    fetchNextTaskId();
    fetchServiceWorkscopeCategories();
    fetchProductTypes();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchUserPermissions(userId);
      fetchLoggedUser(userId);
    }
  }, [userId]);

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    const storedUserType = localStorage.getItem("userType");
    const storedUserName = localStorage.getItem("username");

    if (storedUserId) setUserId(Number(storedUserId));
    if (storedUserType) setUserType(storedUserType);
    if (storedUserName) setCurrentUserName(storedUserName);
  }, []);


  const fetchDepartments = async () => {
    try {
      const response = await fetch('http://localhost:8000/department');
      const data = await response.json();
      setDepartments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching departments:', error);
      setDepartments([]);
    }
  };

  const fetchEngineers = async () => {
    try {
      const response = await fetch('http://localhost:8000/engineer');
      const data = await response.json();
      setEngineers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching engineers:', error);
      setEngineers([]);
    }
  };

  useEffect(() => {
    if (!loggedUser?.department) return;
    if (departments.length === 0) return;

    const dept = departments.find(
      d =>
        d.departmentName.trim().toLowerCase() ===
        loggedUser.department.trim().toLowerCase()
    );

    setUserDepartmentId(dept?.id ?? null);
  }, [loggedUser, departments]);


  const fetchAddressBooks = async () => {
    try {
      const response = await fetch('http://localhost:8000/address-book');
      const data = await response.json();
      setAddressBooks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching address books:', error);
      setAddressBooks([]);
    }
  };

  const fetchSites = async () => {
    try {
      const response = await fetch('http://localhost:8000/sites');
      const data = await response.json();
      setSites(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching sites:', error);
      setSites([]);
    }
  };

  const fetchServiceWorkscopeCategories = async () => {
    try {
      const response = await fetch('http://localhost:8000/workscope-category');
      if (!response.ok) {
        throw new Error('Failed to fetch service workscope categories');
      }
      const data = await response.json();
      setServiceWorkscopeCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching service workscope categories:', error);
      setServiceWorkscopeCategories([]);
    }
  };

  const fetchLoggedUser = async (uid: number) => {
    const token = getAuthToken();

    try {
      const res = await fetch("http://localhost:8000/auth/users", {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const users = await res.json();
      const me = users.find((u: any) => u.id === uid);

      if (me) {
        setLoggedUser(me);
        // Store the user's actual name for later use
        const username = me.name || me.username || me.email || 'User';
        localStorage.setItem("username", username);
      }
    } catch (err) {
      console.error("Failed to fetch user details:", err);
      setLoggedUser(null);
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/task');
      const data = await response.json();

      // Only sort if needed
      const tasksWithSortedRemarks = Array.isArray(data)
        ? data.map((task: Task) => ({
          ...task,
          // Only sort when actually needed
          remarks: task.remarks
            ? [...task.remarks].sort((a, b) => (b.id || 0) - (a.id || 0))
            : []
        }))
        : [];

      setTasks(tasksWithSortedRemarks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchNextTaskId = async () => {
    try {
      const res = await fetch(`http://localhost:8000/task/next-id`);
      const data = await res.json();
      return data.taskId;
    } catch (err) {
      console.error('Error fetching next task ID:', err);
      return 'TASK/001';
    }
  };

  // Modal handlers
  const handleOpenModal = async () => {
    const nextTaskId = await fetchNextTaskId();
    const actualUserName = localStorage.getItem("username") || currentUserName || "User";
    setFormData({
      taskID: nextTaskId,
      userId: userId || 0,
      departmentId: departments.length > 0 ? departments[0].id : 0,
      addressBookId: 0,
      siteId: null,
      engineerId: null,
      status: 'Open',
      createdBy: actualUserName, // Use actual user name
      createdAt: new Date().toISOString(),
      description: '',
      title: '',
      // Start with empty arrays - fields will open when "Add" is clicked
      contacts: [],
      workscopeDetails: [],
      schedule: [
        {
          taskId: 0,
          proposedDateTime: "",
          priority: "Medium",
        }
      ],
      // Start with one empty remark for adding new remarks
      remarks: [{
        taskId: 0,
        remark: '',
        status: 'Open',
        createdBy: actualUserName, // Use actual user name
        createdAt: new Date().toISOString()
      }],
      taskType: "SERVICE",
      purchase: {
        purchaseType: "INQUIRY",
        customerName: "",
        address: "",
        products: [],
      },

    });
    setSavedContacts([]);
    setSavedWorkscopeDetails([]);
    setSavedSchedule([]);
    setSavedRemarks([]);

    setInventories([]);
    setEditingId(null);
    setShowModal(true);
    setPurchaseFile(null);
    setSavedPurchaseAttachments([]);
    setCustomerSearch("");
    setShowCustomerDropdown(false);


  };



  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      taskID: '',
      userId: userId || 0,
      departmentId: departments.length > 0 ? departments[0].id : 0,
      addressBookId: 0,
      siteId: null,
      engineerId: null,
      status: 'Open',
      createdBy: currentUserName,
      createdAt: new Date().toISOString(),
      description: '',
      title: '',
      contacts: [],
      workscopeDetails: [],
      schedule: [
        {
          taskId: 0,
          proposedDateTime: "",
          priority: "Medium",
        }
      ],
      remarks: [],
      taskType: "SERVICE",
      purchase: {
        purchaseType: "INQUIRY",
        customerName: "",
        address: "",
        products: [],
      },

    });

    setSavedRemarks([]);
    setInventories([]);
    setPurchaseFile(null);
    setCustomerSearch("");
    setShowCustomerDropdown(false);

  };

  const handleOpenRemarksModal = (task: Task) => {
    setSelectedTask(task);

    if (task.remarks && task.remarks.length > 0) {
      const sortedRemarks = [...task.remarks].sort((a, b) => (b.id || 0) - (a.id || 0));
      setSavedRemarks(sortedRemarks);
    } else {
      setSavedRemarks([]);
    }

    setShowRemarksModal(true);
  };

  const handleCloseRemarksModal = () => {
    setShowRemarksModal(false);
    setSelectedTask(null);
    setSavedRemarks([]);
  };


  // 🔥 FORCE SYNC formData → saved arrays (CREATE FIX)
  const finalContacts =
    savedContacts.length > 0
      ? savedContacts
      : formData.contacts.filter(c => c.contactName && c.contactNumber);

  const finalWorkscope =
    savedWorkscopeDetails.length > 0
      ? savedWorkscopeDetails
      : formData.workscopeDetails.filter(w => w.workscopeDetails && w.workscopeCategoryId);

  const finalSchedule =
    savedSchedule.length > 0
      ? savedSchedule
      : formData.schedule.filter(s => s.proposedDateTime);


  // Form submission - FIXED TO INCLUDE REMARKS
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 🔥 AUTO-SAVE SCHEDULE IF FILLED
    if (
      formData.schedule?.[0]?.proposedDateTime &&
      formData.schedule?.[0]?.priority &&
      savedSchedule.length === 0
    ) {
      setSavedSchedule([{
        ...formData.schedule[0],
        id: Date.now()
      }]);
    }


    try {
      // Get the actual user name from localStorage or state
      const actualUserName = localStorage.getItem("username") || currentUserName || "User";

      // Determine task status from saved remarks
      let taskStatus = 'Open';
      let remarksToSave: any[] = [];

      // First check saved remarks
      if (savedRemarks.length > 0) {
        const sortedRemarks = [...savedRemarks].sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        taskStatus = sortedRemarks[0]?.status || 'Open';
        remarksToSave = sortedRemarks.map(r => ({
          remark: r.remark,
          status: r.status,
          createdBy: r.createdBy || actualUserName, // Use actual user name
          createdAt: r.createdAt || new Date().toISOString(),
          description: r.description || "",
        }));
      }
      // Then check if there's a new remark in the form (for Add Task)
      else if (formData.remarks && formData.remarks.length > 0 && formData.remarks[0].remark) {
        const newRemark = {
          remark: formData.remarks[0].remark,
          status: 'Open', // Always "Open" for new tasks
          createdBy: actualUserName, // Use actual user name
          createdAt: new Date().toISOString(),
          description: ""
        };
        remarksToSave = [newRemark];
        taskStatus = 'Open';
      }

      const taskData: any = {
        id: editingId || undefined,
        userId,
        taskID: formData.taskID,
        departmentId: formData.departmentId,
        engineerId: formData.engineerId || undefined,
        status: taskStatus,
        createdBy: actualUserName,
        createdAt: formData.createdAt,
        description: formData.description,
        title: formData.title,
        // ✅ FIX: send BOTH saved items + whatever user typed but didn’t click “Save”
        contacts: (() => {
          const fromSaved = (savedContacts || []).map((c: any) => ({
            contactName: (c.contactName || "").trim(),
            contactNumber: (c.contactNumber || "").trim(),
            contactEmail: (c.contactEmail || "").trim(),
          }));

          const fromForm = (formData.contacts || [])
            .map((c: any) => ({
              contactName: (c.contactName || "").trim(),
              contactNumber: (c.contactNumber || "").trim(),
              contactEmail: (c.contactEmail || "").trim(),
            }))
            .filter(c => c.contactName || c.contactNumber || c.contactEmail);

          // keep only valid ones (at least name + number)
          const combined = [...fromSaved, ...fromForm].filter(c => c.contactName && c.contactNumber);

          // de-dupe by name+number
          const uniq = Array.from(
            new Map(combined.map(c => [`${c.contactName}|${c.contactNumber}`, c])).values()
          );

          return uniq.length ? uniq : undefined;
        })(),

        workscopeDetails: (() => {
          const fromSaved = (savedWorkscopeDetails || []).map((w: any) => ({
            workscopeCategoryId: Number(w.workscopeCategoryId),
            workscopeDetails: (w.workscopeDetails || "").trim(),
            extraNote: (w.extraNote || "").trim(),
          }));

          const fromForm = (formData.workscopeDetails || []).map((w: any) => ({
            workscopeCategoryId: Number(w.workscopeCategoryId),
            workscopeDetails: (w.workscopeDetails || "").trim(),
            extraNote: (w.extraNote || "").trim(),
          }));

          const combined = [...fromSaved, ...fromForm].filter(
            w => w.workscopeCategoryId > 0 && w.workscopeDetails
          );

          // de-dupe by category+details
          const uniq = Array.from(
            new Map(combined.map(w => [`${w.workscopeCategoryId}|${w.workscopeDetails}`, w])).values()
          );

          return uniq.length ? uniq : undefined;
        })(),

        schedule: (() => {
          const fromSaved = (savedSchedule || []).map((s: any) => ({
            proposedDateTime: s.proposedDateTime,
            priority: s.priority,
          }));

          const fromForm = (formData.schedule || []).map((s: any) => ({
            proposedDateTime: s.proposedDateTime,
            priority: s.priority || "Medium",
          }));

          const combined = [...fromSaved, ...fromForm].filter(s => s.proposedDateTime);

          // de-dupe by datetime+priority
          const uniq = Array.from(
            new Map(combined.map(s => [`${s.proposedDateTime}|${s.priority}`, s])).values()
          );

          return uniq.length ? uniq : undefined;
        })(),

        remarks: remarksToSave.length > 0 ? remarksToSave : undefined,
        taskType: isPurchaseDepartment
          ? ((formData.purchase?.purchaseType || "INQUIRY") === "INQUIRY"
            ? "PRODUCT_INQUIRY"
            : "PURCHASE_ORDER")
          : "SERVICE",
        taskInventories: inventories.length
          ? inventories.map(inv => ({
            serviceContractId: 0,
            productTypeId: Number(inv.productTypeId),
            makeModel: inv.makeModel,
            snMac: inv.snMac,
            description: inv.description,
            purchaseDate: inv.purchaseDate,
            warrantyPeriod: inv.warrantyPeriod,
            thirdPartyPurchase: inv.thirdPartyPurchase,
            warrantyStatus: inv.warrantyStatus
              ? String(inv.warrantyStatus).trim()
              : "Active",
          }))
          : undefined,
      };

      const addressBookIdNum = Number(formData.addressBookId);
      if (Number.isInteger(addressBookIdNum) && addressBookIdNum > 0) {
        taskData.addressBookId = addressBookIdNum;
      }

      const siteIdNum = Number(formData.siteId);
      if (Number.isInteger(siteIdNum) && siteIdNum > 0) {
        taskData.siteId = siteIdNum;
      }

      /* ---------------------------------------------------
         🔥 PURCHASE PAYLOAD — ADD CONDITIONALLY (CRITICAL)
      --------------------------------------------------- */
      const hasProducts =
        Array.isArray(formData.purchase?.products) &&
        formData.purchase.products.length > 0;

      const hasPurchaseMetaChanges =
        !!formData.purchase?.customerName ||
        !!formData.purchase?.address ||
        !!formData.purchase?.purchaseType;

      // ✅ PURCHASE dept (keep as-is)
      if (isPurchaseDepartment && formData.purchase?.purchaseType) {
        const purchaseType = formData.purchase.purchaseType as "INQUIRY" | "ORDER";

        taskData.purchase = {
          purchaseType,
          customerName: formData.purchase.customerName || "",
          address: formData.purchase.address || "",
          products: formData.purchase.products || [],
        };
      }

      // ✅ SALES dept (NO UI for products/task type, but still save into purchase{})
      if (isSalesDepartment) {
        taskData.taskType = "PRODUCT_INQUIRY";
        taskData.purchase = {
          purchaseType: "INQUIRY",
          customerName: formData.purchase?.customerName || "",
          address: formData.purchase?.address || "",
        };
      }

      const url = editingId
        ? `http://localhost:8000/task/${editingId}`
        : `http://localhost:8000/task`;

      const method = editingId ? "PATCH" : "POST";
      const token = getAuthToken();

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save task: ${errorText}`);
      }

      const savedTask = await response.json();

      // 🔥 Upload attachment if present
      if (purchaseFile && savedTask?.id) {
        const attachmentFormData = new FormData();
        attachmentFormData.append("file", purchaseFile);

        await fetch(
          `http://localhost:8000/task/${savedTask.id}/purchase-attachment`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: attachmentFormData,
          }
        );
      }

      // ✅ Auto-close modal after successful save
      handleCloseModal();

      // ✅ Show success toast
      toast({ title: editingId ? "Task updated" : "Task created", description: editingId ? "Task updated successfully!" : "Task created successfully!", variant: "success" });

      // ✅ Reset file and refresh tasks
      setPurchaseFile(null);
      await fetchTasks();

      // ✅ Reset loading state
      setLoading(false);

    } catch (err) {
      console.error("Save error:", err);
      setError(err instanceof Error ? err.message : "Failed to save task");
      setLoading(false);
    }
  };

  const handleAddRemarkInModal = async (remark: string, status: string) => {
    if (!selectedTask) return;

    try {
      const token = getAuthToken();
      const actualUserName = localStorage.getItem("username") || currentUserName || "User";

      // Create temporary remark for optimistic update
      const tempRemark = {
        id: Date.now(), // Temporary ID
        taskId: selectedTask.id!,
        remark,
        status,
        createdBy: actualUserName,
        createdAt: new Date().toISOString(),
        description: ""
      };

      // Update UI immediately - add to beginning and sort properly
      const updatedRemarks = [tempRemark, ...savedRemarks].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setSavedRemarks(updatedRemarks);

      // Update the task in local state
      if (selectedTask) {
        const updatedTask = {
          ...selectedTask,
          status,
          remarks: updatedRemarks
        };
        setSelectedTask(updatedTask);
      }

      // Update tasks list optimistically
      setTasks(prev => prev.map(task =>
        task.id === selectedTask.id
          ? { ...task, status, remarks: updatedRemarks }
          : task
      ));

      // Make API call
      const response = await fetch(`http://localhost:8000/tasks-remarks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          taskId: selectedTask.id,
          remark,
          status,
          createdBy: actualUserName,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add remark");
      }

      const newRemark = await response.json();

      // Replace temporary remark with actual one and sort properly
      const finalUpdatedRemarks = [newRemark, ...savedRemarks.filter(r => r.id !== tempRemark.id)]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setSavedRemarks(finalUpdatedRemarks);

      // Update with real data
      setTasks(prev => prev.map(task =>
        task.id === selectedTask.id
          ? {
            ...task,
            status,
            remarks: finalUpdatedRemarks
          }
          : task
      ));

      // Clear the input fields for next remark
      // This will be handled in the RemarksModal component

    } catch (err) {
      console.error(err);
      setError("Failed to add remark");

      // Revert optimistic update on error
      setSavedRemarks(savedRemarks);
      setTasks(prev => prev.map(task =>
        task.id === selectedTask.id
          ? { ...task, status: selectedTask.status, remarks: savedRemarks }
          : task
      ));
    }
  };


  const handleRemoveRemarkInModal = async (id: number) => {
    try {
      const updatedRemarks = savedRemarks.filter(remark => remark.id !== id);
      setSavedRemarks(updatedRemarks);

      if (selectedTask) {
        let newStatus = 'Open';
        if (updatedRemarks.length > 0) {
          const sortedRemarks = [...updatedRemarks].sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          newStatus = sortedRemarks[0]?.status || 'Open';
        }

        const updatedTask = {
          id: selectedTask.id,
          taskID: selectedTask.taskID,
          departmentId: selectedTask.departmentId,
          addressBookId: selectedTask.addressBookId,
          siteId: selectedTask.siteId,
          status: newStatus,
          createdBy: selectedTask.createdBy,
          createdAt: selectedTask.createdAt,
          description: selectedTask.description || '',
          title: selectedTask.title || '',
          contacts: (selectedTask.contacts || []).map(c => ({
            contactName: c.contactName,
            contactNumber: c.contactNumber,
            contactEmail: c.contactEmail
          })),
          workscopeDetails: (selectedTask.workscopeDetails || []).map(w => ({
            workscopeCategoryId: w.workscopeCategoryId,
            workscopeDetails: w.workscopeDetails,
            extraNote: w.extraNote || ""
          })),
          schedule: (selectedTask.schedule || []).map(s => ({
            proposedDateTime: s.proposedDateTime,
            priority: s.priority
          })),
          remarks: updatedRemarks.map(r => ({
            remark: r.remark,
            status: r.status,
            createdBy: r.createdBy,
            createdAt: r.createdAt,
            description: r.description || ""
          }))
        };


        const token = getAuthToken();

        const response = await fetch(`http://localhost:8000/task/${selectedTask.id}`, {
          method: 'PATCH',
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updatedTask),
        });


        if (!response.ok) {
          setSavedRemarks(savedRemarks);
          throw new Error('Failed to remove remark');
        }

        setSelectedTask(prev => prev ? { ...prev, status: newStatus, remarks: updatedRemarks } : null);
      }

      await fetchTasks();
      toast({ title: "Remark removed", variant: "success" });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove remark');
    }
  };

  const handleDeleteTask = async (id: number) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    const token = getAuthToken();

    try {

      const response = await fetch(`http://localhost:8000/task/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete task');

      await fetchTasks();
      toast({ title: "Task deleted", variant: "success" });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task');
    }
  };

  // Contact handlers
  const handleAddContact = () => {
    setFormData(prev => ({
      ...prev,
      contacts: [...prev.contacts, { taskId: 0, contactName: '', contactNumber: '', contactEmail: '' }]
    }));
  };

  const handleRemoveContact = (index: number) => {
    setFormData(prev => ({
      ...prev,
      contacts: prev.contacts.filter((_, i) => i !== index)
    }));
  };

  const handleUpdateContact = (index: number, field: keyof TasksContacts, value: string) => {
    setFormData(prev => ({
      ...prev,
      contacts: prev.contacts.map((contact, i) =>
        i === index ? { ...contact, [field]: value } : contact
      )
    }));
  };

  const handleSaveContact = (index: number) => {
    const contact = formData.contacts[index];
    if (contact.contactName && contact.contactNumber) {
      setSavedContacts(prev => [...prev, { ...contact, id: Date.now() }]);
      handleRemoveContact(index);
    }
  };

  const handleRemoveSavedContact = (id: number) => {
    setSavedContacts(prev => prev.filter(contact => contact.id !== id));
  };

  // -----------------------------------------
  // WORKSCOPE SECTION
  // -----------------------------------------

  const handleAddWorkscopeDetail = () => {
    setFormData(prev => ({
      ...prev,
      workscopeDetails: [
        ...prev.workscopeDetails,
        { id: 0, taskId: 0, workscopeCategoryId: 0, workscopeDetails: "", extraNote: "" }
      ]
    }));
  };

  const handleUpdateWorkscopeDetail = (index: number, field: keyof TasksWorkscopeDetails, value: any) => {
    setFormData(prev => ({
      ...prev,
      workscopeDetails: prev.workscopeDetails.map((w, i) =>
        i === index ? { ...w, [field]: value } : w
      )
    }));
  };

  const handleRemoveWorkscopeDetail = (index: number) => {
    setFormData(prev => ({
      ...prev,
      workscopeDetails: prev.workscopeDetails.filter((_, i) => i !== index)
    }));
  };

  const handleSaveWorkscopeDetail = (index: number) => {
    const w = formData.workscopeDetails[index];

    console.log("Saving workscope:", w);

    if (!w.workscopeCategoryId || !w.workscopeDetails.trim()) {
      toast({ title: "Missing fields", description: "Please select a category and enter workscope details", variant: "warning" });
      return;
    }

    const cleaned = {
      id: Date.now(),
      taskId: editingId || 0,
      workscopeCategoryId: Number(w.workscopeCategoryId),
      workscopeDetails: w.workscopeDetails.trim(),
      extraNote: w.extraNote?.trim() || ""
    };

    console.log("Cleaned workscope:", cleaned);

    setSavedWorkscopeDetails(prev => [...prev, cleaned]);

    setFormData(prev => ({
      ...prev,
      workscopeDetails: prev.workscopeDetails.filter((_, i) => i !== index)
    }));
  };

  const handleRemoveSavedWorkscopeDetail = (id: number) => {
    setSavedWorkscopeDetails(prev => prev.filter(w => w.id !== id));
  };

  // Schedule handlers
  const handleAddSchedule = () => {
    setFormData(prev => ({
      ...prev,
      schedule: [...prev.schedule, { taskId: 0, proposedDateTime: '', priority: 'Medium' }]
    }));
  };

  const handleRemoveSchedule = (index: number) => {
    setFormData(prev => ({
      ...prev,
      schedule: prev.schedule.filter((_, i) => i !== index)
    }));
  };

  const handleUpdateSchedule = (index: number, field: keyof TasksSchedule, value: string) => {
    setFormData(prev => ({
      ...prev,
      schedule: prev.schedule.map((schedule, i) =>
        i === index ? { ...schedule, [field]: value } : schedule
      )
    }));
  };

  const handleSaveSchedule = () => {
    const schedule = formData.schedule[0];
    if (schedule.proposedDateTime && schedule.priority) {
      setSavedSchedule(prev => [...prev, { ...schedule, id: Date.now() }]);
      setFormData(prev => ({
        ...prev,
        schedule: [{ taskId: 0, proposedDateTime: '', priority: 'Medium' }]
      }));
    }
  };

  const handleRemoveSavedSchedule = (id: number) => {
    setSavedSchedule(prev => prev.filter(schedule => schedule.id !== id));
  };

  // Remark handlers
  const handleAddRemark = () => {
    const remark = formData.remarks[0];
    if (remark.remark && remark.status) {
      const newRemark = {
        ...remark,
        id: Date.now(),
        createdAt: new Date().toISOString(),
        createdBy: currentUserName
      };

      setSavedRemarks(prev => [...prev, newRemark]);
      setFormData(prev => ({
        ...prev,
        remarks: [{
          taskId: 0,
          remark: '',
          status: 'Open',
          createdBy: currentUserName,
          createdAt: new Date().toISOString()
        }]
      }));

      toast({ title: "Remark saved", description: "Click 'Create Task' to save to database.", variant: "info" });
    }
  };

  const handleRemoveRemark = (index: number) => {
    setFormData(prev => ({
      ...prev,
      remarks: prev.remarks.filter((_, i) => i !== index)
    }));
  };

  const handleUpdateRemark = (index: number, field: keyof TasksRemarks, value: string) => {
    setFormData(prev => ({
      ...prev,
      remarks: prev.remarks.map((remark, i) =>
        i === index ? { ...remark, [field]: value } : remark
      )
    }));
  };

  const handleSaveRemark = (index: number) => {
    const remark = formData.remarks[index];
    if (remark.remark && remark.status) {
      setSavedRemarks(prev => [...prev, { ...remark, id: Date.now() }]);
      handleRemoveRemark(index);
    }
  };

  const handleRemoveSavedRemark = (id: number) => {
    setSavedRemarks(prev => prev.filter(remark => remark.id !== id));
  };

  // Edit handlers for saved items
  const handleStartEditSavedContact = (id: number) => {
    setEditingSavedContact(id);
  };

  const handleSaveEditedContact = (id: number, updatedContact: TasksContacts) => {
    setSavedContacts(prev => prev.map(contact =>
      contact.id === id ? { ...updatedContact, id } : contact
    ));
    setEditingSavedContact(null);
  };

  const handleCancelEditSavedContact = () => {
    setEditingSavedContact(null);
  };

  const handleStartEditSavedWorkscope = (id: number) => {
    setEditingSavedWorkscope(id);
  };

  const handleSaveEditedWorkscope = (id: number, updatedWorkscope: TasksWorkscopeDetails) => {
    setSavedWorkscopeDetails(prev => prev.map(workscope =>
      workscope.id === id ? { ...updatedWorkscope, id } : workscope
    ));
    setEditingSavedWorkscope(null);
  };

  const handleCancelEditSavedWorkscope = () => {
    setEditingSavedWorkscope(null);
  };

  const handleStartEditSavedSchedule = (id: number) => {
    setEditingSavedSchedule(id);
  };

  const handleSaveEditedSchedule = (id: number, updatedSchedule: TasksSchedule) => {
    setSavedSchedule(prev => prev.map(schedule =>
      schedule.id === id ? { ...updatedSchedule, id } : schedule
    ));
    setEditingSavedSchedule(null);
  };

  const handleCancelEditSavedSchedule = () => {
    setEditingSavedSchedule(null);
  };

  // Check if task is closed
  const isTaskClosed = () => {
    return savedRemarks.some(remark => remark.status === 'Closed') ||
      formData.remarks.some(remark => remark.status === 'Closed');
  };

  // In the handleEditTask function, update the inventory loading part:
  const handleEditTask = async (task: Task) => {
    let taskStatus = 'Open';
    if (task.remarks && task.remarks.length > 0) {
      const sortedRemarks = [...task.remarks].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      taskStatus = sortedRemarks[0]?.status || 'Open';
    }

    const actualUserName = localStorage.getItem("username") || currentUserName || "User";


    setFormData({
      taskID: task.taskID,
      userId: task.userId,
      departmentId: task.departmentId,
      addressBookId: task.addressBookId,
      siteId: task.siteId,
      engineerId: task.engineerId || null,
      status: taskStatus,
      createdBy: actualUserName, // Use actual user name
      createdAt: task.createdAt,
      description: task.description || '',
      title: task.title || '',
      // Start with empty arrays for adding new items
      contacts: [],
      workscopeDetails: [],
      schedule: [
        {
          taskId: task.id || 0,
          proposedDateTime: "",
          priority: "Medium",
        }
      ],
      taskType: task.taskType || "SERVICE",
      purchase: task.purchase
        ? {
          purchaseType: task.purchase.purchaseType,
          customerName: task.purchase.customerName || "",
          address: task.purchase.address || "",
          products: (task.purchase.products || []).map((p: any) => ({
            make: p.make || "",
            model: p.model || "",
            description: p.description || "",
            warranty: p.warranty || "",
            rate: p.rate ?? "",
            vendor: p.vendor || "",
            validity: p.validity
              ? new Date(p.validity).toISOString().slice(0, 16)
              : "",
            availability: p.availability || "",
          })),
        }
        : undefined,


      // Start with one empty remark for adding new ones
      remarks: [{
        taskId: 0,
        remark: '',
        status: 'Open',
        createdBy: actualUserName, // Use actual user name
        createdAt: new Date().toISOString()
      }]
    });

    setSavedContacts(task.contacts || []);
    setSavedWorkscopeDetails(
      (task.workscopeDetails || []).map(w => ({
        id: w.id!,
        taskId: w.taskId!,
        workscopeCategoryId: Number(w.workscopeCategoryId),
        workscopeDetails: w.workscopeDetails,
        extraNote: w.extraNote || ""
      }))
    );
    // Always fetch fresh task details (so attachments definitely come)
    try {
      const token = getAuthToken();
      const res = await fetch(`http://localhost:8000/task/${task.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const fullTask = res.ok ? await res.json() : task;

      // attachments may come either at root OR inside purchase (depends on your backend include)
      const attachments =
        fullTask?.taskPurchaseAttachments ||
        fullTask?.purchase?.taskPurchaseAttachments ||
        [];

      setSavedPurchaseAttachments(Array.isArray(attachments) ? attachments : []);
    } catch (e) {
      console.error("Failed to load task details for attachments", e);
      setSavedPurchaseAttachments(task.taskPurchaseAttachments || []);
    }
    setSavedSchedule(task.schedule || []);
    setSavedRemarks(task.remarks || []);

    // Load task inventories if they exist - FIXED: Use actual warrantyStatus from API
    if (task.taskInventories) {
      setInventories(task.taskInventories.map((inv: any) => ({
        productTypeId: inv.productTypeId,
        productName: productTypes.find(pt => pt.id === inv.productTypeId)?.productName || 'Unknown',
        makeModel: inv.makeModel,
        snMac: inv.snMac,
        description: inv.description,
        purchaseDate: inv.purchaseDate,
        warrantyPeriod: inv.warrantyPeriod,
        thirdPartyPurchase: inv.thirdPartyPurchase,
        // FIX: Use the actual warrantyStatus from API, default to "Active" only if null/undefined
        warrantyStatus: inv.warrantyStatus ?? "Active"
      })));
    } else {
      setInventories([]);
    }

    setEditingId(task.id || null);
    setShowModal(true);
  };

  // Remark editing handlers
  const handleOpenEditRemarkModal = (remark: TasksRemarks) => {
    setRemarkToEdit(remark);
    setEditRemarkText(remark.remark);
    setEditRemarkStatus(remark.status);

    if (showRemarksModal && selectedTask) {
      setTaskForRemarkEdit(selectedTask);
    } else if (showModal && editingId) {
      let currentStatus = 'Open';
      if (savedRemarks.length > 0) {
        const sortedRemarks = [...savedRemarks].sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        currentStatus = sortedRemarks[0]?.status || 'Open';
      }

      setTaskForRemarkEdit({
        id: editingId,
        taskID: formData.taskID,
        departmentId: formData.departmentId,
        addressBookId: formData.addressBookId,
        siteId: formData.siteId,
        status: currentStatus,
        createdBy: formData.createdBy,
        createdAt: formData.createdAt,
        description: formData.description,
        title: formData.title,
        contacts: savedContacts,
        workscopeDetails: savedWorkscopeDetails,
        schedule: savedSchedule,
        remarks: savedRemarks
      } as Task);
    }

    setShowEditRemarkModal(true);
  };

  const handleSaveEditedRemark = async () => {
    if (!remarkToEdit) return;

    const token = getAuthToken();

    try {
      const response = await fetch(`http://localhost:8000/tasks-remarks/${remarkToEdit.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          remark: editRemarkText,
          status: editRemarkStatus,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update remark");
      }

      const updated = await response.json();

      const updatedRemarks = savedRemarks.map(r =>
        r.id === updated.id ? updated : r
      );

      setSavedRemarks(updatedRemarks);

      setShowEditRemarkModal(false);
      setRemarkToEdit(null);

      await fetchTasks();
    } catch (err) {
      console.error(err);
      setError("Failed to update remark");
    }
  };

  const handleCloseEditRemarkModal = () => {
    setShowEditRemarkModal(false);
    setRemarkToEdit(null);
    setTaskForRemarkEdit(null);
  };

  // Inventory Modal Component - UPDATED with warrantyStatus field
  // Replace the entire InventoryModalComponent with this updated version:
  const InventoryModalComponent = () => {
    const [form, setForm] = useState({
      productTypeId: "",
      makeModel: "",
      snMac: "",
      description: "",

      purchaseDate: "",
      warrantyPeriod: "",
      warrantyStatus: "",
      thirdPartyPurchase: false
    });

    // Add state to track if we're editing an existing item
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    if (!showInventoryModal) return null;

    // Function to reset the form
    const resetForm = () => {
      setForm({
        productTypeId: "",
        makeModel: "",
        snMac: "",
        description: "",
        purchaseDate: "",
        warrantyPeriod: "",
        warrantyStatus: "Active",
        thirdPartyPurchase: false
      });
      setEditingIndex(null);
    };



    const handleSave = () => {
      if (!form.productTypeId || !form.makeModel || !form.snMac) {
        toast({ title: "Missing fields", description: "Product type, model, SN/MAC are required", variant: "warning" });
        return;
      }

      const selectedProduct = productTypes.find(
        (pt: any) => pt.id === Number(form.productTypeId)
      );

      const newInventoryItem = {
        ...form,
        productTypeId: Number(form.productTypeId),
        productName: selectedProduct?.productName,
        warrantyStatus: form.warrantyStatus,
      };

      if (editingIndex !== null) {
        // Update existing item
        const updatedInventories = [...inventories];
        updatedInventories[editingIndex] = newInventoryItem;
        setInventories(updatedInventories);
      } else {
        // Add new item
        setInventories((prev: any[]) => [...prev, newInventoryItem]);
      }

      setShowInventoryModal(false);
      resetForm();
    };

    const handleDelete = (index: number) => {
      if (confirm('Are you sure you want to remove this inventory item?')) {
        setInventories(prev => prev.filter((_, i) => i !== index));
        if (editingIndex === index) {
          resetForm();
        }
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl text-gray-900 font-semibold">
              {editingIndex !== null ? 'Edit Inventory Item' : 'Add Inventory Item'}
            </h2>
            <button
              onClick={() => {
                setShowInventoryModal(false);
                resetForm();
              }}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="space-y-6">
            {/* First Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.productTypeId}
                  onChange={(e) =>
                    setForm({ ...form, productTypeId: e.target.value })
                  }
                  className="w-full border border-gray-300 text-black rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-50"
                  required
                >
                  <option value="">Select Product Type</option>
                  {productTypes.map((pt: any) => (
                    <option key={pt.id} value={pt.id}>
                      {pt.productName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Make & Model <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.makeModel}
                  onChange={(e) =>
                    setForm({ ...form, makeModel: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  required
                />
              </div>
            </div>

            {/* Second Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SN / MAC <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.snMac}
                  onChange={(e) =>
                    setForm({ ...form, snMac: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Warranty Status
                </label>
                <select
                  value={form.warrantyStatus}
                  onChange={(e) =>
                    setForm({ ...form, warrantyStatus: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                >
                  <option value="">select status</option>
                  <option value="Active">Active</option>
                  <option value="Expired">Expired</option>
                </select>
              </div>
            </div>

            {/* Third Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purchase Date
                </label>
                <input
                  type="date"
                  value={form.purchaseDate}
                  onChange={(e) =>
                    setForm({ ...form, purchaseDate: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Warranty Period
                </label>
                <input
                  value={form.warrantyPeriod}
                  onChange={(e) =>
                    setForm({ ...form, warrantyPeriod: e.target.value })
                  }
                  placeholder="e.g., 1 year, 2 years"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                />
              </div>
            </div>




            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                rows={3}
              />
            </div>

            {/* Checkbox */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="thirdPartyPurchase"
                checked={form.thirdPartyPurchase}
                onChange={(e) =>
                  setForm({ ...form, thirdPartyPurchase: e.target.checked })
                }
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="thirdPartyPurchase" className="text-sm font-medium text-gray-700">
                Third Party Purchase?
              </label>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowInventoryModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
            >
              Add Item
            </Button>
          </div>
        </div>
      </div>
    );
  };

  if (!permissions) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!taskPermissions.read) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-3 text-gray-500">
        <ShieldX className="h-12 w-12" />
        <p className="text-lg font-medium">Access Denied</p>
        <p className="text-sm">You don&apos;t have permission to view Tasks.</p>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-6 sm:px-6 text-black">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Task Management</h1>
          <p className="text-sm text-gray-500 mt-1">Create and manage tasks across departments</p>
        </div>

        <Separator className="mb-6" />

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Actions Bar */}
        <div className="mb-6 flex flex-col md:flex-row justify-between items-center gap-3">
          <Button
            onClick={handleOpenModal}
            disabled={!taskPermissions.create}
            size="sm"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Task
          </Button>

          {/* Search Bar */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9"
            />
          </div>
        </div>




        {/* Tasks Table */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                    <TableHead className="font-semibold text-gray-700">Task ID</TableHead>
                    <TableHead className="font-semibold text-gray-700">Department</TableHead>
                    <TableHead className="font-semibold text-gray-700">Customer</TableHead>
                    <TableHead className="font-semibold text-gray-700">Site</TableHead>
                    <TableHead className="font-semibold text-gray-700">Engineer</TableHead>
                    <TableHead className="font-semibold text-gray-700">Status</TableHead>
                    <TableHead className="font-semibold text-gray-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTasks.map((task: any) => {

                    const isOverdueOpen =
                      isTaskOpen(task) &&
                      isTaskOlderThan24Hours(task) &&
                      !hasTaskBeenAttempted(task);

                    return (
                      <TableRow
                        key={task.id}
                        className={
                          isOverdueOpen
                            ? "bg-red-50 border-l-4 border-red-600"
                            : ""
                        }
                      >
                        <TableCell className="font-medium text-gray-900">
                          {task.taskID}
                          {isOverdueOpen && (
                            <span className="ml-2 text-xs font-semibold text-red-600">
                              ⚠ Open &gt; 24h
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-gray-700">
                          {departments.find(d => d.id === task.departmentId)?.departmentName || 'N/A'}
                        </TableCell>
                        <TableCell className="text-sm text-gray-700">
                          {addressBooks.find(ab => ab.id === task.addressBookId)?.customerName || task.purchase?.customerName || task.customerName || 'N/A'}
                        </TableCell>
                        <TableCell className="text-sm text-gray-700">
                          {sites.find(s => s.id === task.siteId)?.siteName || task.purchase?.address || task.address || 'N/A'}
                        </TableCell>
                        <TableCell className="text-sm text-gray-700">
                          {task.engineerTaskId || (task.engineer ? `${task.engineer.engineerId} - ${task.engineer.firstName} ${task.engineer.lastName}` : 'N/A')}
                        </TableCell>

                        <TableCell>
                          {(() => {
                            if (!task.remarks || task.remarks.length === 0) {
                              return (
                                <Badge variant="secondary">Open</Badge>
                              );
                            }

                            const sortedRemarks = [...task.remarks].sort(
                              (a, b) => (b.id || 0) - (a.id || 0)
                            );

                            const latestRemark = sortedRemarks[0];
                            const status = latestRemark?.status || 'Open';

                            const variantMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
                              'Completed': 'default',
                              'Reopen': 'destructive',
                            };

                            const colorMap: Record<string, string> = {
                              'Completed': 'bg-green-100 text-green-800 hover:bg-green-100',
                              'Work in Progress': 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
                              'On-Hold': 'bg-orange-100 text-orange-800 hover:bg-orange-100',
                              'Rescheduled': 'bg-purple-100 text-purple-800 hover:bg-purple-100',
                              'Scheduled': 'bg-blue-100 text-blue-800 hover:bg-blue-100',
                              'Reopen': 'bg-red-100 text-red-800 hover:bg-red-100',
                            };

                            return (
                              <Badge
                                variant={variantMap[status] || 'secondary'}
                                className={colorMap[status] || ''}
                              >
                                {status}
                              </Badge>
                            );
                          })()}
                        </TableCell>


                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800"
                            >
                              <a
                                href={`/tasks/view/${task.taskID}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800"
                              onClick={() => taskPermissions.edit && handleEditTask(task)}
                              disabled={!taskPermissions.edit}
                              title={taskPermissions.edit ? "Edit Task" : "No permission to edit"}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-green-600 hover:text-green-800"
                              onClick={() => taskPermissions.create && handleOpenRemarksModal(task)}
                              disabled={!taskPermissions.create}
                              title={taskPermissions.create ? "View / Add Remarks" : "No permission to add remarks"}
                            >
                              <MessageSquare className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
                              onClick={() => taskPermissions.delete && handleDeleteTask(task.id!)}
                              disabled={!taskPermissions.delete}
                              title={taskPermissions.delete ? "Delete Task" : "No permission to delete"}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {tasks.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                        No tasks found. Create your first task!
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              {/* Pagination Controls */}
              <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200 bg-gray-50/50">
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages || 1}
                </span>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages || totalPages === 0}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Task Modal */}
        <TaskModal
          loading={loading}
          purchaseFile={purchaseFile}
          setPurchaseFile={setPurchaseFile}
          savedPurchaseAttachments={savedPurchaseAttachments}
          isPurchaseDepartment={isPurchaseDepartment}
          isBillingDepartment={isBillingDepartment}
          isSalesDepartment={isSalesDepartment}
          isHRAdminDepartment={isHRAdminDepartment}
          isTechnicalDepartment={isTechnicalDepartment}
          showModal={showModal}
          editingId={editingId}
          formData={formData}
          departments={departments}
          engineers={engineers}
          addressBooks={addressBooks}
          sites={sites}
          serviceWorkscopeCategories={serviceWorkscopeCategories}
          departmentSearch={departmentSearch}
          customerSearch={customerSearch}
          workscopeCategorySearch={workscopeCategorySearch}
          showDepartmentDropdown={showDepartmentDropdown}
          showCustomerDropdown={showCustomerDropdown}
          showWorkscopeDropdown={showWorkscopeDropdown}
          filteredDepartments={filteredDepartments}
          filteredCustomers={filteredCustomers}
          filteredWorkscopeCategories={filteredWorkscopeCategories}
          filteredSites={filteredSites}
          savedContacts={savedContacts}
          savedWorkscopeDetails={savedWorkscopeDetails}
          savedSchedule={savedSchedule}
          savedRemarks={savedRemarks}
          editingSavedContact={editingSavedContact}
          editingSavedWorkscope={editingSavedWorkscope}
          editingSavedSchedule={editingSavedSchedule}
          inventories={inventories}
          productTypes={productTypes}
          onClose={handleCloseModal}
          onSubmit={handleSubmit}
          onDepartmentSearchChange={setDepartmentSearch}
          onCustomerSearchChange={setCustomerSearch}
          onWorkscopeCategorySearchChange={setWorkscopeCategorySearch}
          onShowDepartmentDropdownChange={setShowDepartmentDropdown}
          onShowCustomerDropdownChange={setShowCustomerDropdown}
          onShowWorkscopeDropdownChange={setShowWorkscopeDropdown}
          onFormDataChange={setFormData}
          onAddContact={handleAddContact}
          onRemoveContact={handleRemoveContact}
          onUpdateContact={handleUpdateContact}
          onAddWorkscopeDetail={handleAddWorkscopeDetail}
          onRemoveWorkscopeDetail={handleRemoveWorkscopeDetail}
          onUpdateWorkscopeDetail={handleUpdateWorkscopeDetail}
          onAddSchedule={handleAddSchedule}
          onRemoveSchedule={handleRemoveSchedule}
          onUpdateSchedule={handleUpdateSchedule}
          onAddRemark={handleAddRemark}
          onRemoveRemark={handleRemoveRemark}
          onUpdateRemark={handleUpdateRemark}
          onSaveContact={handleSaveContact}
          onSaveWorkscopeDetail={handleSaveWorkscopeDetail}
          onSaveSchedule={handleSaveSchedule}
          onSaveRemark={handleSaveRemark}
          onRemoveSavedContact={handleRemoveSavedContact}
          onRemoveSavedWorkscopeDetail={handleRemoveSavedWorkscopeDetail}
          onRemoveSavedSchedule={handleRemoveSavedSchedule}
          onRemoveSavedRemark={handleRemoveSavedRemark}
          onStartEditSavedContact={handleStartEditSavedContact}
          onSaveEditedContact={handleSaveEditedContact}
          onCancelEditSavedContact={handleCancelEditSavedContact}
          onStartEditSavedWorkscope={handleStartEditSavedWorkscope}
          onSaveEditedWorkscope={handleSaveEditedWorkscope}
          onCancelEditSavedWorkscope={handleCancelEditSavedWorkscope}
          onStartEditSavedSchedule={handleStartEditSavedSchedule}
          onSaveEditedSchedule={handleSaveEditedSchedule}
          onCancelEditSavedSchedule={handleCancelEditSavedSchedule}
          isTaskClosed={isTaskClosed}
          onEditLatestRemark={handleOpenEditRemarkModal}
          onOpenInventoryModal={() => setShowInventoryModal(true)}
          onRemoveInventory={removeInventory}
        />

        {/* Remarks Modal */}
        <RemarksModal
          showModal={showRemarksModal}
          task={selectedTask}
          savedRemarks={savedRemarks}
          onClose={handleCloseRemarksModal}
          onAddRemark={handleAddRemarkInModal}
          onRemoveRemark={handleRemoveRemarkInModal}
          onEditLatestRemark={handleOpenEditRemarkModal}
          getAllowedStatuses={getAllowedStatuses}
          isTechnicalDepartment={isTechnicalDepartment}
        />

        {/* Edit Remark Modal */}
        {showEditRemarkModal && remarkToEdit && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Edit Latest Remark
              </h3>

              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={editRemarkStatus}
                onChange={(e) => setEditRemarkStatus(e.target.value)}
                className="w-full border text-black border-gray-300 rounded-md px-3 py-2 mb-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {getAllowedStatuses(editRemarkStatus).map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>

              <label className="block text-sm font-medium text-gray-700 mb-1">
                Remark
              </label>
              <textarea
                value={editRemarkText}
                onChange={(e) => setEditRemarkText(e.target.value)}
                className="w-full border text-black border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
                rows={3}
              />

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCloseEditRemarkModal}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveEditedRemark}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Inventory Modal */}
        <InventoryModalComponent />
      </div>
    </div>
  );
}
