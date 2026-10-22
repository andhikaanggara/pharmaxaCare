"use client";

import { useEffect, useState } from "react";
import { MessageCircle, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export function ReportReviewDialog({
  open,
  onOpenChange,
  title,
  text,
  warnings,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  text: string;
  warnings: string[];
}) {
  const [draft, setDraft] = useState(text);
  useEffect(() => {
    if (open) setDraft(text);
  }, [open, text]);

  const send = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(draft)}`, "_blank");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Review {title}</DialogTitle>
          <DialogDescription>
            Periksa dan ubah isi laporan sebelum dikirim.
          </DialogDescription>
        </DialogHeader>

        {warnings.length > 0 && (
          <ul className="space-y-1 rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm">
            {warnings.map((w) => (
              <li key={w} className="flex items-start gap-2">
                <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" />
                {w}
              </li>
            ))}
          </ul>
        )}

        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={14}
          className="font-mono text-sm"
        />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={send}>
            <MessageCircle className="size-4" />
            Kirim via WhatsApp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
