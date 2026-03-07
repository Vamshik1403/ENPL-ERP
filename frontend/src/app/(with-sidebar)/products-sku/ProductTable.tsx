"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import Papa from "papaparse";
import { Plus, Pencil, Trash2, Search, Loader2, ChevronLeft, ChevronRight, Download, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import SlideFormPanel from '@/components/ui/SlideFormPanel';
import { useToast } from '@/components/ui/toaster';
import CategoryCombobox from "@/components/ui/CategoryCombobox";

interface Product {
  id: string;
  productId: string;
  productName: string;
  productDescription: string;
  HSN: string;
  unit: string;
  gstRate: string;
  categoryId: number;
  subCategoryId: string;
}

interface Category {
  id: number;
  categoryName: string;
  subCategoryName: string;
  subCategories?: { id: number; subCategoryName: string }[];
}

const ProductTable: React.FC = () => {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<Category[]>([]);
  const [sortField, setSortField] = useState<keyof Product | "category" | "subCategory">("productName");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const itemsPerPage = 8;

  // Create form state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createForm, setCreateForm] = useState({
    productName: "",
    productDescription: "",
    HSN: "",
    unit: "",
    gstRate: "",
    categoryId: "",
    subCategoryId: "",
  });
  const [createSubCategories, setCreateSubCategories] = useState<{ id: number; subCategoryName: string }[]>([]);
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});

  // Update form state
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateFetching, setUpdateFetching] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [updateForm, setUpdateForm] = useState({
    productName: "",
    productDescription: "",
    HSN: "",
    unit: "",
    gstRate: "",
    categoryId: "",
    subCategoryId: "",
  });
  const [updateSubCategories, setUpdateSubCategories] = useState<{ id: number; subCategoryName: string }[]>([]);
  const [updateErrors, setUpdateErrors] = useState<Record<string, string>>({});

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get("https://enplerp.electrohelps.in/backend/products");
      setProducts(response.data.reverse());
    } catch (error) {
      console.error("Error fetching products:", error);
      toast({ title: "Failed to load products", description: "Please refresh the page.", variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get("https://enplerp.electrohelps.in/backend/category");
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchSubCategories = async () => {
    try {
      const response = await axios.get("https://enplerp.electrohelps.in/backend/subcategory");
      setSubCategories(response.data);
    } catch (error) {
      console.error("Error fetching subcategories:", error);
    }
  };

  const handleDownloadCSV = () => {
    if (products.length === 0) {
      toast({ title: "No products to download", variant: "warning" });
      return;
    }

    try {
      const csv = Papa.unparse(
        products.map(
          ({
            id,
            productId,
            productName,
            productDescription,
            HSN,
            unit,
            gstRate,
            categoryId,
            subCategoryId,
          }) => ({
            ID: id,
            ProductID: productId,
            ProductName: productName,
            ProductDescription: productDescription,
            HSN,
            Unit: unit,
            GST_Rate: gstRate,
            Category: getCategoryName(categoryId),
            SubCategory: getSubCategoryName(subCategoryId),
          })
        )
      );

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.setAttribute("download", `products_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: "CSV downloaded successfully!", variant: "success" });
    } catch (error) {
      console.error("Error downloading CSV:", error);
      toast({ title: "Failed to download CSV", description: "Please try again.", variant: "error" });
    }
  };

  const handleEdit = (product: Product) => {
    setSelectedProductId(product.id);
    setUpdateFetching(true);
    setIsUpdateOpen(true);

    // Fetch fresh product data
    axios.get(`https://enplerp.electrohelps.in/backend/products/${product.id}`)
      .then((response) => {
        const productData = response.data;
        setUpdateForm({
          productName: productData.productName || "",
          productDescription: productData.productDescription || "",
          HSN: productData.HSN || "",
          gstRate: productData.gstRate?.toString() || "",
          unit: productData.unit?.toString() || "",
          categoryId: productData.categoryId?.toString() || "",
          subCategoryId: productData.subCategoryId?.toString() || "",
        });
        // Load subcategories for this category
        const category = categories.find((cat) => cat.id.toString() === productData.categoryId?.toString());
        setUpdateSubCategories(category?.subCategories || []);
      })
      .catch((error) => {
        console.error("Error fetching product data:", error);
        toast({ title: "Failed to load product data", description: "Please try again.", variant: "error" });
      })
      .finally(() => {
        setUpdateFetching(false);
      });
  };

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this product? This action cannot be undone."
    );
    if (!confirmDelete) return;

    try {
      await axios.delete(`https://enplerp.electrohelps.in/backend/products/${id}`);
      toast({ title: "Product deleted successfully!", variant: "success" });
      fetchProducts();
    } catch (error: any) {
      console.error("Error deleting product:", error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          "Failed to delete product. Please try again.";
      toast({ title: errorMessage, variant: "error" });
    }
  };

  const getCategoryName = (id: number): string => {
    const category = categories.find((cat) => cat.id === id);
    return category ? category.categoryName : "Unknown";
  };

  const getSubCategoryName = (id: string): string => {
    const subCategory = subCategories.find(
      (subCat) => subCat.id === Number(id)
    );
    return subCategory ? subCategory.subCategoryName : "Unknown";
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchSubCategories();
  }, []);

  const filteredProducts = products.filter((product) =>
    product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.productId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.productDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getCategoryName(product.categoryId).toLowerCase().includes(searchTerm.toLowerCase()) ||
    getSubCategoryName(product.subCategoryId).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    let aField: string | number = a[sortField as keyof Product] ?? "";
    let bField: string | number = b[sortField as keyof Product] ?? "";

    if (sortField === "category") {
      aField = getCategoryName(a.categoryId);
      bField = getCategoryName(b.categoryId);
    }

    if (sortField === "subCategory") {
      aField = getSubCategoryName(a.subCategoryId);
      bField = getSubCategoryName(b.subCategoryId);
    }

    const result =
      typeof aField === "string"
        ? aField.localeCompare(String(bField))
        : (aField as number) - (bField as number);

    return sortOrder === "asc" ? result : -result;
  });

  const indexOfLastUser = currentPage * itemsPerPage;
  const indexOfFirstUser = indexOfLastUser - itemsPerPage;
  const currentProducts = sortedProducts.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const handleSort = (field: keyof Product | "category" | "subCategory") => {
    if (field === sortField) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const getSortIcon = (field: keyof Product | "category" | "subCategory") => {
    if (sortField !== field) return <ArrowUpDown className="ml-1 h-3.5 w-3.5 text-gray-400" />;
    return sortOrder === "asc" ?
      <ArrowUp className="ml-1 h-3.5 w-3.5 text-indigo-600" /> :
      <ArrowDown className="ml-1 h-3.5 w-3.5 text-indigo-600" />;
  };

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // --- Create form helpers ---
  const getCreateSubCategories = (catId: string) => {
    const category = categories.find((cat) => cat.id.toString() === catId);
    const validSubs = category
      ? (category.subCategories || []).filter(
          (sub) => sub.subCategoryName && sub.subCategoryName.trim() !== ""
        )
      : [];
    setCreateSubCategories(validSubs);
  };

  const validateCreateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!createForm.productName.trim()) newErrors.productName = "Product name is required";
    if (!createForm.categoryId) newErrors.categoryId = "Category is required";
    if (!createForm.subCategoryId) newErrors.subCategoryId = "Subcategory is required";
    setCreateErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCreateForm()) {
      toast({ title: "Please fix the errors in the form before submitting", variant: "warning" });
      return;
    }
    try {
      setCreateLoading(true);
      const newProduct = {
        productName: createForm.productName,
        productDescription: createForm.productDescription,
        HSN: createForm.HSN,
        unit: createForm.unit,
        gstRate: createForm.gstRate.toString(),
        categoryId: parseInt(createForm.categoryId, 10),
        subCategoryId: parseInt(createForm.subCategoryId, 10),
      };
      await axios.post("https://enplerp.electrohelps.in/backend/products", newProduct);
      fetchProducts();
      toast({ title: "Product created successfully!", variant: "success" });
      resetCreateForm();
      setIsCreateOpen(false);
    } catch (error: any) {
      console.error("Error creating product:", error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || "Failed to create product. Please try again.";
      toast({ title: errorMessage, variant: "error" });
    } finally {
      setCreateLoading(false);
    }
  };

  const resetCreateForm = () => {
    setCreateForm({ productName: "", productDescription: "", HSN: "", unit: "", gstRate: "", categoryId: "", subCategoryId: "" });
    setCreateSubCategories([]);
    setCreateErrors({});
  };

  const clearCreateError = (field: string) => {
    if (createErrors[field]) setCreateErrors((prev) => ({ ...prev, [field]: "" }));
  };

  // --- Update form helpers ---
  const getUpdateSubCategories = (catId: string) => {
    const category = categories.find((cat) => cat.id.toString() === catId);
    setUpdateSubCategories(category?.subCategories || []);
  };

  const validateUpdateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!updateForm.categoryId) newErrors.categoryId = "Category is required";
    if (!updateForm.subCategoryId) newErrors.subCategoryId = "Subcategory is required";
    setUpdateErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateUpdateForm()) {
      toast({ title: "Please fix the errors in the form before submitting", variant: "warning" });
      return;
    }
    try {
      setUpdateLoading(true);
      const updatedProduct = {
        productName: updateForm.productName,
        productDescription: updateForm.productDescription,
        HSN: updateForm.HSN,
        unit: updateForm.unit,
        gstRate: updateForm.gstRate,
        categoryId: parseInt(updateForm.categoryId, 10),
        subCategoryId: parseInt(updateForm.subCategoryId, 10),
      };
      await axios.put(`https://enplerp.electrohelps.in/backend/products/${selectedProductId}`, updatedProduct);
      fetchProducts();
      toast({ title: "Product updated successfully!", variant: "success" });
      setIsUpdateOpen(false);
    } catch (error: any) {
      console.error("Error updating product:", error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || "Failed to update product. Please try again.";
      toast({ title: errorMessage, variant: "error" });
    } finally {
      setUpdateLoading(false);
    }
  };

  const clearUpdateError = (field: string) => {
    if (updateErrors[field]) setUpdateErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const selectClassName = "flex h-9 w-full rounded-md border border-gray-200 bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 text-gray-900";

  return (
    <div className="w-full">
      {/* Toolbar */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <Button onClick={() => { resetCreateForm(); setIsCreateOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, category, HSN..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-9"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleDownloadCSV}
            title="Download CSV"
            disabled={products.length === 0}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-white hover:bg-white">
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort("category")}>
                    <div className="flex items-center">Category{getSortIcon("category")}</div>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort("subCategory")}>
                    <div className="flex items-center">Sub Category{getSortIcon("subCategory")}</div>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort("productName")}>
                    <div className="flex items-center">Product Name{getSortIcon("productName")}</div>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort("productDescription")}>
                    <div className="flex items-center">Description{getSortIcon("productDescription")}</div>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort("HSN")}>
                    <div className="flex items-center">HSN{getSortIcon("HSN")}</div>
                  </TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>GST Rate</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-gray-500">
                      {searchTerm ? "No products found matching your search." : "No products available. Add your first product!"}
                    </TableCell>
                  </TableRow>
                ) : (
                  currentProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <Badge variant="secondary">{getCategoryName(product.categoryId)}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{getSubCategoryName(product.subCategoryId)}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{product.productName}</TableCell>
                      <TableCell className="text-gray-600 max-w-[200px] truncate">{product.productDescription}</TableCell>
                      <TableCell className="font-mono text-sm">{product.HSN}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{product.unit}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{product.gstRate}%</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-1">
                          <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => handleEdit(product)} title="Edit">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(product.id)} title="Delete">
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

          {/* Pagination */}
          {filteredProducts.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
              <p className="text-sm text-gray-500">
                Showing {indexOfFirstUser + 1} to {Math.min(indexOfLastUser, filteredProducts.length)} of {filteredProducts.length} products
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <span className="text-sm text-gray-700 px-2">
                  Page {currentPage} of {totalPages}
                </span>
                <Button variant="outline" size="sm" onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages}>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create Product Panel */}
      <SlideFormPanel
        title="Add New Product"
        description="Fill in the details to create a new product SKU"
        isOpen={isCreateOpen}
        onClose={() => { resetCreateForm(); setIsCreateOpen(false); }}
      >
        <form onSubmit={handleCreateSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category */}
            <div className="space-y-2">
              <Label>Category <span className="text-red-500">*</span></Label>
              <CategoryCombobox
                selectedValue={parseInt(createForm.categoryId) || 0}
                onSelect={(value) => {
                  const catId = value.toString();
                  setCreateForm((prev) => ({ ...prev, categoryId: catId, subCategoryId: "" }));
                  getCreateSubCategories(catId);
                  clearCreateError("categoryId");
                  clearCreateError("subCategoryId");
                }}
                placeholder="Select Category"
              />
              {createErrors.categoryId && <p className="text-sm text-red-600">{createErrors.categoryId}</p>}
            </div>

            {/* Subcategory */}
            <div className="space-y-2">
              <Label>Subcategory <span className="text-red-500">*</span></Label>
              <select
                className={selectClassName}
                value={createForm.subCategoryId}
                onChange={(e) => {
                  setCreateForm((prev) => ({ ...prev, subCategoryId: e.target.value }));
                  clearCreateError("subCategoryId");
                }}
                disabled={!createForm.categoryId}
              >
                <option value="">Select Subcategory</option>
                {createSubCategories.map((sub) => (
                  <option key={sub.id} value={sub.id}>{sub.subCategoryName}</option>
                ))}
              </select>
              {createErrors.subCategoryId && <p className="text-sm text-red-600">{createErrors.subCategoryId}</p>}
              {!createForm.categoryId && <p className="text-sm text-gray-500">Please select a category first</p>}
            </div>

            {/* Product Name */}
            <div className="space-y-2">
              <Label>Product Name <span className="text-red-500">*</span></Label>
              <Input
                placeholder="Enter Product Name"
                value={createForm.productName}
                onChange={(e) => {
                  setCreateForm((prev) => ({ ...prev, productName: e.target.value }));
                  clearCreateError("productName");
                }}
              />
              {createErrors.productName && <p className="text-sm text-red-600">{createErrors.productName}</p>}
            </div>

            {/* Product Description */}
            <div className="space-y-2">
              <Label>Product Description</Label>
              <Input
                placeholder="Enter Product Description"
                value={createForm.productDescription}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, productDescription: e.target.value }))}
              />
            </div>

            {/* HSN Code */}
            <div className="space-y-2">
              <Label>HSN Code</Label>
              <Input
                placeholder="Enter HSN Code"
                value={createForm.HSN}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, HSN: e.target.value }))}
              />
            </div>

            {/* Unit */}
            <div className="space-y-2">
              <Label>Unit</Label>
              <select
                className={selectClassName}
                value={createForm.unit}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, unit: e.target.value }))}
              >
                <option value="">Select Unit</option>
                <option value="Nos">Nos</option>
                <option value="Box">Box</option>
                <option value="Pkt">Pkt</option>
                <option value="Mtrs">Mtrs</option>
                <option value="Months">Months</option>
                <option value="Years">Years</option>
              </select>
            </div>

            {/* GST Rate */}
            <div className="space-y-2">
              <Label>GST Rate (%)</Label>
              <Input
                placeholder="Enter GST Rate (e.g., 18)"
                value={createForm.gstRate}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, gstRate: e.target.value }))}
              />
            </div>
          </div>

          <Separator />

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => { resetCreateForm(); setIsCreateOpen(false); }} disabled={createLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={createLoading}>
              {createLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Add Product"
              )}
            </Button>
          </div>
        </form>
      </SlideFormPanel>

      {/* Update Product Panel */}
      <SlideFormPanel
        title="Update Product"
        description="Edit the product details below"
        isOpen={isUpdateOpen}
        onClose={() => { setUpdateErrors({}); setIsUpdateOpen(false); }}
      >
        {updateFetching ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <form onSubmit={handleUpdateSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Product Name */}
              <div className="space-y-2">
                <Label>Product Name <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="Enter Product Name"
                  value={updateForm.productName}
                  onChange={(e) => setUpdateForm((prev) => ({ ...prev, productName: e.target.value }))}
                />
              </div>

              {/* Product Description */}
              <div className="space-y-2">
                <Label>Product Description</Label>
                <Input
                  placeholder="Enter Product Description"
                  value={updateForm.productDescription}
                  onChange={(e) => setUpdateForm((prev) => ({ ...prev, productDescription: e.target.value }))}
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label>Category <span className="text-red-500">*</span></Label>
                <select
                  className={selectClassName}
                  value={updateForm.categoryId}
                  onChange={(e) => {
                    const catId = e.target.value;
                    setUpdateForm((prev) => ({ ...prev, categoryId: catId, subCategoryId: "" }));
                    getUpdateSubCategories(catId);
                    clearUpdateError("categoryId");
                    clearUpdateError("subCategoryId");
                  }}
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id.toString()}>{category.categoryName}</option>
                  ))}
                </select>
                {updateErrors.categoryId && <p className="text-sm text-red-600">{updateErrors.categoryId}</p>}
              </div>

              {/* Subcategory */}
              <div className="space-y-2">
                <Label>Subcategory <span className="text-red-500">*</span></Label>
                <select
                  className={selectClassName}
                  value={updateForm.subCategoryId}
                  onChange={(e) => {
                    setUpdateForm((prev) => ({ ...prev, subCategoryId: e.target.value }));
                    clearUpdateError("subCategoryId");
                  }}
                  disabled={!updateForm.categoryId}
                >
                  <option value="">Select Subcategory</option>
                  {updateSubCategories.map((sub) => (
                    <option key={sub.id} value={sub.id.toString()}>{sub.subCategoryName}</option>
                  ))}
                </select>
                {updateErrors.subCategoryId && <p className="text-sm text-red-600">{updateErrors.subCategoryId}</p>}
                {!updateForm.categoryId && <p className="text-sm text-gray-500">Please select a category first</p>}
              </div>

              {/* HSN Code */}
              <div className="space-y-2">
                <Label>HSN Code</Label>
                <Input
                  placeholder="Enter HSN Code"
                  value={updateForm.HSN}
                  onChange={(e) => setUpdateForm((prev) => ({ ...prev, HSN: e.target.value }))}
                />
              </div>

              {/* Unit */}
              <div className="space-y-2">
                <Label>Unit</Label>
                <select
                  className={selectClassName}
                  value={updateForm.unit}
                  onChange={(e) => setUpdateForm((prev) => ({ ...prev, unit: e.target.value }))}
                >
                  <option value="">Select Unit</option>
                  <option value="Nos">Nos</option>
                  <option value="Box">Box</option>
                  <option value="Pkt">Pkt</option>
                  <option value="Mtrs">Mtrs</option>
                  <option value="Months">Months</option>
                  <option value="Years">Years</option>
                </select>
              </div>

              {/* GST Rate */}
              <div className="space-y-2">
                <Label>GST Rate (%)</Label>
                <Input
                  placeholder="Enter GST Rate"
                  value={updateForm.gstRate}
                  onChange={(e) => setUpdateForm((prev) => ({ ...prev, gstRate: e.target.value }))}
                />
              </div>
            </div>

            <Separator />

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => { setUpdateErrors({}); setIsUpdateOpen(false); }} disabled={updateLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateLoading}>
                {updateLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Product"
                )}
              </Button>
            </div>
          </form>
        )}
      </SlideFormPanel>
    </div>
  );
};

export default ProductTable;