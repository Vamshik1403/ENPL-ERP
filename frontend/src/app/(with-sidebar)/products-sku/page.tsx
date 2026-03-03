import React from 'react';
import ProductTable from './ProductTable';

export default function Products() {
  return (
    <div className="flex h-screen">
      <main className="flex-1 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Products SKU</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your product catalog, categories, and SKU details</p>
        </div>
        <ProductTable />
      </main>
    </div>
  );
}
