"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Plus, Pencil, Trash2, Search, Loader2, ChevronLeft, ChevronRight, Eye, X, Download, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import SlideFormPanel from "@/components/ui/SlideFormPanel";
import { VendorCombobox } from "@/components/ui/VendorCombobox";
import { ProductCombobox } from "@/components/ui/ProductCombobox";
import { useToast } from "@/components/ui/toaster";
import Papa from "papaparse";

/* ─── Types ─────────────────────────────────────────────────────── */

interface ProductInventory {
    productId: number;
    make: string;
    model: string;
    serialNumber: string;
    macAddress: string;
    warrantyPeriod: string;
    purchaseRate: string;
    noSerialMac?: boolean;
    autoGenerateSerial?: boolean;
}

interface Inventory {
    id?: number;
    vendorId: number;
    creditTerms?: string;
    invoiceNetAmount?: string;
    gstAmount?: string;
    dueDate?: string;
    invoiceGrossAmount?: string;
    purchaseDate: string;
    dueAmount?: string | number;
    purchaseInvoice: string;
    status?: string;
    duration?: string;
    products: ProductInventory[];
}

interface Vendor { id: number; vendorName: string; }

interface Product {
    id: number;
    productId: string;
    productName: string;
    productDescription?: string;
    HSN?: string;
    unit?: string;
    gstRate?: string;
    categoryId: number;
    subCategoryId: number;
    category?: { id: number; categoryName: string; categoryId: string };
    subCategory?: { id: number; subCategoryName: string; subCategoryId: string; categoryId: number };
}

const initialFormState: Inventory = {
    vendorId: 0,
    purchaseDate: "",
    dueAmount: 0,
    purchaseInvoice: "",
    status: "In Stock",
    dueDate: "",
    creditTerms: "",
    invoiceNetAmount: "",
    gstAmount: "",
    invoiceGrossAmount: "",
    products: [],
};

/* ─── Component ─────────────────────────────────────────────────── */

const InventoryTable: React.FC = () => {
    const { toast } = useToast();

    const [inventoryList, setInventoryList] = useState<Inventory[]>([]);
    const [filteredInventory, setFilteredInventory] = useState<Inventory[]>([]);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [formData, setFormData] = useState<Inventory>(initialFormState);
    const [showPanel, setShowPanel] = useState(false);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [selectedInventory, setSelectedInventory] = useState<Inventory | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [productErrors, setProductErrors] = useState<Record<number, Record<string, string>>>({});
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

    const itemsPerPage = 10;

    /* ── Data fetching ── */
    useEffect(() => { fetchInventory(); fetchProducts(); fetchVendors(); }, []);
    useEffect(() => { handleSearch(searchQuery); }, [inventoryList, searchQuery, products, vendors]);

    const fetchInventory = async () => {
        try {
            setLoading(true);
            const res = await axios.get("http://localhost:8000/inventory");
            const inventoryWithDuration = res.data.reverse().map((item: Inventory) => {
                const purchaseDate = new Date(item.purchaseDate);
                const today = new Date();
                const diffDays = Math.floor((today.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));
                return { ...item, duration: `${diffDays} day${diffDays !== 1 ? "s" : ""}` };
            });
            setInventoryList(inventoryWithDuration);
            setFilteredInventory(inventoryWithDuration);
        } catch (error) {
            console.error("Error fetching inventory:", error);
            toast({ title: "Failed to load inventory", description: "Please refresh the page.", variant: "error" });
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        try { const res = await axios.get("http://localhost:8000/products"); setProducts(res.data); }
        catch (error) { console.error("Error fetching products:", error); }
    };

    const fetchVendors = async () => {
        try { const res = await axios.get("http://localhost:8000/vendors"); setVendors(res.data); }
        catch (error) { console.error("Error fetching vendors:", error); }
    };

    const openViewPanel = async (inventoryId: number) => {
        try {
            setLoading(true);
            const res = await axios.get(`http://localhost:8000/inventory/${inventoryId}`);
            setSelectedInventory(res.data);
            setIsViewOpen(true);
        } catch (error) {
            console.error("Error fetching inventory details:", error);
            toast({ title: "Failed to load details", variant: "error" });
        } finally {
            setLoading(false);
        }
    };

    /* ── Validation ── */
    const validateForm = (dataToValidate: Inventory = formData): boolean => {
        const newErrors: Record<string, string> = {};
        const newProductErrors: Record<number, Record<string, string>> = {};

        if (!dataToValidate.purchaseInvoice.trim()) newErrors.purchaseInvoice = "Purchase invoice number is required";
        if (!dataToValidate.purchaseDate) newErrors.purchaseDate = "Purchase date is required";
        if (!dataToValidate.vendorId) newErrors.vendorId = "Vendor is required";
        if (!dataToValidate.creditTerms?.trim()) newErrors.creditTerms = "Credit terms are required";
        if (!dataToValidate.invoiceNetAmount?.trim()) newErrors.invoiceNetAmount = "Net amount is required";
        else if (isNaN(parseFloat(dataToValidate.invoiceNetAmount))) newErrors.invoiceNetAmount = "Please enter a valid number";
        if (!dataToValidate.gstAmount?.trim()) newErrors.gstAmount = "GST amount is required";
        else if (isNaN(parseFloat(dataToValidate.gstAmount))) newErrors.gstAmount = "Please enter a valid number";
        if (dataToValidate.products.length === 0) newErrors.products = "At least one product is required";

        dataToValidate.products.forEach((product, index) => {
            const productError: Record<string, string> = {};
            if (!product.productId) productError.productId = "Product is required";
            if (!product.make?.trim()) productError.make = "Make is required";
            if (!product.model?.trim()) productError.model = "Model is required";
            if (!product.noSerialMac) {
                if (!product.serialNumber?.trim() && !product.macAddress?.trim()) {
                    productError.serialNumber = "Either Serial Number or MAC Address is required";
                    productError.macAddress = "Either Serial Number or MAC Address is required";
                }
            }
            if (!product.warrantyPeriod?.trim()) productError.warrantyPeriod = "Warranty period is required";
            if (!product.purchaseRate?.trim()) productError.purchaseRate = "Purchase rate is required";
            else if (isNaN(parseFloat(product.purchaseRate))) productError.purchaseRate = "Please enter a valid number";
            if (Object.keys(productError).length > 0) newProductErrors[index] = productError;
        });

        setErrors(newErrors);
        setProductErrors(newProductErrors);
        return Object.keys(newErrors).length === 0 && Object.keys(newProductErrors).length === 0;
    };

    /* ── CSV Download ── */
    const handleDownloadCSV = () => {
        if (inventoryList.length === 0) { toast({ title: "No data to download", variant: "warning" }); return; }
        try {
            const csvData = inventoryList.flatMap((inventory) => {
                const vendorName = vendors.find((v) => v.id === inventory.vendorId)?.vendorName || "";
                return inventory.products.map((product) => {
                    const pd = products.find(p => p.id === product.productId);
                    return {
                        PurchaseDate: inventory.purchaseDate, PurchaseInvoice: inventory.purchaseInvoice,
                        Vendor: vendorName, Status: inventory.status || "", CreditTerms: inventory.creditTerms || "",
                        DueDate: inventory.dueDate || "", InvoiceNetAmount: inventory.invoiceNetAmount || "",
                        GSTAmount: inventory.gstAmount || "", InvoiceGrossAmount: inventory.invoiceGrossAmount || "",
                        Duration: inventory.duration || "", ProductCode: pd?.productId || "",
                        ProductName: pd?.productName || "", Category: pd?.category?.categoryName || "",
                        SubCategory: pd?.subCategory?.subCategoryName || "", HSN: pd?.HSN || "",
                        Make: product.make, Model: product.model, SerialNumber: product.serialNumber,
                        MacAddress: product.macAddress, WarrantyPeriod: product.warrantyPeriod,
                        PurchaseRate: product.purchaseRate,
                    };
                });
            });
            const csv = Papa.unparse(csvData);
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.setAttribute("download", `inventory_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link); link.click(); document.body.removeChild(link);
            toast({ title: "CSV downloaded", variant: "success" });
        } catch (error) {
            console.error("Error downloading CSV:", error);
            toast({ title: "Failed to download CSV", variant: "error" });
        }
    };

    /* ── Search ── */
    const handleSearch = (query: string) => {
        const lq = query.toLowerCase();
        const filtered = inventoryList.filter((inv) => {
            const vendorName = vendors.find((v) => v.id === inv.vendorId)?.vendorName?.toLowerCase() || "";
            const invMatch = inv.purchaseInvoice?.toLowerCase().includes(lq) || inv.purchaseDate?.toLowerCase().includes(lq) || inv.creditTerms?.toLowerCase().includes(lq) || inv.invoiceNetAmount?.toLowerCase().includes(lq) || inv.gstAmount?.toLowerCase().includes(lq) || inv.invoiceGrossAmount?.toLowerCase().includes(lq) || inv.status?.toLowerCase().includes(lq) || vendorName.includes(lq);
            const prodMatch = inv.products.some((product) => {
                const pd = products.find((p) => p.id === product.productId);
                return pd?.productName?.toLowerCase().includes(lq) || pd?.category?.categoryName?.toLowerCase().includes(lq) || pd?.HSN?.toLowerCase().includes(lq) || product.make?.toLowerCase().includes(lq) || product.model?.toLowerCase().includes(lq) || product.serialNumber?.toLowerCase().includes(lq) || product.macAddress?.toLowerCase().includes(lq);
            });
            return invMatch || prodMatch;
        });
        setFilteredInventory(filtered);
        setCurrentPage(1);
    };

    /* ── Form handlers ── */
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => {
            const updated = { ...prev, [name]: value };
            const { purchaseDate, creditTerms } = updated;
            if (purchaseDate && creditTerms && !isNaN(Number(creditTerms))) {
                const date = new Date(purchaseDate);
                date.setDate(date.getDate() + parseInt(creditTerms));
                updated.dueDate = date.toISOString().split("T")[0];
            }
            const netAmount = parseFloat(updated.invoiceNetAmount || "0") || 0;
            const gstAmount = parseFloat(updated.gstAmount || "0") || 0;
            updated.invoiceGrossAmount = (netAmount + gstAmount).toFixed(2);
            if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
            return updated;
        });
    };

    const handleSave = async () => {
        const normalizedFormData = {
            ...formData,
            products: formData.products.map((product) => {
                const serialEmpty = !product.serialNumber?.trim();
                const macEmpty = !product.macAddress?.trim();
                if (serialEmpty && macEmpty) return { ...product, noSerialMac: true, serialNumber: "", macAddress: "" };
                return product;
            }),
        };
        setFormData(normalizedFormData);

        if (!validateForm(normalizedFormData)) {
            toast({ title: "Please fix the form errors", description: "Some required fields are missing or invalid.", variant: "warning" });
            return;
        }

        try {
            setSaving(true);
            const payload = {
                ...normalizedFormData,
                dueAmount: normalizedFormData.dueAmount ? Number(normalizedFormData.dueAmount) : 0,
                products: normalizedFormData.products.map((product) => ({
                    productId: product.productId, make: product.make, model: product.model,
                    serialNumber: product.noSerialMac ? null : product.serialNumber?.trim() || null,
                    macAddress: product.noSerialMac ? null : product.macAddress?.trim() || null,
                    warrantyPeriod: product.warrantyPeriod, purchaseRate: product.purchaseRate,
                    autoGenerateSerial: !!product.noSerialMac,
                })),
            };

            if (normalizedFormData.id) {
                await axios.put(`http://localhost:8000/inventory/${normalizedFormData.id}`, payload);
                toast({ title: "Inventory updated", description: "The inventory record was updated successfully.", variant: "success" });
            } else {
                await axios.post("http://localhost:8000/inventory", payload);
                toast({ title: "Inventory created", description: "The new inventory record was created successfully.", variant: "success" });
            }

            setFormData(initialFormState);
            setErrors({}); setProductErrors({});
            setShowPanel(false);
            fetchInventory();
        } catch (error: any) {
            console.error("Save error:", error);
            const msg = error.response?.data?.message || error.response?.data?.error || "Something went wrong!";
            toast({ title: "Save failed", description: msg, variant: "error" });
        } finally {
            setSaving(false);
        }
    };

    const openPanel = (data?: Inventory) => {
        if (data) {
            const clonedProducts = (data.products || []).map((p: any) => ({ ...p, noSerialMac: !!p.autoGenerateSerial }));
            setFormData({ ...data, purchaseDate: data.purchaseDate ? data.purchaseDate.slice(0, 10) : "", dueDate: data.dueDate ? data.dueDate.slice(0, 10) : "", products: clonedProducts });
        } else {
            setFormData(initialFormState);
        }
        setErrors({}); setProductErrors({});
        setShowPanel(true);
    };

    /* ── Sorting ── */
    const sortedInventory = [...filteredInventory].sort((a, b) => {
        if (!sortConfig) return 0;
        const { key, direction } = sortConfig;
        const getValue = (obj: any) => {
            switch (key) {
                case "vendor": return vendors.find((v) => v.id === obj.vendorId)?.vendorName || "";
                case "productName": return products.find((p) => p.id === obj.products[0]?.productId)?.productName || "";
                case "status": return obj.status || "";
                case "duration": return obj.duration || "";
                default: return obj[key] || "";
            }
        };
        const aVal = (getValue(a) as string).toLowerCase();
        const bVal = (getValue(b) as string).toLowerCase();
        if (aVal < bVal) return direction === "asc" ? -1 : 1;
        if (aVal > bVal) return direction === "asc" ? 1 : -1;
        return 0;
    });

    const paginatedInventory = sortedInventory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const totalPages = Math.ceil(filteredInventory.length / itemsPerPage);

    const handleSort = (key: string) => {
        setSortConfig((prev) => prev?.key === key ? { key, direction: prev.direction === "asc" ? "desc" : "asc" } : { key, direction: "asc" });
    };
    const getSortIcon = (key: string) => {
        if (sortConfig?.key !== key) return <ArrowUpDown className="ml-1 h-3 w-3 text-gray-400" />;
        return sortConfig.direction === "asc" ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />;
    };

    /* ── Product row helpers ── */
    const addProductRow = () => {
        setFormData(prev => ({
            ...prev,
            products: [...prev.products, { productId: 0, make: "", model: "", serialNumber: "", macAddress: "", warrantyPeriod: "", purchaseRate: "", noSerialMac: false }],
        }));
    };

    const removeProductRow = (index: number) => {
        const updated = [...formData.products]; updated.splice(index, 1);
        setFormData({ ...formData, products: updated });
        setProductErrors(prev => { const ne = { ...prev }; delete ne[index]; return ne; });
    };

    const updateProductField = (index: number, field: keyof ProductInventory, value: any) => {
        const updated = [...formData.products];
        (updated[index] as any)[field] = value;
        setFormData({ ...formData, products: updated });
        if (productErrors[index]?.[field]) {
            setProductErrors(prev => {
                const ne = { ...prev };
                if (ne[index]) { ne[index] = { ...ne[index] }; delete ne[index][field]; if (Object.keys(ne[index]).length === 0) delete ne[index]; }
                return ne;
            });
        }
    };

    /* ─── Render ─────────────────────────────────────────────────── */
    return (
        <div className="w-full px-4 py-6 sm:px-6 text-black">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold text-gray-900">Inventory</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage inventory records and product tracking</p>
                </div>

                <Separator className="mb-6" />

                {/* Actions Bar */}
                <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <Button size="sm" onClick={() => openPanel()}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Inventory
                    </Button>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search by invoice, serial, vendor..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Button variant="outline" size="sm" onClick={handleDownloadCSV} disabled={inventoryList.length === 0} title="Download CSV">
                            <Download className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                                        {[
                                            { label: "Product Name", key: "productName" },
                                            { label: "Vendor", key: "vendor" },
                                            { label: "Status", key: "status" },
                                            { label: "Age", key: "duration" },
                                            { label: "Actions", key: "" },
                                        ].map((col) => (
                                            <TableHead
                                                key={col.key || "actions"}
                                                className="font-semibold text-gray-700 cursor-pointer select-none whitespace-nowrap"
                                                onClick={() => col.key && handleSort(col.key)}
                                            >
                                                <div className="flex items-center">
                                                    {col.label}
                                                    {col.key && getSortIcon(col.key)}
                                                </div>
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>

                                <TableBody>
                                    {paginatedInventory.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                                                {searchQuery ? "No inventory found matching your search." : "No inventory items found. Add your first inventory item!"}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        paginatedInventory.flatMap((inv) => {
                                            if (!inv.products || inv.products.length === 0) {
                                                return (
                                                    <TableRow key={`inv-${inv.id}`}>
                                                        <TableCell colSpan={2} className="text-gray-400">No products</TableCell>
                                                        <TableCell>{inv.status || "N/A"}</TableCell>
                                                        <TableCell>{inv.duration || "N/A"}</TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-1">
                                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-blue-600" onClick={() => openViewPanel(inv.id!)} title="View"><Eye className="h-4 w-4" /></Button>
                                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-amber-600" onClick={() => openPanel(inv)} title="Edit"><Pencil className="h-4 w-4" /></Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            }

                                            return inv.products.map((product, index) => {
                                                const pd = products.find((p) => p.id === product.productId);
                                                const vendorName = vendors.find((v) => v.id === inv.vendorId)?.vendorName || "N/A";
                                                return (
                                                    <TableRow key={`${inv.id}-${product.productId}-${index}`}>
                                                        <TableCell className="font-medium text-gray-900">{pd?.productName || "N/A"}</TableCell>
                                                        <TableCell className="text-sm text-gray-700">{vendorName}</TableCell>
                                                        <TableCell>
                                                            <Badge variant="secondary">{inv.status || "N/A"}</Badge>
                                                        </TableCell>
                                                        <TableCell className="text-sm text-gray-700">{inv.duration || "N/A"}</TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-1">
                                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800" onClick={() => openViewPanel(inv.id!)} title="View"><Eye className="h-4 w-4" /></Button>
                                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-amber-600 hover:text-amber-800" onClick={() => openPanel(inv)} title="Edit"><Pencil className="h-4 w-4" /></Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            });
                                        })
                                    )}
                                </TableBody>
                            </Table>

                            {/* Pagination */}
                            {filteredInventory.length > 0 && (
                                <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200 bg-gray-50/50">
                                    <span className="text-sm text-gray-600">
                                        Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredInventory.length)} of {filteredInventory.length}
                                    </span>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>
                                            <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0}>
                                            Next <ChevronRight className="h-4 w-4 ml-1" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ── View Details Panel ── */}
                <SlideFormPanel title="Inventory Details" description={selectedInventory ? `Invoice: ${selectedInventory.purchaseInvoice}` : ""} isOpen={isViewOpen} onClose={() => { setIsViewOpen(false); setSelectedInventory(null); }}>
                    {selectedInventory && (
                        <div className="space-y-6">
                            <div>
                                <h4 className="text-sm font-semibold text-gray-900 mb-3">Inventory Information</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {[
                                        ["Purchase Invoice", selectedInventory.purchaseInvoice],
                                        ["Purchase Date", selectedInventory.purchaseDate ? new Date(selectedInventory.purchaseDate).toLocaleDateString() : "N/A"],
                                        ["Vendor", vendors.find(v => v.id === selectedInventory.vendorId)?.vendorName || "N/A"],
                                        ["Credit Terms", `${selectedInventory.creditTerms || "N/A"} days`],
                                        ["Due Date", selectedInventory.dueDate ? new Date(selectedInventory.dueDate).toLocaleDateString() : "N/A"],
                                        ["Status", selectedInventory.status || "N/A"],
                                        ["Net Amount", `₹${selectedInventory.invoiceNetAmount || "0.00"}`],
                                        ["GST Amount", `₹${selectedInventory.gstAmount || "0.00"}`],
                                        ["Gross Amount", `₹${selectedInventory.invoiceGrossAmount || "0.00"}`],
                                    ].map(([label, value]) => (
                                        <div key={label as string} className="space-y-1">
                                            <span className="text-xs font-medium text-gray-500">{label}</span>
                                            <p className="text-sm font-semibold text-gray-800">{value}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Separator />

                            <div>
                                <h4 className="text-sm font-semibold text-gray-900 mb-3">Products ({selectedInventory.products?.length || 0})</h4>
                                {(!selectedInventory.products || selectedInventory.products.length === 0) ? (
                                    <p className="text-center text-gray-500 py-4 border rounded-lg">No products found</p>
                                ) : (
                                    <div className="space-y-4">
                                        {selectedInventory.products.map((product, index) => {
                                            const pd = products.find(p => p.id === product.productId);
                                            return (
                                                <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50/50">
                                                    <p className="font-medium text-gray-800 text-sm mb-1">Product {index + 1}: {pd?.productName || "N/A"}</p>
                                                    <p className="text-xs text-gray-500 mb-3">{pd?.category?.categoryName || ""} / {pd?.subCategory?.subCategoryName || ""}</p>
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                        {[
                                                            ["Code", pd?.productId], ["Make", product.make], ["Model", product.model],
                                                            ["Serial", (product as any).noSerialMac || (product as any).autoGenerateSerial ? "Auto" : product.serialNumber || "N/A"],
                                                            ["MAC", (product as any).noSerialMac || (product as any).autoGenerateSerial ? "Auto" : product.macAddress || "N/A"],
                                                            ["Warranty", `${product.warrantyPeriod || "N/A"} days`],
                                                            ["Rate", `₹${product.purchaseRate || "0"}`],
                                                            ["HSN", pd?.HSN], ["GST", `${pd?.gstRate || "N/A"}%`],
                                                        ].map(([k, v]) => (
                                                            <div key={k as string}><span className="text-xs text-gray-500">{k}</span><p className="text-sm font-medium text-gray-800">{v || "N/A"}</p></div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 border-t flex justify-end">
                                <Button variant="outline" onClick={() => { setIsViewOpen(false); setSelectedInventory(null); }}>Close</Button>
                            </div>
                        </div>
                    )}
                </SlideFormPanel>

                {/* ── Create / Edit Panel ── */}
                <SlideFormPanel title={formData.id ? "Edit Inventory" : "Add Inventory"} description={formData.id ? "Update the inventory record" : "Fill in inventory and product details"} isOpen={showPanel} onClose={() => { if (!saving) { setShowPanel(false); } }}>
                    <div className="space-y-6">
                        {errors.products && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-red-600 text-sm font-medium">{errors.products}</p>
                            </div>
                        )}

                        {/* Inventory Details */}
                        <div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-4 pb-2 border-b">Inventory Details</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label>Purchase Invoice No <span className="text-red-500">*</span></Label>
                                    <Input name="purchaseInvoice" placeholder="Enter invoice number" value={formData.purchaseInvoice} onChange={handleChange} className={errors.purchaseInvoice ? "border-red-500 focus-visible:ring-red-500" : ""} />
                                    {errors.purchaseInvoice && <p className="text-xs text-red-600">{errors.purchaseInvoice}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Purchase Date <span className="text-red-500">*</span></Label>
                                    <Input type="date" name="purchaseDate" value={formData.purchaseDate} onChange={handleChange} className={errors.purchaseDate ? "border-red-500 focus-visible:ring-red-500" : ""} />
                                    {errors.purchaseDate && <p className="text-xs text-red-600">{errors.purchaseDate}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Vendor <span className="text-red-500">*</span></Label>
                                    <VendorCombobox selectedValue={formData.vendorId} onSelect={(val) => { setFormData(prev => ({ ...prev, vendorId: val })); if (errors.vendorId) setErrors(prev => ({ ...prev, vendorId: "" })); }} placeholder="Select Vendor" />
                                    {errors.vendorId && <p className="text-xs text-red-600">{errors.vendorId}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Credit Terms (Days) <span className="text-red-500">*</span></Label>
                                    <Input name="creditTerms" placeholder="e.g. 30" value={formData.creditTerms} onChange={handleChange} className={errors.creditTerms ? "border-red-500 focus-visible:ring-red-500" : ""} />
                                    {errors.creditTerms && <p className="text-xs text-red-600">{errors.creditTerms}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Due Date</Label>
                                    <Input type="date" name="dueDate" value={formData.dueDate} readOnly className="bg-gray-50" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Net Amount <span className="text-red-500">*</span></Label>
                                    <Input name="invoiceNetAmount" placeholder="Enter net amount" value={formData.invoiceNetAmount} onChange={handleChange} className={errors.invoiceNetAmount ? "border-red-500 focus-visible:ring-red-500" : ""} />
                                    {errors.invoiceNetAmount && <p className="text-xs text-red-600">{errors.invoiceNetAmount}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <Label>GST Amount <span className="text-red-500">*</span></Label>
                                    <Input name="gstAmount" placeholder="Enter GST amount" value={formData.gstAmount} onChange={handleChange} className={errors.gstAmount ? "border-red-500 focus-visible:ring-red-500" : ""} />
                                    {errors.gstAmount && <p className="text-xs text-red-600">{errors.gstAmount}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Gross Amount</Label>
                                    <Input name="invoiceGrossAmount" placeholder="Auto-calculated" value={formData.invoiceGrossAmount} readOnly className="bg-gray-50" />
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Products Section */}
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="text-sm font-semibold text-gray-900">Products</h4>
                                <Button variant="outline" size="sm" onClick={addProductRow}><Plus className="h-4 w-4 mr-1" /> Add Product</Button>
                            </div>

                            {formData.products.length === 0 && (
                                <p className="text-center text-gray-400 py-6 border border-dashed rounded-lg text-sm">No products added yet. Click &quot;Add Product&quot; to begin.</p>
                            )}

                            {formData.products.map((product, index) => {
                                const selectedProduct = products.find(p => p.id === product.productId);
                                return (
                                    <div key={index} className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50/50">
                                        <div className="flex justify-between items-center mb-3">
                                            <div>
                                                <span className="text-sm font-medium text-gray-700">Product {index + 1}</span>
                                                {selectedProduct && (
                                                    <span className="text-xs text-gray-500 ml-2">{selectedProduct.category?.categoryName} / {selectedProduct.subCategory?.subCategoryName}</span>
                                                )}
                                            </div>
                                            {formData.products.length > 1 && (
                                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-700" onClick={() => removeProductRow(index)}><X className="h-4 w-4" /></Button>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                                            <input type="checkbox" checked={product.noSerialMac || false} onChange={(e) => { updateProductField(index, "noSerialMac", e.target.checked); if (e.target.checked) { updateProductField(index, "serialNumber", ""); updateProductField(index, "macAddress", ""); } }} className="h-3.5 w-3.5 rounded border-gray-300" id={`noSerial-${index}`} />
                                            <label htmlFor={`noSerial-${index}`} className="text-gray-700">No Serial/MAC Address</label>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            <div className="space-y-1.5">
                                                <Label className="text-xs">Product <span className="text-red-500">*</span></Label>
                                                <ProductCombobox selectedValue={product.productId} onSelect={(val) => updateProductField(index, 'productId', val)} placeholder="Select Product" />
                                                {productErrors[index]?.productId && <p className="text-xs text-red-600">{productErrors[index]?.productId}</p>}
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs">Make <span className="text-red-500">*</span></Label>
                                                <Input placeholder="Make" value={product.make} onChange={(e) => updateProductField(index, 'make', e.target.value)} className={productErrors[index]?.make ? "border-red-500" : ""} />
                                                {productErrors[index]?.make && <p className="text-xs text-red-600">{productErrors[index]?.make}</p>}
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs">Model <span className="text-red-500">*</span></Label>
                                                <Input placeholder="Model" value={product.model} onChange={(e) => updateProductField(index, 'model', e.target.value)} className={productErrors[index]?.model ? "border-red-500" : ""} />
                                                {productErrors[index]?.model && <p className="text-xs text-red-600">{productErrors[index]?.model}</p>}
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs">Serial Number</Label>
                                                <Input placeholder="Serial number" value={product.serialNumber || ""} onChange={(e) => updateProductField(index, 'serialNumber', e.target.value)} disabled={product.noSerialMac} className={`${product.noSerialMac ? "bg-gray-100" : ""} ${productErrors[index]?.serialNumber ? "border-red-500" : ""}`} />
                                                {productErrors[index]?.serialNumber && <p className="text-xs text-red-600">{productErrors[index]?.serialNumber}</p>}
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs">MAC Address</Label>
                                                <Input placeholder="MAC address" value={product.macAddress || ""} onChange={(e) => updateProductField(index, 'macAddress', e.target.value)} disabled={product.noSerialMac} className={`${product.noSerialMac ? "bg-gray-100" : ""} ${productErrors[index]?.macAddress ? "border-red-500" : ""}`} />
                                                {productErrors[index]?.macAddress && <p className="text-xs text-red-600">{productErrors[index]?.macAddress}</p>}
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs">Warranty (Days) <span className="text-red-500">*</span></Label>
                                                <Input placeholder="e.g. 365" value={product.warrantyPeriod} onChange={(e) => updateProductField(index, 'warrantyPeriod', e.target.value)} className={productErrors[index]?.warrantyPeriod ? "border-red-500" : ""} />
                                                {productErrors[index]?.warrantyPeriod && <p className="text-xs text-red-600">{productErrors[index]?.warrantyPeriod}</p>}
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs">Purchase Rate <span className="text-red-500">*</span></Label>
                                                <Input placeholder="₹" value={product.purchaseRate} onChange={(e) => updateProductField(index, 'purchaseRate', e.target.value)} className={productErrors[index]?.purchaseRate ? "border-red-500" : ""} />
                                                {productErrors[index]?.purchaseRate && <p className="text-xs text-red-600">{productErrors[index]?.purchaseRate}</p>}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Footer */}
                        <div className="pt-4 border-t flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setShowPanel(false)} disabled={saving}>Cancel</Button>
                            <Button onClick={handleSave} disabled={saving}>
                                {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{formData.id ? "Updating..." : "Creating..."}</> : formData.id ? "Update Inventory" : "Create Inventory"}
                            </Button>
                        </div>
                    </div>
                </SlideFormPanel>
            </div>
        </div>
    );
};

export default InventoryTable;
