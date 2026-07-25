"use client";

import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxList,
  ComboboxItem,
} from "@/components/ui/combobox";
import { Button } from "./ui/button";
import { Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface UserComboboxProps {
  id: string;
  value: string;
  items: Array<{ id: string; name: string }>;
  onChange: (value: string) => void;
  ariaInvalid: boolean;
  showAddButton?: boolean;
  onAddClick?: () => void;
}

export function UserCombobox({
  id,
  onChange,
  items,
  value,
  showAddButton = false,
  onAddClick,
  ariaInvalid,
}: UserComboboxProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const activeItem = useMemo(() => {
    return items?.find((item) => item.id === value);
  }, [value, items]);

  useEffect(() => {
    setSearchQuery(activeItem ? activeItem.name : "");
  }, [activeItem]);

  const filteredItems = useMemo(() => {
    const lowercasedQuery = searchQuery.trim().toLowerCase();

    if (!lowercasedQuery || activeItem?.name === searchQuery) {
      return items;
    }

    return items.filter((item) =>
      item.name.toLowerCase().includes(lowercasedQuery),
    );
  }, [searchQuery, items, activeItem]);

  return (
    <div className={showAddButton ? "grid grid-cols-8 gap-2 w-full" : "w-full"}>
      <Combobox items={filteredItems}>
        <ComboboxInput
          id={id}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-invalid={ariaInvalid}
          className="relative flex items-center col-span-7 w-full"
        />
        <ComboboxContent>
          <ComboboxEmpty>No items found.</ComboboxEmpty>
          <ComboboxList>
            {(item) => (
              <ComboboxItem
                key={item.id}
                value={item.name}
                onClick={() => {
                  onChange(item.id);
                }}
              >
                {item.name}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      {showAddButton && (
        <Button
          type="button"
          onClick={onAddClick}
          className="w-full h-full flex justify-center items-center"
        >
          <Plus className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
