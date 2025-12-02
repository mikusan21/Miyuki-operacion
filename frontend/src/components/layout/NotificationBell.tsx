"use client";

import * as React from "react";
import { Bell, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

export interface Notification {
  id: string;
  message: string;
  href?: string;
}

interface NotificationBellProps {
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
}

export function NotificationBell({ notifications, setNotifications }: NotificationBellProps) {
  const router = useRouter();

  const handleNotificationClick = (notification: Notification) => {
    // Navegar si hay un enlace
    if (notification.href) {
      router.push(notification.href);
    }
    // Marcar como leída (eliminar de la lista)
    markAsRead(notification.id);
  };

  const markAsRead = (id: string) => {
    const updatedNotifications = notifications.filter((n) => n.id !== id);
    setNotifications(updatedNotifications);
    // Actualizar localStorage para que no reaparezca al recargar
    localStorage.setItem("userNotifications", JSON.stringify(updatedNotifications));
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell size={24} />
          {notifications.length > 0 && (
            <span className="absolute top-0 right-0 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 mr-4">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Notificaciones</h4>
            <p className="text-sm text-muted-foreground">
              Tienes {notifications.length} mensajes no leídos.
            </p>
          </div>
          <div className="grid gap-2">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div key={notification.id} onClick={() => handleNotificationClick(notification)} className="grid grid-cols-[25px_1fr] items-start pb-4 last:pb-0 last:border-b-0 border-b cursor-pointer hover:bg-muted/50 p-2 rounded-md">
                  <span className="flex h-2 w-2 translate-y-1 rounded-full bg-sky-500" />
                  <p className="text-sm font-medium">{notification.message}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-center text-muted-foreground py-4">No tienes notificaciones nuevas.</p>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
