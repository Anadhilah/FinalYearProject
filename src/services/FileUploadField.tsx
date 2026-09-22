import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/supabaseTables";
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

const ACCEPTED = [".pdf", ".doc", ".docx"];

function isAcceptedPath(name: string): boolean {
  const lower = name.toLowerCase();
  return ACCEPTED.some((ext) => lower.endsWith(ext));
}

export default function FileUploadField({
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
  const inputId = id || `file-field-${autoId}`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [invalid, setInvalid] = useState<string | null>(null);

  const validate = (f: File | null): string | null => {
    if (!f) return null;
    if (f.size > maxSizeMB * 1024 * 1024) {
      return `File is larger than the ${maxSizeMB}MB limit.`;
    }
    if (!isAcceptedPath(f.name)) {
      return "Only PDF, DOC, or DOCX files are supported.";
    }
    return null;
  };

  const handlePick = (f: File | null) => {
    const err = validate(f);
    if (err) {
      setInvalid(err);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setInvalid(null);
    onFile(f);
  };

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <Label htmlFor={inputId}>
          {label}
          {required && <span className="text-destructive"> *</span>}
        </Label>
        {helper && <p className="text-xs text-muted-foreground">{helper}</p>}
      </div>

      {file ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 px-3 py-2">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            title="Remove file"
            onClick={() => onFile(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          className={cn(
            "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center cursor-pointer transition-colors",
            dragActive
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          )}
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            handlePick(e.dataTransfer.files?.[0] || null);
          }}
        >
          <UploadCloud className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm font-medium">Click to upload or drag and drop</p>
          <p className="text-xs text-muted-foreground">PDF, DOC, or DOCX — max {maxSizeMB}MB</p>
        </label>
      )}

      <input
        id={inputId}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => handlePick(e.target.files?.[0] || null)}
      />

      {invalid && <p className="text-xs text-destructive">{invalid}</p>}
    </div>
  );
}
