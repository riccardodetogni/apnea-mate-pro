import { ChatMessage } from "@/hooks/useChat";
import { format } from "date-fns";
import React from "react";

interface Props {
  message: ChatMessage;
  showSender?: boolean;
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

export const ChatBubble = ({ message, showSender = true }: Props) => {
  const time = format(new Date(message.created_at), "HH:mm");

  if (message.is_mine) {
    return (
      <div className="flex justify-end mb-2">
        <div className="max-w-[75%] rounded-2xl rounded-br-md bg-primary text-primary-foreground px-3.5 py-2">
          <p className="text-sm whitespace-pre-wrap break-words">{linkify(message.content)}</p>
          <p className="text-[10px] opacity-70 text-right mt-0.5">{time}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-2">
      <div className="max-w-[75%]">
        {showSender && (
          <p className="text-xs text-muted-foreground mb-0.5 ml-1 font-medium">
            {message.sender_name}
          </p>
        )}
        <div className="rounded-2xl rounded-bl-md bg-muted/20 border border-border px-3.5 py-2">
          <p className="text-sm text-foreground whitespace-pre-wrap break-words">{linkify(message.content)}</p>
          <p className="text-[10px] text-muted-foreground text-right mt-0.5">{time}</p>
        </div>
      </div>
    </div>
  );
};
