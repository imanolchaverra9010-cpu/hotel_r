import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GuestHeader } from '@/components/hotel/GuestHeader';
import { ChatBubble } from '@/components/hotel/ChatBubble';
import { useHotel } from '@/contexts/HotelContext';
import { useNavigate } from 'react-router-dom';

const GuestChat = () => {
  const navigate = useNavigate();
  const { guestSession, messages, addMessage, markAllMessagesRead } = useHotel();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  if (!guestSession) {
    navigate('/login');
    return null;
  }

  const roomMessages = messages.filter(
    m => m.roomNumber === guestSession.room.number
  );

  useEffect(() => {
    // Mark unread messages as read
    const hasUnread = roomMessages.some(m => !m.read && m.sender === 'reception');
    if (hasUnread && guestSession?.reservation?.id) {
      markAllMessagesRead(guestSession.reservation.id);
    }
  }, [roomMessages, guestSession?.reservation?.id, markAllMessagesRead]);

  useEffect(() => {
    // Other effects?
  }, [roomMessages]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    await addMessage({
      reservationId: guestSession.reservation.id,
      roomNumber: guestSession.room.number,
      content: newMessage.trim(),
      sender: 'guest',
      read: false,
    });

    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <GuestHeader title="Chat con Recepción" showBack />

      <main className="flex-1 container mx-auto px-4 py-4 flex flex-col max-h-[calc(100vh-8rem)]">
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {roomMessages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-center text-muted-foreground p-8">
              <div>
                <p className="mb-2">No hay mensajes aún</p>
                <p className="text-sm">Envíe un mensaje para iniciar la conversación con recepción</p>
              </div>
            </div>
          ) : (
            roomMessages.map((message) => (
              <ChatBubble
                key={message.id}
                content={message.content}
                timestamp={message.timestamp}
                isOwn={message.sender === 'guest'}
                senderName={message.sender === 'reception' ? 'Recepción' : undefined}
                isRead={message.read}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex gap-2 py-4 border-t bg-background">
          <Input
            placeholder="Escriba su mensaje..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={!newMessage.trim()}>
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </main>
    </div>
  );
};

export default GuestChat;
