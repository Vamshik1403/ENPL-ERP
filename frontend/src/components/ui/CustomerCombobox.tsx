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

type Customer = {
  id: number;
  customerName: string;
};

type Props = {
  selectedValue: number;
  onSelect: (value: number) => void;
  placeholder?: string;
};

export function CustomerCombobox({
  selectedValue,
  onSelect,
  placeholder = "Search customer...",
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [input, setInput] = React.useState("");

  React.useEffect(() => {
    async function fetchCustomers() {
      try {
        const res = await fetch("http://localhost:8000/address-book");
const data = await res.json();

if (Array.isArray(data)) {
  setCustomers(data);
} else if (Array.isArray(data.customers)) {
  setCustomers(data.customers);
} else if (Array.isArray(data.data)) {
  setCustomers(data.data);
} else {
  console.error("Unexpected customers response shape:", data);
  setCustomers([]);
}
      } catch (error) {
        console.error("Failed to fetch customers:", error);
      }
    }
    fetchCustomers();
  }, []);

  const selectedLabel = customers.find((c) => c.id === selectedValue)?.customerName;

  const filteredCustomers =
    input.length > 0
      ? customers.filter((c) =>
          c.customerName.toLowerCase().includes(input.toLowerCase())
        )
      : [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[300px] justify-between text-black text-left font-medium bg-white border border-gray-300 shadow-sm hover:shadow-md rounded-lg px-4 py-2 text-black"
        >
          {selectedLabel || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 text-black shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 text-black  border border-gray-300 bg-white shadow-lg rounded-lg">
        <Command>
          <CommandInput
            placeholder="Type to search customer..."
            value={input}
            onValueChange={setInput}
            className="px-3 py-2 text-sm text-black focus:outline-none"
          />
          <CommandList className="max-h-60 text-black overflow-y-auto">
            {input.length === 0 ? (
              <div className="p-3 text-sm text-black">
                Start typing to see suggestions...
              </div>
            ) : filteredCustomers.length === 0 ? (
              <CommandEmpty>No customers found.</CommandEmpty>
            ) : (
              <CommandGroup>
                {filteredCustomers.map((customer) => (
                  <CommandItem
                    key={customer.id}
                    value={customer.customerName}
                    onSelect={() => {
                      onSelect(customer.id);
                      setOpen(false);
                      setInput(""); // reset search input
                    }}
                    className="flex items-center px-3 py-2 text-black hover:bg-blue-100 cursor-pointer rounded-md transition-all"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 text-green-500",
                        selectedValue === customer.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="font-medium">{customer.customerName}</span>
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
