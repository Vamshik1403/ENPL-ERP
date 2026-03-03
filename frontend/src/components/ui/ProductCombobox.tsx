"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "../../app/lib/utils"
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type Product = {
  id: number;
  productName: string;
};

type Props = {
  selectedValue: number;
  onSelect: (value: number) => void;
  placeholder?: string;
};

export function ProductCombobox({
  selectedValue,
  onSelect,
  placeholder = "Search product...",
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [input, setInput] = React.useState("");

  React.useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch("http://localhost:8000/products");
        const data = await res.json();
        setProducts(data);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      }
    }
    fetchProducts();
  }, []);

  const selectedLabel = products.find((p) => p.id === selectedValue)?.productName;

  const filteredProducts =
    input.length > 0
      ? products.filter((p) =>
          p.productName.toLowerCase().includes(input.toLowerCase())
        )
      : [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full min-w-0 justify-between text-black text-left font-medium bg-white border border-gray-300 shadow-sm hover:shadow-md rounded-lg px-4 py-2 text-black"
        >
          {selectedLabel || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-black opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] text-black p-0 mt-2 border border-gray-300 bg-white shadow-lg rounded-lg">
        <Command>
          <CommandInput
            placeholder="Type to search product..."
            value={input}
            onValueChange={setInput}
            className="px-3 py-2 text-sm text-black focus:outline-none"
          />
          <CommandList className="max-h-60 overflow-y-auto">
            {input.length === 0 ? (
              <div className="p-3 text-sm text-black">
                Start typing to see suggestions...
              </div>
            ) : filteredProducts.length === 0 ? (
              <CommandEmpty>No products found.</CommandEmpty>
            ) : (
              <CommandGroup>
                {filteredProducts.map((product) => (
                  <CommandItem
                    key={product.id}
                    value={product.productName}
                    onSelect={() => {
                      onSelect(product.id);
                      setOpen(false);
                      setInput(""); // reset search input
                    }}
                    className="flex items-center px-3 py-2 text-black hover:bg-blue-100 cursor-pointer rounded-md transition-all"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 text-green-500",
                        selectedValue === product.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="font-medium">{product.productName}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
