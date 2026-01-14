import { useState, useRef, useEffect } from "react";
import { Paperclip, Upload, Download, Trash2, FileText, Image, File, Loader2, FileSpreadsheet, X, Eye } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useDocuments, useUploadDocument, useDeleteDocument, useDownloadDocument, EntityType, Document } from "@/hooks/useDocuments";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

interface DocumentsPopoverProps {
  entityType: EntityType;
  entityId: string;
  count?: number;
}

const fileTypeIcons: Record<string, React.ReactNode> = {
  pdf: <FileText className="w-4 h-4 text-red-500" />,
  doc: <FileText className="w-4 h-4 text-blue-500" />,
  docx: <FileText className="w-4 h-4 text-blue-500" />,
  xls: <FileSpreadsheet className="w-4 h-4 text-green-500" />,
  xlsx: <FileSpreadsheet className="w-4 h-4 text-green-500" />,
  jpg: <Image className="w-4 h-4 text-purple-500" />,
  jpeg: <Image className="w-4 h-4 text-purple-500" />,
  png: <Image className="w-4 h-4 text-purple-500" />,
  gif: <Image className="w-4 h-4 text-purple-500" />,
  webp: <Image className="w-4 h-4 text-purple-500" />,
};

const previewableImageTypes = ["jpg", "jpeg", "png", "gif", "webp"];
const previewablePdfTypes = ["pdf"];

function getFileIcon(fileType: string | null, size: "sm" | "lg" = "sm") {
  const sizeClass = size === "lg" ? "w-8 h-8" : "w-4 h-4";
  if (!fileType) return <File className={cn(sizeClass, "text-muted-foreground")} />;
  
  const icon = fileTypeIcons[fileType.toLowerCase()];
  if (icon) {
    // Clone with new size
    const IconComponent = fileType.toLowerCase().startsWith("xls") ? FileSpreadsheet : 
                          previewableImageTypes.includes(fileType.toLowerCase()) ? Image :
                          FileText;
    const colorClass = fileType.toLowerCase() === "pdf" ? "text-red-500" :
                       ["doc", "docx"].includes(fileType.toLowerCase()) ? "text-blue-500" :
                       ["xls", "xlsx"].includes(fileType.toLowerCase()) ? "text-green-500" :
                       "text-purple-500";
    return <IconComponent className={cn(sizeClass, colorClass)} />;
  }
  return <File className={cn(sizeClass, "text-muted-foreground")} />;
}

function formatFileSize(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isPreviewable(fileType: string | null): boolean {
  if (!fileType) return false;
  const type = fileType.toLowerCase();
  return previewableImageTypes.includes(type) || previewablePdfTypes.includes(type);
}

function FilePreview({ doc, onClose }: { doc: Document; onClose: () => void }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUrl = async () => {
      try {
        const { data, error } = await supabase.storage
          .from("documents")
          .createSignedUrl(doc.file_path, 3600); // 1 hour expiry
        
        if (error) throw error;
        setPreviewUrl(data.signedUrl);
      } catch (err: any) {
        setError(err.message || "שגיאה בטעינת הקובץ");
      } finally {
        setLoading(false);
      }
    };
    fetchUrl();
  }, [doc.file_path]);

  const isImage = doc.file_type && previewableImageTypes.includes(doc.file_type.toLowerCase());
  const isPdf = doc.file_type && previewablePdfTypes.includes(doc.file_type.toLowerCase());

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            {getFileIcon(doc.file_type, "lg")}
            <div>
              <h3 className="font-semibold">{doc.file_name}</h3>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(doc.file_size)} • {format(new Date(doc.created_at), "dd/MM/yyyy", { locale: he })}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex-1 overflow-auto bg-muted/30 min-h-[400px] flex items-center justify-center">
          {loading ? (
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          ) : error ? (
            <div className="text-center text-destructive">
              <p>{error}</p>
            </div>
          ) : previewUrl ? (
            isImage ? (
              <img 
                src={previewUrl} 
                alt={doc.file_name} 
                className="max-w-full max-h-[70vh] object-contain"
              />
            ) : isPdf ? (
              <iframe 
                src={previewUrl} 
                className="w-full h-[70vh]"
                title={doc.file_name}
              />
            ) : null
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DocumentThumbnail({ doc }: { doc: Document }) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  
  const isImage = doc.file_type && previewableImageTypes.includes(doc.file_type.toLowerCase());
  
  useEffect(() => {
    if (isImage) {
      const fetchUrl = async () => {
        try {
          const { data } = await supabase.storage
            .from("documents")
            .createSignedUrl(doc.file_path, 3600);
          if (data) setThumbnailUrl(data.signedUrl);
        } catch {}
      };
      fetchUrl();
    }
  }, [isImage, doc.file_path]);

  if (isImage && thumbnailUrl) {
    return (
      <div className="w-10 h-10 rounded-md overflow-hidden bg-muted flex-shrink-0">
        <img 
          src={thumbnailUrl} 
          alt={doc.file_name} 
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
      {getFileIcon(doc.file_type)}
    </div>
  );
}

export function DocumentsPopover({ entityType, entityId, count = 0 }: DocumentsPopoverProps) {
  const [open, setOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: documents = [], isLoading } = useDocuments(entityType, entityId);
  const uploadDocument = useUploadDocument();
  const deleteDocument = useDeleteDocument();
  const downloadDocument = useDownloadDocument();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await uploadDocument.mutateAsync({ file, entityType, entityId });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDownload = (filePath: string, fileName: string) => {
    downloadDocument.mutate({ filePath, fileName });
  };

  const handleDelete = (id: string, filePath: string) => {
    if (confirm("האם למחוק את הקובץ?")) {
      deleteDocument.mutate({ id, filePath, entityType, entityId });
    }
  };

  const handlePreview = (doc: Document) => {
    if (isPreviewable(doc.file_type)) {
      setPreviewDoc(doc);
    }
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors",
              count > 0 && "text-primary"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <Paperclip className="w-4 h-4" />
            {count > 0 && <span className="font-medium">{count}</span>}
          </button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-80 p-0 bg-background border-border" 
          align="start"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-3 border-b border-border">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">קבצים מצורפים</h4>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadDocument.isPending}
                className="h-8 px-2"
              >
                {uploadDocument.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Upload className="w-4 h-4 ml-1" />
                    העלאה
                  </>
                )}
              </Button>
            </div>
          </div>

          <ScrollArea className="max-h-72">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                אין קבצים מצורפים
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className={cn(
                      "flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 group",
                      isPreviewable(doc.file_type) && "cursor-pointer"
                    )}
                    onClick={() => handlePreview(doc)}
                  >
                    <DocumentThumbnail doc={doc} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(doc.file_size)} • {format(new Date(doc.created_at), "dd/MM/yy", { locale: he })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {isPreviewable(doc.file_type) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreview(doc);
                          }}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(doc.file_path, doc.file_name);
                        }}
                        disabled={downloadDocument.isPending}
                      >
                        <Download className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(doc.id, doc.file_path);
                        }}
                        disabled={deleteDocument.isPending}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {previewDoc && (
        <FilePreview doc={previewDoc} onClose={() => setPreviewDoc(null)} />
      )}
    </>
  );
}
