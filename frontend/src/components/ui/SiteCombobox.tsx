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

type Site = {
  id: number;
  siteName: string;
};

type Props = {
  selectedValue: number;
  onSelect: (value: number) => void;
  placeholder?: string;
};

export default function SiteCombobox({
  selectedValue,
  onSelect,
  placeholder = "Search site...",
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [sites, setProducts] = React.useState<Site[]>([]);
  const [input, setInput] = React.useState("");

  React.useEffect(() => {
    async function fetchSites() {
      try {
        const res = await fetch("http://localhost:8000/sites");
        const data = await res.json();
        setProducts(data);
      } catch (error) {
        console.error("Failed to fetch sites:", error);
      }
    }
    fetchSites();
  }, []);

  const selectedLabel = sites.find((p) => p.id === selectedValue)?.siteName;

  const filteredProducts =
    input.length > 0
      ? sites.filter((p) =>
          p.siteName.toLowerCase().includes(input.toLowerCase())
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
      <PopoverContent className="w-[300px] p-0 mt-2 border border-gray-300 bg-white shadow-lg rounded-lg">
        <Command>
          <CommandInput
            placeholder="Type to search site..."
            value={input}
            onValueChange={setInput}
            className="px-3 py-2 text-sm focus:outline-none"
          />
          <CommandList className="max-h-60 overflow-y-auto">
            {input.length === 0 ? (
              <div className="p-3 text-sm text-gray-500">
                Start typing to see suggestions...
              </div>
            ) : filteredProducts.length === 0 ? (
              <CommandEmpty>No sites found.</CommandEmpty>
            ) : (
              <CommandGroup>
                {filteredProducts.map((site) => (
                  <CommandItem
                    key={site.id}
                    value={site.siteName}
                    onSelect={() => {
                      onSelect(site.id);
                      setOpen(false);
                      setInput(""); // reset search input
                    }}
                    className="flex items-center px-3 py-2 hover:bg-blue-100 cursor-pointer rounded-md transition-all"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 text-green-500",
                        selectedValue === site.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="font-medium">{site.siteName}</span>
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
