import { useState } from "react";
import { Eye, EyeOff, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Props {
  label: string;
  value: string | null | undefined;
  /** Function to mask the value when hidden */
  mask?: (v: string) => string;
}

function defaultMask(v: string) {
  if (v.length <= 3) return "•••";
  return "•".repeat(Math.max(3, v.length - 3)) + v.slice(-3);
}

export function SensitiveField({ label, value, mask = defaultMask }: Props) {
  const [shown, setShown] = useState(false);
  const [copied, setCopied] = useState(false);
  const empty = !value;

  async function copy() {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      toast.success("Gekopieerd");
    } catch {
      toast.error("Kopiëren mislukt");
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-card px-3 py-2">
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-mono text-sm tabular-nums">
          {empty ? <span className="text-muted-foreground">—</span> : shown ? value : mask(value!)}
        </div>
      </div>
      {!empty && (
        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="icon" onClick={() => setShown((s) => !s)} aria-label={shown ? "Verbergen" : "Tonen"}>
            {shown ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          <Button type="button" variant="ghost" size="icon" onClick={copy} aria-label="Kopiëren">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      )}
    </div>
  );
}

export function maskBSN(v: string) {
  const digits = v.replace(/\D/g, "");
  if (digits.length < 3) return "•••";
  return "•••-•••-" + digits.slice(-3);
}

export function maskIBAN(v: string) {
  const clean = v.replace(/\s/g, "");
  if (clean.length < 4) return "•••";
  const last4 = clean.slice(-4);
  return "NL•• •••• •••• •••• ••" + last4;
}