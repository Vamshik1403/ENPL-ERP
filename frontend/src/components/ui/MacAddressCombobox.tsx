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

type MacAddress = {
  id: number;
  macAddress: string;
};

type Props = {
  selectedValue: number;
  onSelect: (value: number) => void;
  placeholder?: string;
  onInputChange?: (value: string) => void;
};

export default function MacAddressCombobox({
  selectedValue,
  onSelect,
  placeholder = "Search MAC address...",
  onInputChange,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [macAddressList, setMacAddressList] = React.useState<MacAddress[]>([]);
  const [input, setInput] = React.useState("");

  React.useEffect(() => {
    async function fetchMacAddressNumbers() {
      try {
        const res = await fetch("http://localhost:8000/inventory");
        const data = await res.json();

        console.log("Fetched inventory data:", data); // Debug fetch

        const flattened: MacAddress[] = data.flatMap((inv: any) =>
          Array.isArray(inv.products)
            ? inv.products.map((p: any) => ({
                id: p.id,
                macAddress: p.macAddress,
              }))
            : []
        );

        console.log("Flattened MAC address list:", flattened); // Debug flattening
        setMacAddressList(flattened);
      } catch (error) {
        console.error("Failed to fetch MAC addresses:", error);
      }
    }

    fetchMacAddressNumbers();
  }, []);

  const selectedLabel = macAddressList.find((p) => p.id === selectedValue)?.macAddress;

  const filteredMacAddressNumbers =
    input.length > 0
      ? macAddressList.filter((p) =>
          p.macAddress?.toLowerCase().includes(input.toLowerCase()) // Optional chaining here
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
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] text-black p-0 mt-2 border border-gray-300 bg-white shadow-lg rounded-lg">
        <Command>
          <CommandInput
            placeholder="Type to search MAC address..."
            value={input}
            onValueChange={(value) => {
              setInput(value);
              onInputChange?.(value); 
            }}
            className="px-3 py-2 text-sm text-black focus:outline-none"
          />
          <CommandList className="max-h-60 text-black overflow-y-auto">
            {input.length === 0 ? (
              <div className="p-3 text-sm text-black">
                Start typing to see suggestions...
              </div>
            ) : filteredMacAddressNumbers.length === 0 ? (
              <CommandEmpty>No MAC addresses found.</CommandEmpty>
            ) : (
              <CommandGroup>
                {filteredMacAddressNumbers.map((macAddress) => (
                  <CommandItem
                    key={macAddress.id}
                    value={macAddress.macAddress}
                    onSelect={() => {
                      onSelect(macAddress.id);
                      setOpen(false);
                      setInput(""); // Clear search input after selection
                    }}
                    className="flex items-center px-3 py-2 text-black hover:bg-blue-100 cursor-pointer rounded-md transition-all"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 text-green-500",
                        selectedValue === macAddress.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="font-medium">{macAddress.macAddress}</span>
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
