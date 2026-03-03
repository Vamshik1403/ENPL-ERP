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

type SerialNumber = {
  id: number;
  serialNumber: string;
};

type Props = {
  selectedValue: number;
  onSelect: (value: number) => void;
  placeholder?: string;
  onInputChange?: (value: string) => void;
};

export default function SerialNumberCombobox({
  selectedValue,
  onSelect,
  placeholder = "Search serial number...",
  onInputChange,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [serialNumbers, setSerialNumbers] = React.useState<SerialNumber[]>([]);
  const [input, setInput] = React.useState("");

React.useEffect(() => {
  async function fetchSerialNumbers() {
    try {
      const res = await fetch("http://localhost:8000/inventory");
      const data = await res.json();

      // Flatten all product serial numbers across inventory items
      const flattened: SerialNumber[] = data.flatMap((inv: any) =>
        inv.products.map((p: any) => ({
          id: p.id,
          serialNumber: p.serialNumber,
        }))
      );

      setSerialNumbers(flattened);
    } catch (error) {
      console.error("Failed to fetch serial numbers:", error);
    }
  }

  fetchSerialNumbers();
}, []);


  const selectedLabel = serialNumbers.find((p) => p.id === selectedValue)?.serialNumber;

  const filteredSerialNumbers =
  input.length > 0
    ? serialNumbers.filter((p) =>
        p.serialNumber?.toLowerCase().includes(input.toLowerCase()) // Add optional chaining here
      )
    : [];


  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[300px] justify-between text-left font-medium bg-white border border-gray-300 shadow-sm hover:shadow-md rounded-lg px-4 py-2 text-black"
        >
          {selectedLabel || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-black opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] text-black p-0 mt-2 border border-gray-300 bg-white shadow-lg rounded-lg">
        <Command>
          <CommandInput
            placeholder="Type to search serial number..."
            value={input}
            onValueChange={(value) => {
              setInput(value);
              onInputChange?.(value); // <- Call parent's onInputChange
            }}
            className="px-3 py-2 text-sm focus:outline-none text-black"
          />
          <CommandList className="max-h-60 overflow-y-auto">
            {input.length === 0 ? (
              <div className="p-3 text-sm text-black">
                Start typing to see suggestions...
              </div>
            ) : filteredSerialNumbers.length === 0 ? (
              <CommandEmpty>No serial numbers found.</CommandEmpty>
            ) : (
              <CommandGroup>
                {filteredSerialNumbers.map((serial) => (
                  <CommandItem
                    key={serial.id}
                    value={serial.serialNumber}
                    onSelect={() => {
                      onSelect(serial.id);
                      setOpen(false);
                      setInput(""); // Clear search input after selection
                    }}
                    className="flex items-center px-3 py-2 text-black hover:bg-blue-100 cursor-pointer rounded-md transition-all"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 text-green-500",
                        selectedValue === serial.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="font-medium">{serial.serialNumber}</span>
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
