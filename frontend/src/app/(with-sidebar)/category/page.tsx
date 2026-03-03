import React from 'react';
import CategoryTable from './CategoryTable';

export default function Category() {
  return (
    <main className="flex-1 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Product Categories</h1>
        <p className="text-sm text-gray-500 mt-1">Manage product categories and their details</p>
      </div>
      <CategoryTable />
    </main>
  );
}
