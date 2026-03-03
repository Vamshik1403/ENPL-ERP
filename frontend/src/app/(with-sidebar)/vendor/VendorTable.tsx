"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Plus, Pencil, Trash2, Search, Loader2, ChevronLeft, ChevronRight, Users, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import SlideFormPanel from "@/components/ui/SlideFormPanel";
import { useToast } from "@/components/ui/toaster";

interface VendorContact {
  title: string;
  firstName: string;
  lastName: string;
  contactPhoneNumber: string;
  contactEmailId: string;
  designation: string;
  department: string;
  landlineNumber: string;
}

interface BankDetail {
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  branchName: string;
}

interface Vendor {
  id?: number;
  vendorCode?: string;
  vendorName: string;
  registerAddress: string;
  gstNo: string;
  businessType?: string;
  state: string;
  city: string;
  emailId: string;
  gstpdf?: string;
  website: string;
  products: string[];
  creditTerms: string;
  creditLimit: string;
  remark: string;
  contacts: VendorContact[];
  bankDetails: BankDetail[];
}

const emptyContact: VendorContact = {
  title: "",
  firstName: "",
  lastName: "",
  contactPhoneNumber: "",
  contactEmailId: "",
  designation: "",
  department: "",
  landlineNumber: "",
};

const emptyBank: BankDetail = {
  accountNumber: "",
  ifscCode: "",
  bankName: "",
  branchName: "",
};

const initialFormState: Vendor = {
  vendorName: "",
  registerAddress: "",
  gstNo: "",
  businessType: "",
  state: "",
  city: "",
  emailId: "",
  gstpdf: "",
  website: "",
  products: [],
  creditTerms: "",
  creditLimit: "",
  remark: "",
  contacts: [{ ...emptyContact }],
  bankDetails: [{ ...emptyBank }],
};

const VendorTable: React.FC = () => {
  const { toast } = useToast();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [gstPdfFile, setGstPdfFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<Vendor>(initialFormState);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  const itemsPerPage = 5;

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:8000/vendors");
      setVendors(response.data.reverse());
    } catch (error) {
      console.error("Failed to fetch vendors:", error);
      toast({ title: "Failed to load vendors", description: "Please try again.", variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const filteredVendors = vendors.filter((vendor) =>
    [
      vendor.vendorName,
      vendor.vendorCode,
      vendor.products?.join(", "),
      vendor.gstNo,
      vendor.state,
      vendor.businessType,
    ].some(
      (field) =>
        field &&
        typeof field === "string" &&
        field.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentVendors = filteredVendors.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const totalPages = Math.ceil(filteredVendors.length / itemsPerPage);

  const fetchCategories = async () => {
    try {
      const response = await axios.get("http://localhost:8000/category");
      const names = response.data.map((c: any) => c.categoryName);
      setCategories(names);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      toast({ title: "Failed to load categories", description: "Please refresh the page.", variant: "error" });
    }
  };

  useEffect(() => {
    fetchVendors();
    fetchCategories();
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const requiredFields = [
      { key: "vendorName", label: "Vendor Name" },
      { key: "registerAddress", label: "Register Address" },
      { key: "gstNo", label: "GST Number" },
      { key: "emailId", label: "Email ID" },
      { key: "creditTerms", label: "Credit Terms" },
      { key: "creditLimit", label: "Credit Limit" },
    ];

    requiredFields.forEach(({ key, label }) => {
      const value = formData[key as keyof Vendor];
      if (!value || (typeof value === "string" && !value.trim())) {
        newErrors[key] = `${label} is required`;
      }
    });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.emailId && !emailRegex.test(formData.emailId)) {
      newErrors.emailId = "Please enter a valid email address";
    }

    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (formData.gstNo && !gstRegex.test(formData.gstNo)) {
      newErrors.gstNo = "Please enter a valid GST number";
    }

    const validContacts = formData.contacts.filter(
      (c) => c.firstName.trim() || c.lastName.trim() || c.contactPhoneNumber.trim()
    );
    if (validContacts.length === 0) {
      newErrors.contacts = "At least one contact is required";
    }

    formData.contacts.forEach((contact, index) => {
      if (contact.firstName.trim() || contact.lastName.trim() || contact.contactPhoneNumber.trim()) {
        if (!contact.firstName.trim()) {
          newErrors[`contacts[${index}].firstName`] = "First name is required";
        }
        if (!contact.lastName.trim()) {
          newErrors[`contacts[${index}].lastName`] = "Last name is required";
        }
        if (!contact.contactPhoneNumber.trim()) {
          newErrors[`contacts[${index}].contactPhoneNumber`] = "Phone number is required";
        }
        if (contact.contactEmailId && !emailRegex.test(contact.contactEmailId)) {
          newErrors[`contacts[${index}].contactEmailId`] = "Invalid email format";
        }
      }
    });

    formData.bankDetails.forEach((bank, index) => {
      if (bank.accountNumber.trim() || bank.ifscCode.trim() || bank.bankName.trim()) {
        if (!bank.accountNumber.trim()) {
          newErrors[`bankDetails[${index}].accountNumber`] = "Account number is required";
        }
        if (!bank.ifscCode.trim()) {
          newErrors[`bankDetails[${index}].ifscCode`] = "IFSC code is required";
        }
        if (!bank.bankName.trim()) {
          newErrors[`bankDetails[${index}].bankName`] = "Bank name is required";
        }
        const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
        if (bank.ifscCode && !ifscRegex.test(bank.ifscCode)) {
          newErrors[`bankDetails[${index}].ifscCode`] = "Invalid IFSC code format";
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    field: string,
    index?: number,
    type?: string
  ) => {
    const { name, value } = e.target;

    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    if (type === "contact" && index !== undefined) {
      setFormData((prev) => ({
        ...prev,
        contacts: prev.contacts.map((contact, i) =>
          i === index ? { ...contact, [name]: value || "" } : contact
        ),
      }));
      return;
    }

    if (type === "bank" && index !== undefined) {
      setFormData((prev) => ({
        ...prev,
        bankDetails: prev.bankDetails.map((bank, i) =>
          i === index ? { ...bank, [name]: value || "" } : bank
        ),
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value || ""
    }));
  };

  const addContact = () => {
    setFormData((prev) => ({
      ...prev,
      contacts: [...prev.contacts, { ...emptyContact }],
    }));

    setErrors(prev => {
      const newErrors = { ...prev };
      Object.keys(newErrors).forEach(key => {
        if (key.startsWith('contacts[')) delete newErrors[key];
      });
      return newErrors;
    });
  };

  const removeContact = (index: number) => {
    if (formData.contacts.length === 1) {
      toast({ title: "At least one contact is required", variant: "warning" });
      return;
    }

    const updated = [...formData.contacts];
    updated.splice(index, 1);
    setFormData((prev) => ({ ...prev, contacts: updated }));
  };

  const addBank = () => {
    setFormData((prev) => ({
      ...prev,
      bankDetails: [...prev.bankDetails, { ...emptyBank }],
    }));
  };

  const removeBank = (index: number) => {
    const updated = [...formData.bankDetails];
    updated.splice(index, 1);
    setFormData((prev) => ({ ...prev, bankDetails: updated }));
  };

  const handleView = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setIsViewModalOpen(true);
  };

  const handleEdit = (vendor: Vendor) => {
    const cleanedVendor: Vendor = {
      ...vendor,
      vendorName: vendor.vendorName || "",
      registerAddress: vendor.registerAddress || "",
      gstNo: vendor.gstNo || "",
      businessType: vendor.businessType || "",
      state: vendor.state || "",
      city: vendor.city || "",
      emailId: vendor.emailId || "",
      website: vendor.website || "",
      creditTerms: vendor.creditTerms || "",
      creditLimit: vendor.creditLimit || "",
      remark: vendor.remark || "",
      products: vendor.products || [],
      contacts: vendor.contacts?.map(contact => ({
        ...emptyContact,
        ...contact,
        title: contact.title || "",
        firstName: contact.firstName || "",
        lastName: contact.lastName || "",
        contactPhoneNumber: contact.contactPhoneNumber || "",
        contactEmailId: contact.contactEmailId || "",
        designation: contact.designation || "",
        department: contact.department || "",
        landlineNumber: contact.landlineNumber || "",
      })) || [{ ...emptyContact }],
      bankDetails: vendor.bankDetails?.map(bank => ({
        ...emptyBank,
        ...bank,
        accountNumber: bank.accountNumber || "",
        ifscCode: bank.ifscCode || "",
        bankName: bank.bankName || "",
        branchName: bank.branchName || "",
      })) || [{ ...emptyBank }],
    };

    setFormData(cleanedVendor);
    setErrors({});
    setGstPdfFile(null);
    setIsCreateModalOpen(true);
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;

    const confirm = window.confirm(
      "Are you sure you want to delete this vendor? This action cannot be undone."
    );
    if (!confirm) return;

    try {
      await axios.delete(`http://localhost:8000/vendors/${id}`);
      toast({ title: "Vendor deleted successfully!", variant: "success" });
      fetchVendors();
    } catch (err: any) {
      console.error("Error deleting vendor:", err);
      toast({ title: err.response?.data?.message || "Failed to delete vendor", variant: "error" });
    }
  };

  const ReadBox = ({ label, value }: { label: string; value?: any }) => (
    <div>
      <Label className="text-xs font-semibold text-gray-500">{label}</Label>
      <div className="w-full border border-gray-200 rounded-md px-3 py-2 bg-gray-50 text-gray-800 min-h-[38px] flex items-center mt-1">
        <span className="text-sm break-words">{value ?? "N/A"}</span>
      </div>
    </div>
  );

  const handleCreate = async () => {
    if (!validateForm()) {
      toast({ title: "Please fill all details before submit", variant: "warning" });
      return;
    }

    try {
      const payload = new FormData();

      payload.append("vendorName", formData.vendorName);
      payload.append("registerAddress", formData.registerAddress);
      payload.append("gstNo", formData.gstNo);
      payload.append("businessType", formData.businessType || "");
      payload.append("state", formData.state);
      payload.append("city", formData.city);
      payload.append("emailId", formData.emailId);
      payload.append("website", formData.website);
      payload.append("creditTerms", formData.creditTerms);
      payload.append("creditLimit", formData.creditLimit);
      payload.append("remark", formData.remark);
      payload.append("products", JSON.stringify(formData.products));

      const validContacts = formData.contacts.filter(
        (c) => c.firstName.trim() || c.lastName.trim() || c.contactPhoneNumber.trim()
      );
      payload.append("contacts", JSON.stringify(validContacts));

      const validBanks = formData.bankDetails.filter(
        (b) => b.accountNumber.trim() || b.ifscCode.trim() || b.bankName.trim()
      );
      payload.append("bankDetails", JSON.stringify(validBanks));

      if (gstPdfFile) {
        payload.append("gstCertificate", gstPdfFile);
      }

      let response;
      if (formData.id) {
        response = await axios.put(
          `http://localhost:8000/vendors/${formData.id}`,
          payload,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
      } else {
        response = await axios.post("http://localhost:8000/vendors", payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      toast({
        title: formData.id
          ? "Vendor updated successfully!"
          : "Vendor created successfully!",
        variant: "success",
      });
      setFormData(initialFormState);
      setGstPdfFile(null);
      setErrors({});
      setIsCreateModalOpen(false);
      fetchVendors();
    } catch (err: any) {
      console.error("Error saving vendor:", err);
      const errorMessage = err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to save vendor. Please try again.";
      toast({ title: errorMessage, variant: "error" });
    }
  };

  const getFieldValue = (fieldName: string): string => {
    const value = formData[fieldName as keyof Vendor];
    return value !== null && value !== undefined ? String(value) : "";
  };

  return (
    <div className="w-full px-4 sm:px-6 py-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Vendors</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your vendor directory and contacts</p>
      </div>

      {/* Toolbar */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <Button
          onClick={() => {
            setFormData(initialFormState);
            setErrors({});
            setGstPdfFile(null);
            setIsCreateModalOpen(true);
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Vendor
        </Button>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by name, GST, products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-white">
                    <TableHead className="font-semibold">Vendor ID</TableHead>
                    <TableHead className="font-semibold">Vendor Type</TableHead>
                    <TableHead className="font-semibold">Company Name</TableHead>
                    <TableHead className="font-semibold">GST No.</TableHead>
                    <TableHead className="font-semibold">State</TableHead>
                    <TableHead className="font-semibold">City</TableHead>
                    <TableHead className="font-semibold">Products</TableHead>
                    <TableHead className="font-semibold">GST Certificate</TableHead>
                    <TableHead className="font-semibold">Credit Terms</TableHead>
                    <TableHead className="font-semibold text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentVendors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="h-32 text-center text-gray-500">
                        <div className="flex flex-col items-center gap-2">
                          <Users className="h-8 w-8 text-gray-300" />
                          <p>No vendors found.{searchQuery && " Try a different search."}</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentVendors.map((vendor) => (
                      <TableRow key={vendor.id}>
                        <TableCell>
                          <Badge variant="secondary" className="font-mono">{vendor.vendorCode || "N/A"}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{vendor.businessType || "N/A"}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{vendor.vendorName || "N/A"}</TableCell>
                        <TableCell className="font-mono text-xs">{vendor.gstNo || "N/A"}</TableCell>
                        <TableCell>{vendor.state || "N/A"}</TableCell>
                        <TableCell>{vendor.city || "N/A"}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {Array.isArray(vendor.products) && vendor.products.length > 0 ? (
                              vendor.products.slice(0, 3).map((p, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs font-normal">
                                  {p}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-gray-400 text-sm">No products</span>
                            )}
                            {Array.isArray(vendor.products) && vendor.products.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{vendor.products.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {vendor.gstpdf ? (
                            <a
                              href={`http://localhost:8000/gst/${vendor.gstpdf}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-800 hover:underline text-sm"
                            >
                              View PDF
                            </a>
                          ) : (
                            <span className="text-gray-400 text-sm">No PDF</span>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{vendor.creditTerms || "N/A"}</TableCell>
                        <TableCell>
                          <div className="flex gap-1 justify-center">
                            <Button
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => handleView(vendor)}
                              title="View"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => handleEdit(vendor)}
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDelete(vendor.id)}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Pagination */}
          {filteredVendors.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
              <p className="text-sm text-gray-500">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredVendors.length)} of {filteredVendors.length} vendors
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm text-gray-600 px-2">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="gap-1"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── View Vendor Panel ── */}
      <SlideFormPanel
        title="Vendor Details"
        description={selectedVendor ? `${selectedVendor.vendorCode ?? ""} • ${selectedVendor.vendorName}` : ""}
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedVendor(null);
        }}
      >
        {selectedVendor && (
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Basic Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ReadBox label="Vendor Code" value={selectedVendor.vendorCode} />
                <ReadBox label="Vendor Name" value={selectedVendor.vendorName} />
                <ReadBox label="GST No" value={selectedVendor.gstNo} />
                <ReadBox label="Email" value={selectedVendor.emailId} />
                <ReadBox label="Business Type" value={selectedVendor.businessType} />
                <ReadBox label="Website" value={selectedVendor.website} />
                <ReadBox label="State" value={selectedVendor.state} />
                <ReadBox label="City" value={selectedVendor.city} />
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold text-gray-500">Registered Address</Label>
                  <Textarea
                    value={selectedVendor.registerAddress ?? "N/A"}
                    readOnly
                    rows={3}
                    className="mt-1 bg-gray-50 resize-none"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-500">Remark</Label>
                  <Textarea
                    value={selectedVendor.remark ?? "N/A"}
                    readOnly
                    rows={3}
                    className="mt-1 bg-gray-50 resize-none"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Finance & Docs */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Finance & Documents</h4>
              <div className="grid grid-cols-2 gap-4">
                <ReadBox label="Credit Terms" value={selectedVendor.creditTerms} />
                <ReadBox label="Credit Limit" value={selectedVendor.creditLimit} />
              </div>

              <div className="mt-4">
                <Label className="text-xs font-semibold text-gray-500">Products</Label>
                <div className="min-h-[40px] border border-gray-200 rounded-md p-3 bg-gray-50 flex flex-wrap gap-2 mt-1">
                  {Array.isArray(selectedVendor.products) && selectedVendor.products.length > 0 ? (
                    selectedVendor.products.map((p, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">{p}</Badge>
                    ))
                  ) : (
                    <span className="text-gray-400 text-sm">No products</span>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <Label className="text-xs font-semibold text-gray-500">GST Certificate</Label>
                <div className="border border-gray-200 rounded-md p-3 bg-gray-50 flex items-center justify-between gap-3 mt-1">
                  <p className="text-sm text-gray-700 truncate">
                    {selectedVendor.gstpdf || "No file uploaded"}
                  </p>
                  {selectedVendor.gstpdf && (
                    <a
                      href={`http://localhost:8000/gst/${selectedVendor.gstpdf}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button size="sm" variant="outline">View PDF</Button>
                    </a>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Contacts */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Contacts</h4>
              {selectedVendor.contacts?.length ? (
                <div className="space-y-3">
                  {selectedVendor.contacts.map((c, idx) => (
                    <div key={idx} className="rounded-lg border border-gray-200 p-4 bg-gray-50/80">
                      <p className="font-medium text-sm text-gray-800 mb-3">
                        Contact {idx + 1}: {c.firstName} {c.lastName}
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        <ReadBox label="Title" value={c.title} />
                        <ReadBox label="First Name" value={c.firstName} />
                        <ReadBox label="Last Name" value={c.lastName} />
                        <ReadBox label="Phone" value={c.contactPhoneNumber} />
                        <ReadBox label="Email" value={c.contactEmailId} />
                        <ReadBox label="Designation" value={c.designation} />
                        <ReadBox label="Department" value={c.department} />
                        <ReadBox label="Landline" value={c.landlineNumber} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No contacts available</p>
              )}
            </div>

            <Separator />

            {/* Bank Details */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Bank Details</h4>
              {selectedVendor.bankDetails?.length ? (
                <div className="space-y-3">
                  {selectedVendor.bankDetails.map((b, idx) => (
                    <div key={idx} className="rounded-lg border border-gray-200 p-4 bg-gray-50/80">
                      <p className="font-medium text-sm text-gray-800 mb-3">Bank {idx + 1}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {Object.entries(b)
                          .filter(([key]) => !["id", "vendorId"].includes(key))
                          .map(([key, value]) => (
                            <ReadBox
                              key={key}
                              label={key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
                              value={String(value ?? "")}
                            />
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No bank details available</p>
              )}
            </div>

            <Separator />

            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsViewModalOpen(false);
                  setSelectedVendor(null);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </SlideFormPanel>

      {/* ── Create / Edit Vendor Panel ── */}
      <SlideFormPanel
        title={formData.id ? "Edit Vendor" : "Create New Vendor"}
        description={formData.id ? "Update vendor information" : "Add a new vendor to the system"}
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      >
        <div className="space-y-6">
          {errors.contacts && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm font-medium">{errors.contacts}</p>
            </div>
          )}

          {/* Basic Information */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Basic Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Business Type <span className="text-red-500">*</span></Label>
                <select
                  name="businessType"
                  value={getFieldValue("businessType")}
                  onChange={(e) => handleInputChange(e, "businessType")}
                  className="flex h-9 w-full rounded-md border border-gray-200 bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  <option value="">Select Business Type</option>
                  <option value="OEM">OEM</option>
                  <option value="ND">ND</option>
                  <option value="RD">RD</option>
                  <option value="Stockist">Stockist</option>
                  <option value="Reseller">Reseller</option>
                  <option value="System Integrator">System Integrator</option>
                  <option value="Service Provider">Service Provider</option>
                  <option value="Consultant">Consultant</option>
                </select>
              </div>

              {[
                { field: "vendorName", label: "Vendor Name", required: true },
                { field: "state", label: "State", required: true },
                { field: "city", label: "City", required: true },
                { field: "gstNo", label: "GST Number", required: true },
                { field: "emailId", label: "Email ID", required: true, type: "email" },
                { field: "creditTerms", label: "Credit Terms", required: true },
                { field: "creditLimit", label: "Credit Limit", required: true },
                { field: "website", label: "Website", required: false },
              ].map(({ field, label, required, type = "text" }) => (
                <div key={field} className="space-y-1.5">
                  <Label>
                    {label} {required && <span className="text-red-500">*</span>}
                  </Label>
                  <Input
                    type={type}
                    name={field}
                    placeholder={`Enter ${label.toLowerCase()}`}
                    value={getFieldValue(field)}
                    onChange={(e) => handleInputChange(e, field)}
                    className={errors[field] ? "border-red-500" : ""}
                  />
                  {errors[field] && (
                    <p className="text-xs text-red-600">{errors[field]}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Full-width fields */}
            <div className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <Label>
                  Registered Address <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  name="registerAddress"
                  placeholder="Enter registered address"
                  value={getFieldValue("registerAddress")}
                  onChange={(e) => handleInputChange(e, "registerAddress")}
                  rows={3}
                  className={errors.registerAddress ? "border-red-500" : ""}
                />
                {errors.registerAddress && (
                  <p className="text-xs text-red-600">{errors.registerAddress}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Remarks</Label>
                <Textarea
                  name="remark"
                  placeholder="Enter remarks"
                  value={getFieldValue("remark")}
                  onChange={(e) => handleInputChange(e, "remark")}
                  rows={3}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* GST Certificate */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">GST Certificate</h4>
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
              <input
                type="file"
                id="gst-pdf"
                accept="application/pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.type === "application/pdf") {
                      setGstPdfFile(file);
                    } else {
                      toast({ title: "Please upload only PDF files", variant: "warning" });
                    }
                  }
                }}
                className="hidden"
              />
              <label htmlFor="gst-pdf" className="cursor-pointer">
                <div className="flex flex-col items-center">
                  <p className="text-sm text-gray-600">
                    {gstPdfFile ? gstPdfFile.name : "Click to upload GST Certificate (PDF)"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Max size: 5MB</p>
                </div>
              </label>
            </div>
            {!gstPdfFile && formData.gstpdf && (
              <div className="mt-3">
                <p className="text-sm text-gray-500 mb-1">Existing certificate:</p>
                <a
                  href={`http://localhost:8000/gst/${formData.gstpdf}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-800 hover:underline text-sm"
                >
                  View GST Certificate
                </a>
              </div>
            )}
          </div>

          <Separator />

          {/* Product Categories */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Product Categories</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-1">
              {categories.map((category) => (
                <label
                  key={category}
                  className="flex items-center p-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    value={category}
                    checked={formData.products.includes(category)}
                    onChange={(e) => {
                      const { checked, value } = e.target;
                      setFormData((prev) => ({
                        ...prev,
                        products: checked
                          ? [...prev.products, value]
                          : prev.products.filter((p) => p !== value),
                      }));
                    }}
                    className="mr-2.5 h-4 w-4 rounded border-gray-300"
                  />
                  <span className="text-sm">{category}</span>
                </label>
              ))}
            </div>
            {formData.products.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-gray-500 mb-1.5">Selected ({formData.products.length}):</p>
                <div className="flex flex-wrap gap-1.5">
                  {formData.products.map((product) => (
                    <Badge key={product} variant="secondary" className="text-xs">{product}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Contacts Section */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-semibold text-gray-900">Contacts</h4>
              <Button type="button" variant="outline" size="sm" onClick={addContact} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Add Contact
              </Button>
            </div>

            {formData.contacts.map((contact, i) => (
              <div key={i} className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50/80">
                <div className="flex justify-between items-center mb-3">
                  <h5 className="text-sm font-medium text-gray-700">Contact {i + 1}</h5>
                  {formData.contacts.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeContact(i)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7 text-xs"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {Object.keys(emptyContact).map((key) => {
                    const fieldName = key as keyof VendorContact;
                    const label = key.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase());
                    const required = ["firstName", "lastName", "contactPhoneNumber"].includes(key);

                    return (
                      <div key={key} className="space-y-1">
                        <Label className="text-xs">
                          {label} {required && <span className="text-red-500">*</span>}
                        </Label>
                        <Input
                          name={key}
                          placeholder={`Enter ${label.toLowerCase()}`}
                          value={contact[fieldName] || ""}
                          onChange={(e) => handleInputChange(e, key, i, "contact")}
                          className={`h-8 text-sm ${errors[`contacts[${i}].${key}`] ? "border-red-500" : ""}`}
                        />
                        {errors[`contacts[${i}].${key}`] && (
                          <p className="text-xs text-red-600">{errors[`contacts[${i}].${key}`]}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <Separator />

          {/* Bank Details Section */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-semibold text-gray-900">Bank Details</h4>
              <Button type="button" variant="outline" size="sm" onClick={addBank} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Add Bank
              </Button>
            </div>

            {formData.bankDetails.map((bank, i) => (
              <div key={i} className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50/80">
                <div className="flex justify-between items-center mb-3">
                  <h5 className="text-sm font-medium text-gray-700">Bank Account {i + 1}</h5>
                  {formData.bankDetails.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeBank(i)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7 text-xs"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {Object.keys(emptyBank).map((key) => {
                    const fieldName = key as keyof BankDetail;
                    const label = key.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase());
                    const required = ["accountNumber", "ifscCode", "bankName"].includes(key);

                    return (
                      <div key={key} className="space-y-1">
                        <Label className="text-xs">
                          {label} {required && <span className="text-red-500">*</span>}
                        </Label>
                        <Input
                          name={key}
                          placeholder={`Enter ${label.toLowerCase()}`}
                          value={bank[fieldName] || ""}
                          onChange={(e) => handleInputChange(e, key, i, "bank")}
                          className={`h-8 text-sm ${errors[`bankDetails[${i}].${key}`] ? "border-red-500" : ""}`}
                        />
                        {errors[`bankDetails[${i}].${key}`] && (
                          <p className="text-xs text-red-600">{errors[`bankDetails[${i}].${key}`]}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <Separator />

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateModalOpen(false);
                setErrors({});
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate}>
              {formData.id ? "Update Vendor" : "Create Vendor"}
            </Button>
          </div>
        </div>
      </SlideFormPanel>
    </div>
  );
};

export default VendorTable;