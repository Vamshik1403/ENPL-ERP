import React from 'react';
import SubCategoryTable from './SubCategoryTable';

export default function SubCatgeory() {
  return (
    <div className="flex h-screen">
      <main className="flex-1 overflow-auto bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Product Subcategories</h1>
            <p className="text-sm text-gray-500 mt-1">Manage product subcategories and their category associations</p>
          </div>
          <SubCategoryTable />
        </div>
      </main>
    </div>
  );
}
