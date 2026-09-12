import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const WhatsAppContext = createContext(null);

export const useWhatsApp = () => {
  const context = useContext(WhatsAppContext);
  if (!context) {
    throw new Error('useWhatsApp debe usarse dentro de WhatsAppProvider');
  }
  return context;
};

let audioCtx = null;

const getAudioCtx = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
};

const playBeep = () => {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) {}
};

const showBrowserNotification = (pedido) => {
  if (Notification.permission === 'granted') {
    new Notification('Nuevo pedido por WhatsApp', {
      body: `${pedido.sender_name}: ${pedido.message_text}`,
      icon: '/favicon.ico',
      tag: 'whatsapp-pedido',
      requireInteraction: false
    });
  }
};

export const WhatsAppProvider = ({ children }) => {
  const [pedidoDetectado, setPedidoDetectado] = useState(null);
  const [unreadPedidos, setUnreadPedidos] = useState(0);
  const [isOnWhatsAppPage, setIsOnWhatsAppPage] = useState(false);
  const isOnWhatsAppPageRef = useRef(false);
  const beepTimerRef = useRef(null);

  const stopBeep = useCallback(() => {
    if (beepTimerRef.current) {
      clearInterval(beepTimerRef.current);
      beepTimerRef.current = null;
    }
  }, []);

  const startBeep = useCallback(() => {
    stopBeep();
    playBeep();
    beepTimerRef.current = setInterval(playBeep, 1500);
  }, [stopBeep]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('[WhatsAppContext] Socket conectado:', socket.id);
    });

    socket.on('whatsapp:pedido-detectado', (pedido) => {
      console.log('[WhatsAppContext] Pedido detectado:', pedido);

      const enWhatsApp = isOnWhatsAppPageRef.current;
      const tieneFoco = document.hasFocus();

      if (!enWhatsApp) {
        setPedidoDetectado(pedido);
        setUnreadPedidos((prev) => prev + 1);
        startBeep();

        setTimeout(() => {
          setPedidoDetectado(null);
        }, 6000);
      }

      if (!tieneFoco) {
        showBrowserNotification(pedido);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [startBeep]);

  const clearUnread = useCallback(() => {
    setUnreadPedidos(0);
    stopBeep();
    setIsOnWhatsAppPage(true);
    isOnWhatsAppPageRef.current = true;
  }, [stopBeep]);

  const leaveWhatsAppPage = useCallback(() => {
    setIsOnWhatsAppPage(false);
    isOnWhatsAppPageRef.current = false;
  }, []);

  return (
    <WhatsAppContext.Provider
      value={{
        pedidoDetectado,
        unreadPedidos,
        isOnWhatsAppPage,
        clearUnread,
        leaveWhatsAppPage
      }}
    >
      {children}
    </WhatsAppContext.Provider>
  );
};
