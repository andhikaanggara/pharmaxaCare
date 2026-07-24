"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTransition } from "react";
import { toast } from "sonner";

interface DeleteTarget {
  id: string;
  name: string;
}

interface ConfirmDeleteDialogProps {
  isOpen: boolean;
  entityName?: string;
  target: DeleteTarget | null;
  onOpenChange: (open: boolean) => void;
  onDeleteAction: (id: string) => Promise<{ ok?: boolean; error?: string }>;
}

export function ConfirmDeleteDialog({
  isOpen,
  entityName = "Data",
  target,
  onOpenChange,
  onDeleteAction,
}: ConfirmDeleteDialogProps) {
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    if (!target) return;

    startTransition(async () => {
      try {
        const result = await onDeleteAction(target.id);

        if (result?.error) {
          toast.error(result.error, { duration: 6000 });
        } else {
          toast.success(`${entityName} "${target.name}" successfully removed`);
          onOpenChange(false);
        }
      } catch (err) {
        toast.error("An unexpected error occurred.");
      }
    });
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{`Delete ${entityName} ?`}</AlertDialogTitle>
          <AlertDialogDescription>
            {entityName}{" "}
            <span className="font-medium text-foreground">
              {target?.name || "-"}
            </span>{" "}
            will be permanently deleted. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel className="cursor-pointer" disabled={isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            variant="destructive"
            className="cursor-pointer"
          >
            {isPending ? "Menghapus…" : "Hapus"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
