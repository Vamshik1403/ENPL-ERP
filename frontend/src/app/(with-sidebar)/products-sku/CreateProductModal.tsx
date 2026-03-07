import React, { useState, useEffect } from "react";
import axios from "axios";
import CategoryCombobox from "@/components/ui/CategoryCombobox";
import { useToast } from "@/components/ui/toaster";

interface CreateProductModalProps {
  show: boolean;
  onHide: () => void;
  fetchProducts: () => void;
}

const CreateProductModal: React.FC<CreateProductModalProps> = ({
  show,
  onHide,
  fetchProducts,
}) => {
  const { toast } = useToast();
  const [productName, setProductName] = useState<string>("");
  const [productDescription, setProductDescription] = useState<string>("");
  const [HSN, setHSN] = useState<string>("");
  const [unit, setUnit] = useState<string>("");
  const [gstRate, setGstRate] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [subCategoryId, setSubCategoryId] = useState<string>("");
  const [categories, setCategories] = useState<
    {
      id: number;
      categoryName: string;
      subCategories: { id: number; subCategoryName: string }[];
    }[]
  >([]);
  const [subCategories, setSubCategories] = useState<
    { id: number; subCategoryName: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get("https://enplerp.electrohelps.in/backend/category");
        setCategories(response.data);
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast({ title: "Failed to load categories", description: "Please refresh the page.", variant: "error" });
      }
    };
    fetchCategories();
  }, []);

  const fetchSubCategories = (categoryId: string) => {
    const category = categories.find((cat) => cat.id.toString() === categoryId);
    const validSubCategories = category
      ? category.subCategories.filter(
          (sub) => sub.subCategoryName && sub.subCategoryName.trim() !== ""
        )
      : [];
    setSubCategories(validSubCategories);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!productName.trim()) {
      newErrors.productName = "Product name is required";
    }
    
   


    if (!categoryId) {
      newErrors.categoryId = "Category is required";
    }
    
    if (!subCategoryId) {
      newErrors.subCategoryId = "Subcategory is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSubCategoryId(value);
    if (errors.subCategoryId) {
      setErrors(prev => ({ ...prev, subCategoryId: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({ title: "Please fix the errors in the form before submitting", variant: "warning" });
      return;
    }

    try {
      setLoading(true);
      const newProduct = {
        productName,
        productDescription,
        HSN,
        unit,
        gstRate: gstRate.toString(),
        categoryId: parseInt(categoryId, 10),
        subCategoryId: parseInt(subCategoryId, 10),
      };
      await axios.post("https://enplerp.electrohelps.in/backend/products", newProduct);
      fetchProducts();
      toast({ title: "Product created successfully!", variant: "success" });
      resetForm();
      onHide();
    } catch (error: any) {
      console.error("Error creating product:", error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          "Failed to create product. Please try again.";
      toast({ title: errorMessage, variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    resetForm();
    onHide();
  };

  const resetForm = () => {
    setProductName("");
    setProductDescription("");
    setHSN("");
    setUnit("");
    setGstRate("");
    setCategoryId("");
    setSubCategoryId("");
    setSubCategories([]);
    setErrors({});
  };

  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <div
      className={`fixed inset-0 bg-gray-600 bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 transition-opacity p-4 ${
        show
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl animate-fadeIn">
        <div className="p-6 md:p-8">
          <div className="flex justify-between items-center mb-6 pb-4 border-b">
            <h3 className="text-2xl font-bold text-indigo-700">
              Add New Product
            </h3>
            <button
              onClick={handleCancel}
              className="text-gray-500 hover:text-gray-700 text-2xl"
              disabled={loading}
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Category Section */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <CategoryCombobox
                    selectedValue={parseInt(categoryId) || 0}
                    onSelect={(value) => {
                      const selectedCategoryId = value.toString();
                      setCategoryId(selectedCategoryId);
                      fetchSubCategories(selectedCategoryId);
                      setSubCategoryId("");
                      clearError("categoryId");
                      clearError("subCategoryId");
                    }}
                    placeholder="Select Category"
                  />
                  {errors.categoryId && (
                    <p className="mt-1 text-sm text-red-600">{errors.categoryId}</p>
                  )}
                </div>
              </div>

              
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subcategory <span className="text-red-500">*</span>
                  </label>
                  <select
                    className={`w-full p-3 border ${errors.subCategoryId ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    value={subCategoryId}
                    onChange={handleSubCategoryChange}
                    disabled={!categoryId}
                  >
                    <option value="">Select Subcategory</option>
                    {subCategories.map((subCategory) => (
                      <option key={subCategory.id} value={subCategory.id}>
                        {subCategory.subCategoryName}
                      </option>
                    ))}
                  </select>
                  {errors.subCategoryId && (
                    <p className="mt-1 text-sm text-red-600">{errors.subCategoryId}</p>
                  )}
                  {!categoryId && (
                    <p className="mt-1 text-sm text-gray-500">Please select a category first</p>
                  )}
                </div>

              {/* Product Details Section */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className={`w-full p-3 border ${errors.productName ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    placeholder="Enter Product Name"
                    value={productName}
                    onChange={(e) => {
                      setProductName(e.target.value);
                      clearError("productName");
                    }}
                  />
                  {errors.productName && (
                    <p className="mt-1 text-sm text-red-600">{errors.productName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Description <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className={`w-full p-3 border ${errors.productDescription ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    placeholder="Enter Product Description"
                    value={productDescription}
                    onChange={(e) => {
                      setProductDescription(e.target.value);
                      clearError("productDescription");
                    }}
                  />
                  {errors.productDescription && (
                    <p className="mt-1 text-sm text-red-600">{errors.productDescription}</p>
                  )}
                </div>
              </div>

              {/* HSN & Unit Section */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    HSN Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className={`w-full p-3 border ${errors.HSN ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    placeholder="Enter HSN Code"
                    value={HSN}
                    onChange={(e) => {
                      setHSN(e.target.value);
                      clearError("HSN");
                    }}
                  />
                  {errors.HSN && (
                    <p className="mt-1 text-sm text-red-600">{errors.HSN}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit <span className="text-red-500">*</span>
                  </label>
                  <select
                    className={`w-full p-3 border ${errors.unit ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    value={unit}
                    onChange={(e) => {
                      setUnit(e.target.value);
                      clearError("unit");
                    }}
                  >
                    <option value="">Select Unit</option>
                    <option value="Nos">Nos</option>
                    <option value="Box">Box</option>
                    <option value="Pkt">Pkt</option>
                    <option value="Mtrs">Mtrs</option>
                    <option value="Months">Months</option>
                    <option value="Years">Years</option>
                  </select>
                  {errors.unit && (
                    <p className="mt-1 text-sm text-red-600">{errors.unit}</p>
                  )}
                </div>
              </div>

              {/* GST Rate Section */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    GST Rate (%) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className={`w-full p-3 border ${errors.gstRate ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    placeholder="Enter GST Rate (e.g., 18)"
                    value={gstRate}
                    onChange={(e) => {
                      setGstRate(e.target.value);
                      clearError("gstRate");
                    }}
                  />
                  {errors.gstRate && (
                    <p className="mt-1 text-sm text-red-600">{errors.gstRate}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transition-colors shadow-md flex items-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating...
                  </>
                ) : (
                  "Add Product"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateProductModal;