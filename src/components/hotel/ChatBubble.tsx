import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCheck } from 'lucide-react';

interface ChatBubbleProps {
  content: string;
  timestamp: string;
  isOwn: boolean;
  senderName?: string;
  isRead?: boolean;
}

const safeFormatDate = (dateStr: string, formatStr: string) => {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '---';
    return format(date, formatStr, { locale: es });
  } catch (e) {
    return '---';
  }
};

export const ChatBubble = ({ content, timestamp, isOwn, senderName, isRead }: ChatBubbleProps) => {
  return (
    <div className={cn('flex flex-col max-w-[80%]', isOwn ? 'self-end items-end' : 'self-start items-start')}>
      {senderName && !isOwn && (
        <span className="text-xs text-muted-foreground mb-1 ml-3">{senderName}</span>
      )}
      <div
        className={cn(
          'px-4 py-3 rounded-2xl relative',
          isOwn
            ? 'bg-primary text-primary-foreground rounded-br-md'
            : 'bg-muted text-foreground rounded-bl-md'
        )}
      >
        <p className="text-sm">{content}</p>
      </div>
      <div className="flex items-center gap-1 mt-1 mx-3">
        <span className="text-xs text-muted-foreground">
          {safeFormatDate(timestamp, 'HH:mm')}
        </span>
        {isOwn && (
          <CheckCheck className={cn("h-3.5 w-3.5", isRead ? "text-primary" : "text-muted-foreground")} />
        )}
      </div>
    </div>
  );
};
