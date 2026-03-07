"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Plus, Pencil, Trash2, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import SlideFormPanel from "@/components/ui/SlideFormPanel";
import { useToast } from "@/components/ui/toaster";

interface SubCategory {
  id: number;
  subCategoryName: string;
}

interface Category {
  id: number;
  categoryName: string;
  categoryId: string;
  subCategories: SubCategory[];
}

const CategoryTable: React.FC = () => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Category;
    direction: "asc" | "desc";
  } | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [formData, setFormData] = useState({
    categoryName: "",
    categoryId: "",
    subCategories: [{ subCategoryName: "" }],
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const fetchCategories = async () => {
    try {
      const response = await axios.get("https://enplerp.electrohelps.in/backend/category");
      setCategories(response.data.reverse());
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      try {
        await axios.delete(`https://enplerp.electrohelps.in/backend/category/${id}`);
        toast({ title: "Category deleted successfully!", variant: "success" });
        fetchCategories();
      } catch (error) {
        console.error("Error deleting category:", error);
        toast({
          title: "Failed to delete category",
          description: "Ensure there are no dependent entries.",
          variant: "error",
        });
      }
    }
  };

  const handleCreate = async () => {
    const { categoryName } = formData;

    if (!categoryName) {
      toast({ title: "Please fill in all required fields", variant: "warning" });
      return;
    }

    try {
      await axios.post("https://enplerp.electrohelps.in/backend/category", {
        categoryName: formData.categoryName,
        categoryId: formData.categoryId,
        subCategories: formData.subCategories,
      });
      toast({ title: "Category created successfully!", variant: "success" });
      setIsCreateModalOpen(false);
      fetchCategories();
    } catch (error) {
      console.error("Error creating category:", error);
    }
  };

  const handleUpdate = async () => {
    if (!selectedCategory) return;

    try {
      await axios.put(`https://enplerp.electrohelps.in/backend/category/${selectedCategory.id}`, {
        categoryName: formData.categoryName,
        categoryId: String(formData.categoryId),
        subCategories: formData.subCategories,
      });
      toast({ title: "Category updated successfully!", variant: "success" });
      setIsUpdateModalOpen(false);
      fetchCategories();
    } catch (error) {
      console.error("Error updating category:", error);
      toast({ title: "Failed to update category", variant: "error" });
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const filteredCategories = categories.filter(
    (category) =>
      category.categoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.categoryId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.subCategories.some((subCategory) =>
        subCategory.subCategoryName
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      )
  );

  const sortedCategories = [...filteredCategories].sort((a, b) => {
    if (!sortConfig) return 0;
    const key = sortConfig.key;
    const direction = sortConfig.direction === "asc" ? 1 : -1;
    return a[key].toString().localeCompare(b[key].toString()) * direction;
  });

  const requestSort = (key: keyof Category) => {
    let direction: "asc" | "desc" = "asc";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const totalPages = Math.ceil(sortedCategories.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCategories = sortedCategories.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className="w-full">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <Button
          onClick={() => {
            setIsCreateModalOpen(true);
            setFormData({
              categoryName: "",
              categoryId: "",
              subCategories: [{ subCategoryName: "" }],
            });
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
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
                  className="cursor-pointer select-none whitespace-nowrap"
                  onClick={() => requestSort("categoryId")}
                >
                  Category ID{" "}
                  {sortConfig?.key === "categoryId"
                    ? sortConfig.direction === "asc"
                      ? "↑"
                      : "↓"
                    : "↕"}
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none whitespace-nowrap"
                  onClick={() => requestSort("categoryName")}
                >
                  Category Name{" "}
                  {sortConfig?.key === "categoryName"
                    ? sortConfig.direction === "asc"
                      ? "↑"
                      : "↓"
                    : "↕"}
                </TableHead>
                <TableHead className="text-right whitespace-nowrap">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentCategories.length > 0 ? (
                currentCategories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant="secondary">{category.categoryId}</Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-medium">
                      {category.categoryName}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center gap-1">
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          title="Edit"
                          onClick={() => {
                            setSelectedCategory(category);
                            setFormData({
                              categoryName: category.categoryName,
                              categoryId: category.categoryId,
                              subCategories: category.subCategories.map(
                                (sub) => ({
                                  subCategoryName: sub.subCategoryName,
                                })
                              ),
                            });
                            setIsUpdateModalOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4 text-gray-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          title="Delete"
                          onClick={() => handleDelete(category.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center text-gray-500 py-8"
                  >
                    No categories available.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
          <span>
            Showing {indexOfFirstItem + 1}–
            {Math.min(indexOfLastItem, sortedCategories.length)} of{" "}
            {sortedCategories.length}
          </span>
          <div className="flex items-center gap-1">
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
        </div>
      )}

      {/* Create Panel */}
      <SlideFormPanel
        title="Add Product Category"
        description="Create a new product category"
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="create-categoryId">Category ID</Label>
            <Input
              id="create-categoryId"
              type="text"
              value={formData.categoryId}
              onChange={(e) =>
                setFormData({ ...formData, categoryId: e.target.value })
              }
              placeholder="Enter category ID"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-categoryName">Category Name <span className="text-red-500">*</span></Label>
            <Input
              id="create-categoryName"
              type="text"
              value={formData.categoryName}
              onChange={(e) =>
                setFormData({ ...formData, categoryName: e.target.value })
              }
              placeholder="Enter category name"
            />
          </div>
          <Separator />
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create</Button>
          </div>
        </div>
      </SlideFormPanel>

      {/* Update Panel */}
      <SlideFormPanel
        title="Edit Category"
        description="Update category details"
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-categoryId">Category ID</Label>
            <Input
              id="edit-categoryId"
              type="text"
              value={formData.categoryId}
              onChange={(e) =>
                setFormData({ ...formData, categoryId: e.target.value })
              }
              placeholder="Enter category ID"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-categoryName">Category Name <span className="text-red-500">*</span></Label>
            <Input
              id="edit-categoryName"
              type="text"
              value={formData.categoryName}
              onChange={(e) =>
                setFormData({ ...formData, categoryName: e.target.value })
              }
              placeholder="Enter category name"
            />
          </div>
          <Separator />
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsUpdateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Update</Button>
          </div>
        </div>
      </SlideFormPanel>
    </div>
  );
};

export default CategoryTable;