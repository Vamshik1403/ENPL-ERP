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

type Vendor = {
  id: number;
  vendorName: string;
};

type Props = {
  selectedValue: number;
  onSelect: (value: number) => void;
  placeholder?: string;
};

export function VendorCombobox({
  selectedValue,
  onSelect,
  placeholder = "Search vendor...",
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [vendors, setVendors] = React.useState<Vendor[]>([]);
  const [input, setInput] = React.useState("");

  React.useEffect(() => {
    async function fetchVendors() {
      try {
        const res = await fetch("http://localhost:8000/vendors");
        const data = await res.json();
        setVendors(data);
      } catch (error) {
        console.error("Failed to fetch vendors:", error);
      }
    }
    fetchVendors();
  }, []);

  const selectedLabel = vendors.find((c) => c.id === selectedValue)?.vendorName;

  const filteredVendors =
    input.length > 0
      ? vendors.filter((c) =>
          c.vendorName.toLowerCase().includes(input.toLowerCase())
        )
      : [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[300px] text-black justify-between text-left font-medium bg-white border border-gray-300 shadow-sm hover:shadow-md rounded-lg px-4 py-2 text-black"
        >
          {selectedLabel || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 text-black shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] text-black p-0 mt-2 border border-gray-300 bg-white shadow-lg rounded-lg">
        <Command>
          <CommandInput
            placeholder="Type to search vendor..."
            value={input}
            onValueChange={setInput}
            className="px-3 py-2 text-sm text-black focus:outline-none"
          />
          <CommandList className="max-h-60 overflow-y-auto">
            {input.length === 0 ? (
              <div className="p-3 text-sm text-black">
                Start typing to see suggestions...
              </div>
            ) : filteredVendors.length === 0 ? (
              <CommandEmpty>No vendors found.</CommandEmpty>
            ) : (
              <CommandGroup>
                {filteredVendors.map((vendor) => (
                  <CommandItem
                    key={vendor.id}
                    value={vendor.vendorName}
                    onSelect={() => {
                      onSelect(vendor.id);
                      setOpen(false);
                      setInput(""); // reset search input
                    }}
                    className="flex items-center text-black px-3 py-2 hover:bg-blue-100 cursor-pointer rounded-md transition-all"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 text-green-500",
                        selectedValue === vendor.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="font-medium">{vendor.vendorName}</span>
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
