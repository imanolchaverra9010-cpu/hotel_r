import { useState, useRef, useEffect } from 'react';
import { Send, User, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { StaffSidebar } from '@/components/hotel/StaffSidebar';
import { ChatBubble } from '@/components/hotel/ChatBubble';
import { useHotel } from '@/contexts/HotelContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

const Messages = () => {
  const navigate = useNavigate();
  const { staffSession, messages, addMessage, markRoomMessagesRead, rooms, reservations } = useHotel();
  const { toast } = useToast();
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [newChatRoom, setNewChatRoom] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!staffSession) { navigate('/login'); return null; }

  const roomsWithMessages = [...new Set(messages.map(m => m.roomNumber))];
  // Ensure selectedRoom is in the list even if it has no messages yet
  const displayRooms = [...new Set([...roomsWithMessages, ...(selectedRoom ? [selectedRoom] : [])])].sort();

  const occupiedRooms = rooms.filter(r => r.status === 'occupied' || r.status === 'cleaning');
  const availableForNewChat = occupiedRooms.filter(r => !roomsWithMessages.includes(r.number));
  const roomMessages = selectedRoom ? messages.filter(m => m.roomNumber === selectedRoom) : [];
  const unreadByRoom = (room: string) => messages.filter(m => m.roomNumber === room && !m.read && m.sender === 'guest').length;
  const lastMessageByRoom = (room: string) => {
    const msgs = messages.filter(m => m.roomNumber === room);
    return msgs[msgs.length - 1];
  };

  useEffect(() => {
    if (selectedRoom) {
      const hasUnread = messages.some(m => m.roomNumber === selectedRoom && !m.read && m.sender === 'guest');
      if (hasUnread) {
        markRoomMessagesRead(selectedRoom);
      }
    }
  }, [selectedRoom, messages, markRoomMessagesRead]);

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedRoom) return;

    const reservation = reservations.find(r => r.roomNumber === selectedRoom && r.status === 'checked-in');

    if (reservation) {
      await addMessage({
        reservationId: reservation.id,
        roomNumber: selectedRoom,
        content: newMessage.trim(),
        sender: 'reception',
        read: false
      });
      setNewMessage('');
    } else {
      toast({ title: 'Error', description: 'No hay una reserva activa en esta habitación.', variant: 'destructive' });
    }
  };

  return (
    <SidebarProvider>
      <div className="h-screen flex w-full overflow-hidden bg-background">
        <StaffSidebar />
        <main className="flex-1 flex overflow-hidden">
          {/* Conversation List */}
          <div className="w-80 border-r flex flex-col bg-card">
            <div className="p-4 border-b flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <SidebarTrigger />
                <h2 className="font-bold text-lg">Chats</h2>
              </div>
              <Button size="icon" variant="ghost" onClick={() => setIsNewChatOpen(true)} title="Nueva conversación">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {displayRooms.map(room => {
                  const unread = unreadByRoom(room);
                  const last = lastMessageByRoom(room);
                  return (
                    <button
                      key={room}
                      onClick={() => setSelectedRoom(room)}
                      className={cn(
                        "w-full p-3 rounded-lg transition-all text-left flex flex-col gap-1 border",
                        selectedRoom === room
                          ? "bg-primary/5 border-primary/20 shadow-sm"
                          : "bg-transparent border-transparent hover:bg-muted/50"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-success" />
                          Habitación {room}
                        </span>
                        {unread > 0 && (
                          <Badge variant="destructive" className="h-5 min-w-[20px] px-1 flex items-center justify-center text-[10px]">
                            {unread}
                          </Badge>
                        )}
                      </div>
                      {last && (
                        <p className={cn(
                          "text-xs line-clamp-1 truncate",
                          unread > 0 ? "text-foreground font-medium" : "text-muted-foreground"
                        )}>
                          {last.sender === 'reception' ? 'Tú: ' : ''}{last.content}
                        </p>
                      )}
                    </button>
                  );
                })}
                {roomsWithMessages.length === 0 && (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    No hay conversaciones activas
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col bg-background relative">
            {selectedRoom ? (
              <>
                {/* Chat Header */}
                <div className="h-16 px-6 border-b flex items-center justify-between bg-card/50 backdrop-blur">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold">Habitación {selectedRoom}</h3>
                      <p className="text-[10px] text-success font-medium uppercase tracking-wider">Huésped Conectado</p>
                    </div>
                  </div>
                </div>

                {/* Messages Container */}
                <div
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
                >
                  {roomMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                      <p className="text-sm">Inicia la conversación</p>
                    </div>
                  ) : (
                    roomMessages.map(m => (
                      <ChatBubble
                        key={m.id}
                        content={m.content}
                        timestamp={m.timestamp}
                        isOwn={m.sender === 'reception'}
                        senderName={m.sender === 'guest' ? 'Huésped' : 'Recepción'}
                        isRead={m.read}
                      />
                    ))
                  )}
                </div>

                {/* Input Area */}
                <div className="p-4 border-t bg-card/30 backdrop-blur-sm">
                  <div className="max-w-4xl mx-auto flex gap-2">
                    <Input
                      placeholder="Escriba un mensaje..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                      className="flex-1 h-12 bg-background border-muted-foreground/20 focus-visible:ring-primary"
                    />
                    <Button
                      onClick={handleSend}
                      size="icon"
                      className="h-12 w-12 rounded-xl shadow-lg hover:shadow-primary/20 transition-all active:scale-95"
                      disabled={!newMessage.trim()}
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-muted/20">
                <div className="bg-primary/10 p-6 rounded-full mb-4">
                  <Send className="h-12 w-12 text-primary/40" />
                </div>
                <h3 className="text-xl font-bold mb-2">Mensajería</h3>
                <p className="text-muted-foreground max-w-sm">
                  Selecciona una habitación de la lista para ver los mensajes y responder a las solicitudes de los huéspedes.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>

      <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Conversación</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Seleccionar Habitación</Label>
              <Select value={newChatRoom} onValueChange={setNewChatRoom}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione una habitación..." />
                </SelectTrigger>
                <SelectContent>
                  {availableForNewChat.map(room => (
                    <SelectItem key={room.id} value={room.number}>
                      Habitación {room.number}
                    </SelectItem>
                  ))}
                  {availableForNewChat.length === 0 && (
                    <SelectItem value="none" disabled>No hay habitaciones disponibles</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewChatOpen(false)}>Cancelar</Button>
            <Button
              disabled={!newChatRoom}
              onClick={() => {
                setSelectedRoom(newChatRoom);
                setIsNewChatOpen(false);
                setNewChatRoom('');
              }}
            >
              Iniciar Chat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider >
  );
};

export default Messages;
