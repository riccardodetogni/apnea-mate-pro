import { ChatMessage } from "@/hooks/useChat";
import { format } from "date-fns";
import React, { useState, useRef, useEffect } from "react";
import { MoreVertical, Pencil, Trash2, Copy, Check, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  message: ChatMessage;
  showSender?: boolean;
  onEdit?: (id: string, newContent: string) => Promise<{ error: unknown } | undefined>;
  onDelete?: (id: string) => Promise<{ error: unknown } | undefined>;
}

const linkify = (text: string): React.ReactNode[] => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) =>
    urlRegex.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="underline break-all"
      >
        {part}
      </a>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    )
  );
};

export const ChatBubble = ({ message, showSender = true, onEdit, onDelete }: Props) => {
  const time = format(new Date(message.created_at), "HH:mm");
  const isDeleted = !!message.deleted_at;
  const isEdited = !!message.edited_at && !isDeleted;

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(message.content);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing) {
      setDraft(message.content);
      requestAnimationFrame(() => {
        const el = textareaRef.current;
        if (el) {
          el.focus();
          el.setSelectionRange(el.value.length, el.value.length);
        }
      });
    }
  }, [isEditing, message.content]);

  const canActOnOwn = message.is_mine && !isDeleted && (onEdit || onDelete);

  const handleSaveEdit = async () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      toast.error("Il messaggio non può essere vuoto");
      return;
    }
    if (trimmed === message.content) {
      setIsEditing(false);
      return;
    }
    if (!onEdit) return;
    setSaving(true);
    const res = await onEdit(message.id, trimmed);
    setSaving(false);
    if (res?.error) {
      toast.error("Impossibile modificare il messaggio");
      return;
    }
    setIsEditing(false);
  };

  const handleConfirmDelete = async () => {
    if (!onDelete) return;
    const res = await onDelete(message.id);
    setConfirmDelete(false);
    if (res?.error) {
      toast.error("Impossibile eliminare il messaggio");
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      toast.success("Copiato");
    } catch {
      toast.error("Impossibile copiare");
    }
  };

  // ----- Render helpers -----
  const renderActionMenu = () =>
    canActOnOwn && !isEditing ? (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Azioni messaggio"
            className="opacity-60 hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-foreground/10"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={message.is_mine ? "end" : "start"} className="min-w-[160px]">
          {onEdit && (
            <DropdownMenuItem onClick={() => setIsEditing(true)}>
              <Pencil className="w-4 h-4 mr-2" /> Modifica
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={handleCopy}>
            <Copy className="w-4 h-4 mr-2" /> Copia
          </DropdownMenuItem>
          {onDelete && (
            <DropdownMenuItem
              onClick={() => setConfirmDelete(true)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" /> Elimina
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    ) : null;

  const renderEditor = () => (
    <div className="flex flex-col gap-2 min-w-[200px]">
      <textarea
        ref={textareaRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSaveEdit();
          } else if (e.key === "Escape") {
            e.preventDefault();
            setIsEditing(false);
          }
        }}
        rows={Math.min(6, Math.max(1, draft.split("\n").length))}
        className={cn(
          "w-full resize-none rounded-md bg-background/40 text-sm text-current",
          "px-2 py-1 outline-none border border-current/20 focus:border-current/40"
        )}
        disabled={saving}
      />
      <div className="flex items-center justify-end gap-1">
        <button
          type="button"
          onClick={() => setIsEditing(false)}
          disabled={saving}
          className="p-1 rounded hover:bg-foreground/10"
          aria-label="Annulla"
        >
          <X className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleSaveEdit}
          disabled={saving}
          className="p-1 rounded hover:bg-foreground/10"
          aria-label="Salva"
        >
          <Check className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const renderContent = () => {
    if (isDeleted) {
      return (
        <p className="text-sm italic opacity-70">Messaggio eliminato</p>
      );
    }
    if (isEditing) return renderEditor();
    return (
      <p className="text-sm whitespace-pre-wrap break-words">{linkify(message.content)}</p>
    );
  };

  const metaLine = (
    <p className={cn(
      "text-[10px] text-right mt-0.5",
      message.is_mine ? "opacity-70" : "text-muted-foreground"
    )}>
      {isEdited && <span className="mr-1 italic">modificato ·</span>}
      {time}
    </p>
  );

  // ----- Layout -----
  const bubble = (
    <div
      className={cn(
        "rounded-2xl px-3.5 py-2",
        message.is_mine
          ? "bg-primary text-primary-foreground rounded-br-md"
          : "bg-muted/20 border border-border text-foreground rounded-bl-md",
        isDeleted && "opacity-80"
      )}
    >
      {renderContent()}
      {!isEditing && metaLine}
    </div>
  );

  return (
    <>
      <div className={cn("flex mb-2 group", message.is_mine ? "justify-end" : "justify-start")}>
        <div className={cn("max-w-[75%]", message.is_mine && "flex items-end gap-1 flex-row-reverse")}>
          {!message.is_mine && showSender && (
            <p className="text-xs text-muted-foreground mb-0.5 ml-1 font-medium">
              {message.sender_name}
            </p>
          )}
          {message.is_mine ? (
            <>
              {bubble}
              <div className="self-center">{renderActionMenu()}</div>
            </>
          ) : (
            <div className="flex items-end gap-1">
              {bubble}
              {/* No menu for others' messages in v1 */}
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare il messaggio?</AlertDialogTitle>
            <AlertDialogDescription>
              L'azione non è reversibile. Il messaggio rimarrà visibile come "Messaggio eliminato".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
