"use client";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DialogFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  isPending: boolean;
  formId: string;
  children: React.ReactNode;
  isEditMode: boolean;
}

export function DialogForm({
  open,
  onOpenChange,
  title,
  isPending,
  formId,
  isEditMode,
  children,
}: DialogFormProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-125">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? `Update ${title}` : `Create ${title}`}
          </DialogTitle>
          {isEditMode
            ? `Change the details below to update the ${title}.`
            : `Fill in the details below to create a new ${title}.`}
        </DialogHeader>

        {children}

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isPending}>
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" form={formId} disabled={isPending}>
            {isPending ? "Saving..." : isEditMode ? "Update" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
