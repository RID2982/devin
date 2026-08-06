import { useRef } from 'react';
import { Download, Trash2, Upload, FileText } from 'lucide-react';
import { useAttachmentsQuery, useUploadAttachment, useDeleteAttachment } from '@/features/attachments/useAttachments';
import { downloadAttachment } from '@/lib/downloadAttachment';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatDateTime } from '@/lib/utils';

function formatSize(bytes: number | null) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function DocumentsTab({ eventId }: { eventId: string }) {
  const { data: attachments, isLoading } = useAttachmentsQuery(eventId);
  const upload = useUploadAttachment(eventId);
  const remove = useDeleteAttachment(eventId);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload.mutate(file);
            e.target.value = '';
          }}
        />
        <Button size="sm" className="gap-1.5" onClick={() => inputRef.current?.click()} disabled={upload.isPending}>
          <Upload className="h-3.5 w-3.5" /> {upload.isPending ? 'Uploading…' : 'Upload File'}
        </Button>
      </div>

      {isLoading ? null : !attachments?.length ? (
        <EmptyState title="No documents uploaded" description="PDF, Word, Excel, PPT, images, ZIP, video, or audio." />
      ) : (
        <div className="divide-y divide-border rounded-md border border-border">
          {attachments.map((a) => (
            <div key={a.id} className="flex items-center gap-3 p-3">
              <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{a.filename}</p>
                <p className="text-xs text-muted-foreground">
                  {formatSize(a.sizeBytes)} · {formatDateTime(a.createdAt)}
                </p>
              </div>
              <button onClick={() => downloadAttachment(a.id, a.filename)} className="text-muted-foreground hover:text-foreground">
                <Download className="h-4 w-4" />
              </button>
              <button onClick={() => remove.mutate(a.id)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
