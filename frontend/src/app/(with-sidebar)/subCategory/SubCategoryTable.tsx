"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Plus, Pencil, Trash2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import SlideFormPanel from '@/components/ui/SlideFormPanel';
import { useToast } from '@/components/ui/toaster';

interface SubCategory {
  id: number;
  subCategoryName: string;
  subCategoryId: string;
  categoryId: number;
  category: Category;
}

interface Category {
  id: number;
  categoryId: string;
  categoryName: string;
}

const SubCategoryTable: React.FC = () => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setselectedCategoryId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: keyof SubCategory | null; direction: "asc" | "desc" }>({
    key: null,
    direction: "asc",
  });

  const [formData, setFormData] = useState({
    categoryId: 0,
    subCategoryName: "",
    subCategorySuffix: "",
    subCategoryId: "",
  });
  const [selectedSubCategory, setSelectedSubCategory] =
    useState<SubCategory | null>(null);

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

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
      const filteredSubCategories = response.data.filter(
        (subCategory: SubCategory) =>
          subCategory.category?.categoryName && subCategory.subCategoryName
      );
      setSubCategories(filteredSubCategories);
    } catch (error) {
      console.error("Error fetching subcategories:", error);
    }
  };

  const handleDelete = async (subCategoryId: number) => {
    if (window.confirm("Are you sure you want to delete this subcategory?")) {
      try {
        await axios.delete(
          `https://enplerp.electrohelps.in/backend/subcategory/${subCategoryId}`
        );
        toast({ title: "Subcategory deleted successfully!", variant: "success" });
        fetchSubCategories();
      } catch (error) {
        console.error("Error deleting subcategory:", error);
        toast({ title: "Failed to delete subcategory", variant: "error" });
      }
    }
  };

  const openCreateModal = () => {
    setSelectedSubCategory(null);
    setFormData({
      categoryId: 0,
      subCategoryName: "",
      subCategoryId: "",
      subCategorySuffix: "",
    });
    setIsCreateModalOpen(true);
  };

  const openUpdateModal = (subCategory: SubCategory) => {
    const fullId = subCategory.subCategoryId;
    const categoryCode = subCategory.category.categoryId;

    const suffix =
      fullId.startsWith(`${categoryCode}-`) &&
        fullId.length > categoryCode.length + 1
        ? fullId.slice(categoryCode.length + 1)
        : "";

    setSelectedSubCategory(subCategory);
    setFormData({
      categoryId: subCategory.category.id,
      subCategoryName: subCategory.subCategoryName,
      subCategoryId: subCategory.subCategoryId,
      subCategorySuffix: suffix,
    });
    setIsUpdateModalOpen(true);
  };

  const handleSubmit = async () => {
    const { categoryId, subCategoryName, subCategorySuffix } = formData;

    if (!categoryId || !subCategoryName) {
      toast({ title: "Please select a category and enter a subcategory name", variant: "warning" });
      return;
    }

    const selectedCategory = categories.find((c) => c.id === categoryId);
    const categoryCode = selectedCategory?.categoryId || "";
    const newSubCategoryId = `${categoryCode}-${subCategorySuffix}`;
    try {
      if (selectedSubCategory) {
        await axios.put(
          `https://enplerp.electrohelps.in/backend/subcategory/${selectedSubCategory.id}`,
          {
            categoryId,
            subCategoryName,
            subCategoryId: newSubCategoryId,
          }
        );
        toast({ title: "Subcategory updated successfully!", variant: "success" });
      } else {
        await axios.post("https://enplerp.electrohelps.in/backend/subcategory", {
          categoryId,
          subCategoryName,
          subCategoryId: newSubCategoryId,
        });
        toast({ title: "Subcategory created successfully!", variant: "success" });
      }

      fetchSubCategories();
      setIsCreateModalOpen(false);
      setIsUpdateModalOpen(false);
      setSelectedSubCategory(null);
      setFormData({
        categoryId: 0,
        subCategoryName: "",
        subCategoryId: "",
        subCategorySuffix: "",
      });
    } catch (error) {
      console.error("Error handling subcategory:", error);
      toast({ title: "Failed to create or update subcategory", variant: "error" });
    }
  };

  const closePanel = () => {
    setIsCreateModalOpen(false);
    setIsUpdateModalOpen(false);
    setSelectedSubCategory(null);
  };

  useEffect(() => {
    fetchCategories();
    fetchSubCategories();
  }, []);

  const handleSort = (key: keyof SubCategory) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const filteredCategories = subCategories
    .filter(
      (subCategory) =>
        subCategory.subCategoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subCategory.category.categoryName.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (!sortConfig.key) return 0;

      const getValue = (obj: SubCategory, key: keyof SubCategory) => {
        if (key === "category") return obj.category.categoryName.toLowerCase();
        return (obj[key] as string)?.toString().toLowerCase();
      };

      const aVal = getValue(a, sortConfig.key);
      const bVal = getValue(b, sortConfig.key);

      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const indexOfLastUser = currentPage * itemsPerPage;
  const indexOfFirstUser = indexOfLastUser - itemsPerPage;
  const currentSubcategories = filteredCategories.slice(
    indexOfFirstUser,
    indexOfLastUser
  );

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const SortIndicator = ({ columnKey }: { columnKey: keyof SubCategory }) => (
    <span className="ml-1 inline-flex flex-col leading-none text-[10px]">
      <span className={sortConfig.key === columnKey && sortConfig.direction === "asc" ? "text-indigo-600" : "text-gray-300"}>▲</span>
      <span className={sortConfig.key === columnKey && sortConfig.direction === "desc" ? "text-indigo-600" : "text-gray-300"}>▼</span>
    </span>
  );

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <Button onClick={openCreateModal} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Subcategory
        </Button>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search subcategories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-white hover:bg-white">
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort("subCategoryId")}
                >
                  Sub Category Id
                  <SortIndicator columnKey="subCategoryId" />
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort("category")}
                >
                  Category Name
                  <SortIndicator columnKey="category" />
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort("subCategoryName")}
                >
                  Sub Category Name
                  <SortIndicator columnKey="subCategoryName" />
                </TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentSubcategories.length > 0 ? (
                currentSubcategories.map((subCategory) => (
                  <TableRow key={subCategory.subCategoryId}>
                    <TableCell>
                      <Badge variant="secondary">{subCategory.subCategoryId}</Badge>
                    </TableCell>
                    <TableCell>{subCategory.category.categoryName}</TableCell>
                    <TableCell>{subCategory.subCategoryName}</TableCell>
                    <TableCell>
                      <div className="flex justify-center items-center gap-1">
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => openUpdateModal(subCategory)}
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4 text-gray-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => handleDelete(subCategory.id)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                    No subcategories available.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {[...Array(totalPages)].map((_, index) => (
            <Button
              key={index}
              variant={currentPage === index + 1 ? "default" : "outline"}
              size="sm"
              className="min-w-[2rem]"
              onClick={() => paginate(index + 1)}
            >
              {index + 1}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Slide Panel for Create/Update */}
      <SlideFormPanel
        isOpen={isCreateModalOpen || isUpdateModalOpen}
        onClose={closePanel}
        title={isUpdateModalOpen ? "Edit Subcategory" : "Add Subcategory"}
        description={isUpdateModalOpen ? "Update the subcategory details below" : "Fill in the details to create a new subcategory"}
      >
        <div className="space-y-5">
          {/* Category Select */}
          <div className="space-y-2">
            <Label>Category <span className="text-red-500">*</span></Label>
            <select
              value={formData.categoryId}
              onChange={(e) => {
                const selectedCategoryId = parseInt(e.target.value);
                const selectedCategory = categories.find(
                  (c) => c.id === selectedCategoryId
                );
                const categoryCode = selectedCategory?.categoryId || "";

                setFormData((prev) => ({
                  ...prev,
                  categoryId: selectedCategoryId,
                  subCategorySuffix: "",
                  subCategoryId: "",
                }));
              }}
              className="flex h-9 w-full rounded-md border border-gray-200 bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              required
            >
              <option value="0">Select Category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.categoryName}
                </option>
              ))}
            </select>
          </div>

          <Separator />

          {/* Subcategory Code (Suffix) */}
          <div className="space-y-2">
            <Label>Manual SubCategory Id <span className="text-red-500">*</span></Label>
            <Input
              type="text"
              placeholder="Enter suffix"
              value={formData.subCategorySuffix || ""}
              onChange={(e) => {
                const suffix = e.target.value.trim().toUpperCase();
                const selectedCategory = categories.find(
                  (c) => c.id === formData.categoryId
                );
                const categoryCode = selectedCategory?.categoryId || "";

                setFormData((prev) => ({
                  ...prev,
                  subCategorySuffix: suffix,
                  subCategoryId:
                    categoryCode && suffix
                      ? `${categoryCode}-${suffix}`
                      : "",
                }));
              }}
              required
            />
          </div>

          {/* Read-only Subcategory ID */}
          <div className="space-y-2">
            <Label>Generated Subcategory ID</Label>
            <Input
              type="text"
              value={formData.subCategoryId || ""}
              readOnly
              className="bg-gray-50 text-gray-600"
              placeholder="Auto-generated ID"
            />
          </div>

          {/* Subcategory Name */}
          <div className="space-y-2">
            <Label>Subcategory Name <span className="text-red-500">*</span></Label>
            <Input
              type="text"
              placeholder="Enter Subcategory Name"
              value={formData.subCategoryName || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  subCategoryName: e.target.value,
                }))
              }
              required
            />
          </div>

          <Separator />

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <Button onClick={handleSubmit} className="flex-1">
              {isUpdateModalOpen ? "Update Subcategory" : "Create Subcategory"}
            </Button>
            <Button variant="outline" onClick={closePanel} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </SlideFormPanel>
    </div>
  );
};

export default SubCategoryTable;
