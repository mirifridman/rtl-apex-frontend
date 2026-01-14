import { useState, useRef, useCallback } from "react";
import { Upload, X, FileText, Image, File, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUploadDocument, EntityType } from "@/hooks/useDocuments";
import { cn } from "@/lib/utils";

interface FileDropZoneProps {
  entityType: EntityType;
  entityId: string;
}

const fileTypeIcons: Record<string, React.ReactNode> = {
  pdf: <FileText className="w-8 h-8 text-red-500" />,
  doc: <FileText className="w-8 h-8 text-blue-500" />,
  docx: <FileText className="w-8 h-8 text-blue-500" />,
  jpg: <Image className="w-8 h-8 text-purple-500" />,
  jpeg: <Image className="w-8 h-8 text-purple-500" />,
  png: <Image className="w-8 h-8 text-purple-500" />,
};

function getFileIcon(fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase();
  return fileTypeIcons[ext || ""] || <File className="w-8 h-8 text-muted-foreground" />;
}

export function FileDropZone({ entityType, entityId }: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadDocument = useUploadDocument();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    setPendingFiles((prev) => [...prev, ...files]);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setPendingFiles((prev) => [...prev, ...files]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadAllFiles = async () => {
    for (const file of pendingFiles) {
      await uploadDocument.mutateAsync({ file, entityType, entityId });
    }
    setPendingFiles([]);
  };

  const isImage = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    return ["jpg", "jpeg", "png", "gif", "webp"].includes(ext || "");
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all",
          isDragging 
            ? "border-primary bg-primary/10" 
            : "border-border hover:border-primary/50 hover:bg-secondary/30"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
        <Upload className={cn(
          "w-8 h-8 mx-auto mb-2",
          isDragging ? "text-primary" : "text-muted-foreground"
        )} />
        <p className="text-sm text-muted-foreground">
          גרור קבצים לכאן או לחץ לבחירה
        </p>
      </div>

      {pendingFiles.length > 0 && (
        <div className="space-y-2">
          {pendingFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 border border-border"
            >
              {isImage(file.name) ? (
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="w-10 h-10 rounded object-cover"
                />
              ) : (
                getFileIcon(file.name)
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => removeFile(index)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}

          <Button
            onClick={uploadAllFiles}
            disabled={uploadDocument.isPending}
            className="w-full"
          >
            {uploadDocument.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin ml-2" />
                מעלה...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 ml-2" />
                העלה {pendingFiles.length} קבצים
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
