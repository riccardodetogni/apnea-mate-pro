import { useNavigate } from "react-router-dom";
import { ConversationListItem } from "@/hooks/useConversations";
import { MessageCircle, Users, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { it, enUS } from "date-fns/locale";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  conversation: ConversationListItem;
}

export const ConversationItem = ({ conversation }: Props) => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const locale = language === "it" ? it : enUS;

  const typeIcon = conversation.type === "session" ? Calendar :
    conversation.type === "group" ? Users : MessageCircle;
  const TypeIcon = typeIcon;

  const timeLabel = conversation.lastMessageAt
    ? formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: false, locale })
    : "";

  return (
    <button
      onClick={() => navigate(`/messages/${conversation.id}`)}
      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/10 transition-colors text-left"
    >
      {/* Avatar */}
      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg shrink-0 overflow-hidden">
        {conversation.avatarUrl ? (
          <img src={conversation.avatarUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          conversation.avatarInitial
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground truncate">{conversation.name}</span>
          <TypeIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        </div>
        {conversation.lastMessage && (
          <p className="text-sm text-muted-foreground truncate mt-0.5">
            {conversation.lastMessage}
          </p>
        )}
      </div>

      {/* Meta */}
      <div className="flex flex-col items-end gap-1 shrink-0">
        {timeLabel && (
          <span className="text-xs text-muted-foreground">{timeLabel}</span>
        )}
        {conversation.unreadCount > 0 && (
          <span className="min-w-[20px] h-5 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center px-1.5">
            {conversation.unreadCount}
          </span>
        )}
      </div>
    </button>
  );
};
