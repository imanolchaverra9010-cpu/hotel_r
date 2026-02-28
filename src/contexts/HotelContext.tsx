import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { Guest, Room, Reservation, Message, ServiceRequest, Notification as AppNotification, StaffUser, CatalogItem, WiFiInfo } from '@/types/hotel';
import { API_BASE_URL } from '@/config/apiConfig';

interface GuestSession {
  guest: Guest;
  reservation: Reservation;
  room: {
    id: string;
    number: string;
    type: string;
    floor: number;
  };
}

interface StaffSession {
  user: StaffUser;
}

interface HotelContextType {
  // Session
  userSession: GuestSession | StaffSession | null;
  guestSession: GuestSession | null;
  staffSession: StaffSession | null;
  unifiedLogin: (data: { identifier: string; password?: string; documentType?: string }) => Promise<{ success: boolean; role?: string; message?: string }>;
  logout: () => void;
  loginAsGuest: (documentType: string, documentNumber: string) => Promise<boolean>;
  loginAsStaff: (email: string, password: string) => Promise<boolean>;
  logoutGuest: () => void;
  logoutStaff: () => void;

  // Data
  rooms: Room[];
  guests: Guest[];
  reservations: Reservation[];
  messages: Message[];
  serviceRequests: ServiceRequest[];
  notifications: AppNotification[];
  catalogs: {
    roomService: CatalogItem[];
    housekeeping: CatalogItem[];
    transport: CatalogItem[];
  };
  wifiInfo: WiFiInfo | null;
  unreadNotificationsCount: number;

  // Actions
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => Promise<void>;
  addServiceRequest: (request: Omit<ServiceRequest, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  cancelServiceRequest: (id: string) => Promise<void>;
  updateServiceRequestStatus: (id: string, status: ServiceRequest['status']) => Promise<void>;
  addNotification: (notification: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => void;
  markNotificationRead: (id: string) => Promise<void>;
  markMessageRead: (id: string) => Promise<void>;
  markAllMessagesRead: (resId: string) => Promise<void>;
  markRoomMessagesRead: (roomNumber: string) => Promise<void>;
  addReservation: (data: { guest: any; reservation: any }) => void;
  updateReservation: (id: string, updates: Partial<Reservation>) => void;
  updateRoomStatus: (id: string, status: Room['status']) => void;
  deleteReservation: (id: string) => Promise<void>;
  addRoom: (roomData: Omit<Room, 'id'>) => Promise<void>;
  updateRoom: (id: string, roomData: Omit<Room, 'id'>) => Promise<void>;
  deleteRoom: (id: string) => Promise<void>;

  // Fetching helpers
  refreshData: () => void;
  fetchNotifications: (resId: string) => Promise<void>;
  requestNotificationPermission: () => Promise<boolean>;
  testNotification: () => void;
}

const HotelContext = createContext<HotelContextType | undefined>(undefined);

export const useHotel = () => {
  const context = useContext(HotelContext);
  if (!context) {
    throw new Error('useHotel must be used within a HotelProvider');
  }
  return context;
};

export const HotelProvider = ({ children }: { children: ReactNode }) => {
  const [guestSession, setGuestSession] = useState<GuestSession | null>(() => {
    const saved = localStorage.getItem('guestSession');
    return saved ? JSON.parse(saved) : null;
  });
  const [staffSession, setStaffSession] = useState<StaffSession | null>(() => {
    const saved = localStorage.getItem('staffSession');
    return saved ? JSON.parse(saved) : null;
  });

  const [rooms, setRooms] = useState<Room[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [catalogs, setCatalogs] = useState<{
    roomService: CatalogItem[];
    housekeeping: CatalogItem[];
    transport: CatalogItem[];
  }>({
    roomService: [],
    housekeeping: [],
    transport: [],
  });
  const [wifiInfo, setWifiInfo] = useState<WiFiInfo | null>(null);

  const lastMessageId = React.useRef<string | null>(null);
  const lastRequestId = React.useRef<string | null>(null);
  const lastGuestStatuses = React.useRef<Record<string, ServiceRequest['status']>>({});

  const userSession = guestSession || staffSession;

  const logout = () => {
    setGuestSession(null);
    setStaffSession(null);
    localStorage.removeItem('guestSession');
    localStorage.removeItem('staffSession');
  };

  const logoutGuest = logout;
  const logoutStaff = logout;

  useEffect(() => {
    console.log('Notification support:', 'Notification' in window);
    console.log('Current permission:', 'Notification' in window ? Notification.permission : 'unknown');
  }, []);

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) return false;
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  };

  const testNotification = () => {
    showBrowserNotification('Prueba de Notificación', 'Si ves esto, las notificaciones están funcionando correctamente.');
  };

  const showBrowserNotification = useCallback((title: string, body: string) => {
    console.log('Attempting notification:', title, body, 'Permission:', Notification.permission);
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, { body, icon: '/favicon.ico' });
      } catch (e) {
        console.error('Notification error:', e);
      }
    }
  }, []);

  const fetchCatalog = useCallback(async (type: 'room-service' | 'housekeeping' | 'transport') => {
    try {
      const resp = await fetch(`${API_BASE_URL}/catalog/${type}`);
      if (resp.ok) {
        const data = await resp.json();
        const key = type === 'room-service' ? 'roomService' : type === 'housekeeping' ? 'housekeeping' : 'transport';
        setCatalogs(prev => ({ ...prev, [key]: data }));
      }
    } catch (e) {
      console.error(`Failed to fetch ${type} catalog`, e);
    }
  }, []);

  const fetchWifiInfo = useCallback(async (floor: number) => {
    try {
      const resp = await fetch(`${API_BASE_URL}/wifi/${floor}`);
      if (resp.ok) {
        const data = await resp.json();
        setWifiInfo(data);
      }
    } catch (e) {
      console.error("Failed to fetch WiFi info", e);
    }
  }, []);

  const fetchAllRooms = useCallback(async () => {
    try {
      const resp = await fetch(`${API_BASE_URL.replace('/guest', '')}/staff/rooms`);
      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data)) {
          setRooms(data.map((r: any) => ({
            ...r,
            pricePerNight: r.price_per_night,
            amenities: typeof r.amenities === 'string'
              ? r.amenities.split(',').map((a: string) => a.trim())
              : Array.isArray(r.amenities) ? r.amenities : []
          })));
        }
      }
    } catch (e) { console.error("Failed to fetch rooms", e); }
  }, []);

  const fetchAllReservations = useCallback(async () => {
    try {
      const resp = await fetch(`${API_BASE_URL.replace('/guest', '')}/staff/reservations`);
      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data)) {
          setReservations(data.map((r: any) => ({
            ...r,
            checkIn: r.check_in,
            checkOut: r.check_out,
            roomId: r.room_id,
            guestId: r.guest_id,
            roomNumber: r.room_number,
            roomFloor: r.room_floor
          })));
        }
      }
    } catch (e) { console.error("Failed to fetch reservations", e); }
  }, []);

  const fetchAllServices = useCallback(async () => {
    try {
      const resp = await fetch(`${API_BASE_URL.replace('/guest', '')}/staff/services`);
      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data)) {
          const mapped = data.map((s: any) => ({
            ...s,
            reservationId: s.reservation_id,
            roomNumber: s.room_number,
            guestName: s.guest_name,
            createdAt: s.created_at,
            completedAt: s.completed_at,
          }));

          if (staffSession && mapped.length > 0) {
            const latest = mapped[0];
            if (latest.id !== lastRequestId.current) {
              if (latest.status === 'pending') {
                try {
                  showBrowserNotification(
                    `Nueva Solicitud - Hab ${latest.roomNumber || '?'}`,
                    `${latest.type || 'Servicio'}: ${latest.details || ''}`
                  );
                } catch (e) {
                  console.error("Notification trigger failed", e);
                }
              }
              lastRequestId.current = latest.id;
            }
          }
          setServiceRequests(mapped);
        }
      }
    } catch (e) { console.error("Failed to fetch all services", e); }
  }, [staffSession, showBrowserNotification]);

  const fetchAllMessages = useCallback(async () => {
    try {
      const resp = await fetch(`${API_BASE_URL.replace('/guest', '')}/staff/messages`);
      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data)) {
          const mapped = data.map((m: any) => ({
            ...m,
            reservationId: m.reservation_id,
            roomNumber: m.room_number,
            read: m.is_read
          })).sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

          if (staffSession && mapped.length > 0) {
            const last = mapped[mapped.length - 1];
            if (last.id !== lastMessageId.current && last.sender === 'guest') {
              showBrowserNotification(`Nuevo mensaje - Hab ${last.roomNumber}`, last.content);
              lastMessageId.current = last.id;
            } else if (last.id !== lastMessageId.current) {
              lastMessageId.current = last.id;
            }
          }
          setMessages(mapped);
        }
      }
    } catch (e) { console.error("Failed to fetch all messages", e); }
  }, [staffSession, showBrowserNotification]);

  const fetchMessages = useCallback(async (resId: string) => {
    try {
      const resp = await fetch(`${API_BASE_URL}/messages/${resId}`);
      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data)) {
          const mapped = data.map((m: any) => ({
            ...m,
            reservationId: m.reservation_id,
            roomNumber: m.room_number,
            read: m.is_read
          })).sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

          if (guestSession && mapped.length > 0) {
            const last = mapped[mapped.length - 1];
            if (last.id !== lastMessageId.current && last.sender === 'reception') {
              showBrowserNotification('Respuesta de Recepción', last.content);
              lastMessageId.current = last.id;
            } else if (last.id !== lastMessageId.current) {
              lastMessageId.current = last.id;
            }
          }
          setMessages(mapped);
        }
      }
    } catch (e) {
      console.error("Failed to fetch messages", e);
    }
  }, [guestSession, showBrowserNotification]);

  const fetchAllStaffNotifications = useCallback(async () => {
    try {
      const resp = await fetch(`${API_BASE_URL.replace('/guest', '')}/notifications`);
      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data)) {
          setNotifications(data.map((n: any) => ({
            ...n,
            reservationId: n.reservation_id,
            roomNumber: n.room_number,
            read: n.is_read,
            createdAt: n.created_at
          })));
        }
      }
    } catch (e) { console.error("Failed to fetch all notifications", e); }
  }, []);

  const fetchNotifications = useCallback(async (resId: string) => {
    try {
      const resp = await fetch(`${API_BASE_URL}/notifications/${resId}`);
      if (resp.ok) {
        const data = await resp.json();
        setNotifications(data.map((n: any) => ({
          ...n,
          reservationId: n.reservation_id,
          roomNumber: n.room_number,
          read: n.is_read,
          createdAt: n.created_at
        })));
      }
    } catch (e) {
      console.error("Failed to fetch notifications", e);
    }
  }, []);

  const fetchServiceHistory = useCallback(async (resId: string) => {
    try {
      const resp = await fetch(`${API_BASE_URL}/services/${resId}`);
      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data)) {
          const mapped = data.map((s: any) => ({
            ...s,
            reservationId: s.reservation_id,
            roomNumber: s.room_number,
            guestName: s.guest_name,
            createdAt: s.created_at,
            completedAt: s.completed_at
          }));

          if (guestSession && mapped.length > 0) {
            mapped.forEach((req: any) => {
              const prevStatus = lastGuestStatuses.current[req.id];
              if (prevStatus && prevStatus !== req.status) {
                const statusMap: any = {
                  'in-progress': 'en camino',
                  'completed': 'completada',
                  'cancelled': 'cancelada'
                };
                const statusText = statusMap[req.status] || req.status;
                showBrowserNotification('Actualización de Servicio', `Tu solicitud de ${req.type} está ${statusText}.`);
              }
              lastGuestStatuses.current[req.id] = req.status;
            });
          }
          setServiceRequests(mapped);
        }
      }
    } catch (e) {
      console.error("Failed to fetch services", e);
    }
  }, [guestSession, showBrowserNotification]);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let isActive = true;

    if (guestSession?.reservation?.id) {
      const refresh = async () => {
        if (!isActive) return;

        try {
          const statusRes = await fetch(`${API_BASE_URL}/session/status/${guestSession.reservation.id}`);
          if (statusRes.ok) {
            const statusData = await statusRes.json();
            if (!statusData.active) {
              logoutGuest();
              return;
            }
          }
        } catch (e) {
          console.error("Failed to check session status", e);
        }

        await Promise.allSettled([
          fetchMessages(guestSession.reservation.id),
          fetchNotifications(guestSession.reservation.id),
          fetchServiceHistory(guestSession.reservation.id)
        ]);

        if (isActive) {
          timeout = setTimeout(refresh, 5000);
        }
      };

      refresh();
      fetchWifiInfo(guestSession.room.floor);
      fetchCatalog('room-service');
      fetchCatalog('housekeeping');
      fetchCatalog('transport');
    }
    return () => {
      isActive = false;
      clearTimeout(timeout);
    };
  }, [guestSession, fetchMessages, fetchNotifications, fetchServiceHistory, fetchWifiInfo, fetchCatalog]);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let isActive = true;

    if (staffSession) {
      const refresh = async () => {
        if (!isActive) return;

        await Promise.allSettled([
          fetchAllRooms(),
          fetchAllReservations(),
          fetchAllServices(),
          fetchAllMessages(),
          fetchAllStaffNotifications()
        ]);

        if (isActive) {
          timeout = setTimeout(refresh, 5000);
        }
      };
      refresh();
    }
    return () => {
      isActive = false;
      clearTimeout(timeout);
    };
  }, [staffSession, fetchAllRooms, fetchAllReservations, fetchAllServices, fetchAllMessages, fetchAllStaffNotifications]);

  const refreshData = () => {
    if (guestSession?.reservation?.id) {
      fetchMessages(guestSession.reservation.id);
      fetchNotifications(guestSession.reservation.id);
      fetchServiceHistory(guestSession.reservation.id);
    }
  };

  const unifiedLogin = async (loginData: { identifier: string; password?: string; documentType?: string }): Promise<{ success: boolean; role?: string; message?: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL.replace('/guest', '')}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (data.role === 'guest') {
          const session = {
            guest: data.guest,
            reservation: data.reservation,
            room: {
              id: data.reservation.roomId,
              number: data.reservation.roomNumber,
              type: data.reservation.roomType,
              floor: data.reservation.roomFloor
            }
          };
          setGuestSession(session);
          localStorage.setItem('guestSession', JSON.stringify(session));
          return { success: true, role: 'guest' };
        } else {
          const session = { user: data.user };
          setStaffSession(session);
          localStorage.setItem('staffSession', JSON.stringify(session));
          return { success: true, role: data.role };
        }
      }
      return { success: false, message: data.message || 'Login failed' };
    } catch (error) {
      console.error("Unified Login Error:", error);
      return { success: false, message: 'Error de conexión con el servidor' };
    }
  };

  const loginAsGuest = async (documentType: string, documentNumber: string): Promise<boolean> => {
    const res = await unifiedLogin({ identifier: documentNumber, documentType });
    return res.success;
  };

  const loginAsStaff = async (email: string, password: string): Promise<boolean> => {
    const res = await unifiedLogin({ identifier: email, password });
    return res.success;
  };

  const addMessage = async (message: Omit<Message, 'id' | 'timestamp'>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      });
      if (response.ok) {
        if (guestSession) {
          fetchMessages(guestSession.reservation.id);
        } else if (staffSession) {
          fetchAllMessages();
        }
      }
    } catch (e) {
      console.error("Failed to send message", e);
    }
  };

  const addServiceRequest = async (request: Omit<ServiceRequest, 'id' | 'createdAt' | 'status'>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      if (response.ok) {
        if (guestSession) {
          fetchServiceHistory(guestSession.reservation.id);
        } else if (staffSession) {
          fetchAllServices();
        }
      }
    } catch (e) {
      console.error("Failed to create service request", e);
    }
  };

  const cancelServiceRequest = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/services/${id}/cancel`, {
        method: 'PUT',
      });
      if (response.ok && guestSession) {
        fetchServiceHistory(guestSession.reservation.id);
      }
    } catch (e) {
      console.error("Failed to cancel service request", e);
    }
  };

  const updateServiceRequestStatus = async (id: string, status: ServiceRequest['status']) => {
    try {
      const response = await fetch(`${API_BASE_URL.replace('/guest', '')}/staff/services/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (response.ok) fetchAllServices();
    } catch (e) { console.error("Failed to update service status", e); }
  };

  const addNotification = async (notification: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => {
    try {
      const payload = { ...notification };
      if (!payload.reservationId && guestSession) {
        payload.reservationId = guestSession.reservation.id;
      }

      const response = await fetch(`${API_BASE_URL}/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        if (staffSession) {
          fetchAllStaffNotifications();
        } else if (guestSession) {
          fetchNotifications(guestSession.reservation.id);
        }
      }
    } catch (e) {
      console.error("Failed to add notification", e);
    }
  };

  const markNotificationRead = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
        method: 'PUT',
      });
      if (response.ok) {
        if (guestSession) {
          fetchNotifications(guestSession.reservation.id);
        } else if (staffSession) {
          fetchAllStaffNotifications();
        }
      }
    } catch (e) {
      console.error("Failed to mark notification as read", e);
    }
  };

  const markMessageRead = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL.replace('/guest', '')}/messages/${id}/read`, {
        method: 'PUT',
      });
      if (response.ok) {
        if (guestSession) fetchMessages(guestSession.reservation.id);
        else if (staffSession) fetchAllMessages();
      }
    } catch (e) {
      console.error("Failed to mark message as read", e);
    }
  };

  const markAllMessagesRead = async (resId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL.replace('/guest', '')}/messages/reservation/${resId}/read`, {
        method: 'PUT',
      });
      if (response.ok) {
        if (guestSession) fetchMessages(resId);
        else if (staffSession) fetchAllMessages();
      }
    } catch (e) {
      console.error("Failed to mark all messages as read", e);
    }
  };

  const markRoomMessagesRead = async (roomNumber: string) => {
    try {
      const response = await fetch(`${API_BASE_URL.replace('/guest', '')}/messages/room/${roomNumber}/read`, {
        method: 'PUT',
      });
      if (response.ok) {
        fetchAllMessages();
      }
    } catch (e) {
      console.error("Failed to mark room messages as read", e);
    }
  };

  const addReservation = async (data: { guest: any; reservation: any }) => {
    try {
      const response = await fetch(`${API_BASE_URL.replace('/guest', '')}/staff/reservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        fetchAllReservations();
        fetchAllRooms();
      }
    } catch (e) { console.error("Failed to add reservation", e); }
  };

  const updateReservation = async (id: string, updates: Partial<Reservation>) => {
    try {
      const response = await fetch(`${API_BASE_URL.replace('/guest', '')}/staff/reservations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (response.ok) {
        fetchAllReservations();
        fetchAllRooms();
      }
    } catch (e) { console.error("Failed to update reservation", e); }
  };

  const updateRoomStatus = async (id: string, status: Room['status']) => {
    try {
      const response = await fetch(`${API_BASE_URL.replace('/guest', '')}/staff/rooms/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (response.ok) fetchAllRooms();
    } catch (e) { console.error("Failed to update room status", e); }
  };

  const deleteReservation = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL.replace('/guest', '')}/staff/reservations/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchAllReservations();
        fetchAllRooms();
      }
    } catch (e) {
      console.error("Failed to delete reservation", e);
    }
  };

  const addRoom = async (roomData: Omit<Room, 'id'>) => {
    try {
      const response = await fetch(`${API_BASE_URL.replace('/guest', '')}/staff/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          number: roomData.number,
          floor: roomData.floor,
          type: roomData.type,
          status: roomData.status,
          price_per_night: roomData.pricePerNight,
          capacity: roomData.capacity,
          amenities: roomData.amenities.join(', ')
        })
      });
      if (response.ok) {
        fetchAllRooms();
      }
    } catch (e) {
      console.error("Failed to add room", e);
    }
  };

  const updateRoom = async (id: string, roomData: Omit<Room, 'id'>) => {
    try {
      const response = await fetch(`${API_BASE_URL.replace('/guest', '')}/staff/rooms/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          number: roomData.number,
          floor: roomData.floor,
          type: roomData.type,
          price_per_night: roomData.pricePerNight,
          capacity: roomData.capacity,
          amenities: roomData.amenities.join(', ')
        })
      });
      if (response.ok) {
        fetchAllRooms();
      }
    } catch (e) {
      console.error("Failed to update room", e);
    }
  };

  const deleteRoom = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL.replace('/guest', '')}/staff/rooms/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        fetchAllRooms();
      }
    } catch (e) {
      console.error("Failed to delete room", e);
    }
  };

  return (
    <HotelContext.Provider
      value={{
        guestSession,
        loginAsGuest,
        logoutGuest,
        staffSession,
        loginAsStaff,
        logoutStaff,
        userSession,
        unifiedLogin,
        logout,
        rooms,
        guests,
        reservations,
        messages,
        serviceRequests,
        notifications,
        catalogs,
        wifiInfo,
        unreadNotificationsCount: notifications.filter(n => !n.read).length,
        addMessage,
        addServiceRequest,
        cancelServiceRequest,
        updateServiceRequestStatus,
        addNotification,
        markNotificationRead,
        markMessageRead,
        markAllMessagesRead,
        markRoomMessagesRead,
        addReservation,
        updateReservation,
        updateRoomStatus,
        deleteReservation,
        addRoom,
        updateRoom,
        deleteRoom,
        refreshData,
        fetchNotifications,
        requestNotificationPermission,
        testNotification
      }}
    >
      {children}
    </HotelContext.Provider>
  );
};