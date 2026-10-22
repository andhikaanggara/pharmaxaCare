"use client";

import type { ComponentProps } from "react";
import { Input } from "@/components/ui/input";

const idNumber = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });

type CurrencyInputProps = Omit<
  ComponentProps<typeof Input>,
  "value" | "onChange" | "type"
> & {
  value?: number;
  onValueChange: (value: number | undefined) => void;
};

export function CurrencyInput({
  value,
  onValueChange,
  ...props
}: CurrencyInputProps) {
  return (
    <Input
      {...props}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      placeholder="Rp 0"
      value={value === undefined ? "" : `Rp ${idNumber.format(value)}`}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, "").slice(0, 12);
        onValueChange(digits === "" ? undefined : Number(digits));
      }}
    />
  );
}
