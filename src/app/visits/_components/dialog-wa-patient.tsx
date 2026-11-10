import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Check, Clipboard } from "lucide-react";
import { useState } from "react";

export function DialogWaPaient({
  open,
  onOpenChange,
  text,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  text: string[];
}) {
  const textValue = text.join("\n");

  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textValue);
      setCopied(true);

      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.log("gagal menyalin:", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nomor WA Pasien</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <Textarea value={textValue} readOnly className="min-h-50" />

          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleCopy}
              disabled={copied}
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Clipboard className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
