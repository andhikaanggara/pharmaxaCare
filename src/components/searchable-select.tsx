"use client";

import * as React from "react";
import { PlusIcon } from "lucide-react";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Button } from "./ui/button";

type SearchableSelectProps<T> = {
  items: T[];
  value?: string | null;
  onChange: (value: string) => void;
  getItemValue: (item: T) => string;
  getItemLabel: (item: T) => string;
  renderItem?: (item: T) => React.ReactNode;
  id?: string;
  placeholder?: string;
  emptyText?: string;
  disabled?: boolean;
  invalid?: boolean;
  onBlur?: () => void;
  onCreate?: (text: string) => void;
  createLabel?: (text: string) => string;
  clearable?: boolean;
};

export function SearchableSelect<T>({
  items,
  value,
  onChange,
  getItemValue,
  getItemLabel,
  renderItem,
  id,
  placeholder = "Cari...",
  emptyText = "Data tidak ditemukan.",
  disabled,
  invalid,
  onBlur,
  onCreate,
  createLabel,
  clearable,
}: SearchableSelectProps<T>) {
  const [query, setQuery] = React.useState("");
  const selected = items.find((item) => getItemValue(item) === value) ?? null;

  const text = query.trim();
  const canCreate =
    !!onCreate &&
    text.length >= 3 &&
    !items.some(
      (item) => getItemLabel(item).trim().toLowerCase() === text.toLowerCase(),
    );

  return (
    <Combobox
      items={items}
      value={selected}
      onValueChange={(item) => onChange(item ? getItemValue(item) : "")}
      onInputValueChange={(v) => setQuery(v)}
      itemToStringLabel={getItemLabel}
      itemToStringValue={getItemValue}
      isItemEqualToValue={(a, b) => getItemValue(a) === getItemValue(b)}
      disabled={disabled}
    >
      <ComboboxInput
        id={id}
        placeholder={placeholder}
        onBlur={onBlur}
        aria-invalid={invalid}
        showClear={clearable}
      />
      <ComboboxContent>
        <ComboboxEmpty className="flex-col items-center gap-2">
          {canCreate ? (
            <>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="max-w-full"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onCreate?.(text)}
              >
                <PlusIcon className="size-4 shrink-0" />
                <span className="truncate">
                  {createLabel ? createLabel(text) : `Tambah "${text}"`}
                </span>
              </Button>
            </>
          ) : (
            emptyText
          )}
        </ComboboxEmpty>
        <ComboboxList>
          {(item: T) => (
            <ComboboxItem key={getItemValue(item)} value={item}>
              {renderItem ? renderItem(item) : getItemLabel(item)}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
