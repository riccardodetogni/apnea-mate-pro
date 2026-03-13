import { AppLayout } from "@/components/layout/AppLayout";
import { useConversations } from "@/hooks/useConversations";
import { ConversationItem } from "@/components/chat/ConversationItem";
import { t } from "@/lib/i18n";
import { MessageCircle, Loader2 } from "lucide-react";

const Messages = () => {
  const { conversations, loading } = useConversations();

  return (
    <AppLayout>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-foreground">{t("messages")}</h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <MessageCircle className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-base font-semibold text-foreground mb-1">{t("noMessages")}</h3>
          <p className="text-sm text-muted-foreground max-w-[260px]">{t("noMessagesDesc")}</p>
        </div>
      ) : (
        <div className="space-y-1">
          {conversations.map((conv) => (
            <ConversationItem key={conv.id} conversation={conv} />
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export default Messages;
