import { useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import Button from "@/components/ui/Button";

export default function ShareModal({
  open,
  onClose,
  title = "Share",
  link,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  link: string;
}) {
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) setCopied(false);
  }, [open]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  function whatsapp() {
    const url = `https://wa.me/?text=${encodeURIComponent(link)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function nativeShare() {
    try {
      if (navigator.share) {
        await navigator.share({ title, url: link });
      } else {
        await copy();
      }
    } catch {}
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30">
      <div ref={ref} className="w-full max-w-sm rounded-xl border bg-white p-4 shadow-lg">
        <div className="mb-3">
          <div className="text-sm text-neutral-500">{title}</div>
          <div className="font-medium">Invite participants</div>
        </div>

        <div className="grid gap-3">
          <div className="rounded-lg border p-3">
            <div className="text-xs text-neutral-500 mb-1">Link</div>
            <div className="flex items-center gap-2">
              <input readOnly value={link} className="flex-1 text-sm rounded-md border px-2 py-1 bg-white" />
              <Button onClick={copy} className="px-3 py-1 text-xs">{copied ? "Copied" : "Copy"}</Button>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="rounded-lg border p-3 bg-white">
              <QRCodeCanvas value={link} size={180} includeMargin />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={whatsapp} className="flex-1">WhatsApp</Button>
            <Button onClick={nativeShare} className="flex-1">
              Share
            </Button>
          </div>

          <div className="flex justify-end">
            <Button onClick={onClose} className="flex-1">
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
