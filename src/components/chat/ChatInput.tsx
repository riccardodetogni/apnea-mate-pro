import { useState } from "react";
import { Send } from "lucide-react";
import { t } from "@/lib/i18n";

interface Props {
  onSend: (content: string) => Promise<void>;
  disabled?: boolean;
}

export const ChatInput = ({ onSend, disabled }: Props) => {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    await onSend(text.trim());
    setText("");
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-end gap-2 p-3 border-t bg-background safe-area-bottom">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t("chatPlaceholder")}
        disabled={disabled || sending}
        rows={1}
        className="min-w-0 flex-1 resize-none rounded-xl border border-border bg-muted/10 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 max-h-24"
        style={{ minHeight: 40 }}
      />
      <button
        onClick={handleSend}
        disabled={!text.trim() || sending || disabled}
        className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 transition-opacity shrink-0"
      >
        <Send className="w-4 h-4" />
      </button>
    </div>
  );
};
