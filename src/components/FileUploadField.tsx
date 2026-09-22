import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { FileText, UploadCloud, X } from "lucide-react";

type FileUploadFieldProps = {
  id?: string;
  label: string;
  helper?: string;
  accept?: string;
  maxSizeMB?: number;
  required?: boolean;
  file: File | null;
  onFile: (file: File | null) => void;
};

/**
 * Reusable single-file upload field with drag &amp; drop, type/size validation
 * and a removable preview. Used by the student application form and the CV /
 * cover-letter inputs across the app.
 */
export function FileUploadField({
  id,
  label,
  helper,
  accept = ".pdf,.doc,.docx",
  maxSizeMB = 10,
  required = false,
  file,
  onFile,
}: FileUploadFieldProps) {
  const autoId = useId();
  const inputId = id || `file-${autoId}`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [invalid, setInvalid] = useState<string | null>(null);

  const handleFile = (selected: File | null) => {
    setInvalid(null);
    if (!selected) return onFile(null);
    if (selected.size > maxSizeMB * 1024 * 1024) {
      setInvalid(`File is larger than the ${maxSizeMB}MB limit.`);
      return;
    }
    const ext = accept.split(",").map((s) => s.trim().toLowerCase());
    const okFormat = ext.some((e) => selected.name.toLowerCase().endsWith(e.replace("*", "")));
    if (!okFormat) {
      setInvalid(`Unsupported file type. Please use ${accept.replace(/\*/g, "").split(",").join(" or ")}.`);
      return;
    }
    onFile(selected);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={inputId}>{label}{required && <span className="text-destructive"> *</span>}</Label>
      {file ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 px-3 py-2">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
            </div>
          </div>
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => onFile(null)} title="Remove file">
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          className={cn(
            "flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed px-4 py-6 text-center cursor-pointer transition-colors",
            dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
          )}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFile(e.dataTransfer.files?.[0] || null); }}
        >
          <UploadCloud className="h-5 w-5 text-muted-foreground" />
          <p className="text-sm font-medium">Click to upload or drag &amp; drop</p>
          <p className="text-xs text-muted-foreground">PDF, DOC or DOCX — max {maxSizeMB}MB{helper ? ` · ${helper}` : ""}</p>
        </label>
      )}

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => handleFile(e.target.files?.[0] || null)}
      />
      {invalid && <p className="text-xs text-destructive">{invalid}</p>}
    </div>
  );
}