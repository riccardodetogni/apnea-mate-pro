import { useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useChat } from "@/hooks/useChat";
import { ChatBubble } from "@/components/chat/ChatBubble";
import { ChatInput } from "@/components/chat/ChatInput";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useConversations } from "@/hooks/useConversations";

const ChatThread = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { messages, loading, sendMessage, markAsRead } = useChat(id);
  const { conversations } = useConversations();
  const bottomRef = useRef<HTMLDivElement>(null);

  const conversation = conversations.find((c) => c.id === id);
  const title = conversation?.name || "Chat";

  // Mark as read on mount + when messages change
  useEffect(() => {
    if (id && messages.length > 0) {
      markAsRead();
    }
  }, [id, messages.length, markAsRead]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = async (content: string) => {
    await sendMessage(content);
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      {/* Header */}
      <header className="sticky top-0 bg-background/80 backdrop-blur-sm border-b px-3 py-3 flex items-center gap-3 z-10 safe-area-top">
        <button
          onClick={() => navigate("/messages")}
          className="w-9 h-9 rounded-full bg-muted/20 flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex items-center gap-2 min-w-0">
          {conversation?.avatarUrl ? (
            <img src={conversation.avatarUrl} className="w-8 h-8 rounded-full object-cover" alt="" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
              {conversation?.avatarInitial || "C"}
            </div>
          )}
          <h1 className="font-semibold text-foreground truncate">{title}</h1>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-sm text-muted-foreground">Nessun messaggio ancora</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const prevMsg = messages[i - 1];
            const showSender = !msg.is_mine && (!prevMsg || prevMsg.sender_id !== msg.sender_id);
            return <ChatBubble key={msg.id} message={msg} showSender={showSender} />;
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <ChatInput onSend={handleSend} />
    </div>
  );
};

export default ChatThread;
