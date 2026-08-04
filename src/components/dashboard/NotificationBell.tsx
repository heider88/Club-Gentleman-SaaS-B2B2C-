"use client"

import { useState, useEffect, useRef } from "react"
import { Bell } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

type Notification = {
    id: string;
    message: string;
    appointment_date: string;
    is_read: boolean;
    created_at: string;
}

export function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [userId, setUserId] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const fetchUserAndNotifications = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            
            setUserId(user.id)

            // Fetch initial notifications (unread + some recent read ones, up to 10)
            const { data } = await supabase
                .from('notifications')
                .select('*')
                .eq('barber_id', user.id)
                .order('created_at', { ascending: false })
                .limit(10)

            if (data) {
                setNotifications(data)
            }
        }

        fetchUserAndNotifications()
    }, [])

    useEffect(() => {
        if (!userId) return

        // Subscribe to real-time new notifications
        const channel = supabase
            .channel('realtime-notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `barber_id=eq.${userId}`
                },
                (payload) => {
                    const newNotification = payload.new as Notification
                    // Add the new notification to the top, keeping only the last 10
                    setNotifications(prev => [newNotification, ...prev].slice(0, 10))
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [userId])

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const handleNotificationClick = async (notification: Notification) => {
        setIsOpen(false)
        
        // Mark as read in DB if not already
        if (!notification.is_read) {
            await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', notification.id)
                
            // Update local state
            setNotifications(prev => 
                prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
            )
        }

        // Redirect to dashboard with the specific date
        router.push(`/dashboard?date=${notification.appointment_date}`)
        router.refresh()
    }

    const unreadCount = notifications.filter(n => !n.is_read).length

    return (
        <div className="fixed top-4 right-4 md:top-8 md:right-8 z-50" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-12 h-12 flex items-center justify-center rounded-full transition-all border border-dash-border bg-dash-panel hover:bg-dash-panel-alt shadow-lg",
                    isOpen && "ring-2 ring-dash-text bg-dash-panel-alt"
                )}
            >
                <div className="relative flex items-center justify-center">
                    <Bell className="w-5 h-5 text-dash-text-muted hover:text-dash-text transition-colors" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)] border border-dash-panel">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </div>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-full right-0 mt-3 w-[320px] bg-dash-panel border border-dash-border shadow-2xl rounded-xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-4 duration-200">
                    <div className="p-4 border-b border-dash-border bg-dash-panel-alt/50 flex justify-between items-center">
                        <h3 className="font-oswald uppercase tracking-widest text-sm font-medium text-dash-text">Notificaciones</h3>
                        {unreadCount > 0 && (
                            <span className="text-[10px] uppercase font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded-full">{unreadCount} Nuevas</span>
                        )}
                    </div>
                    
                    <div className="max-h-[350px] overflow-y-auto scrollbar-hide">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-dash-text-muted text-xs">
                                No tienes notificaciones recientes.
                            </div>
                        ) : (
                            <div className="flex flex-col">
                                {notifications.map(notification => (
                                    <button
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={cn(
                                            "w-full text-left p-4 border-b border-dash-border/50 hover:bg-white/[0.04] transition-colors flex flex-col gap-1.5 relative",
                                            !notification.is_read ? "bg-white/[0.02]" : ""
                                        )}
                                    >
                                        {!notification.is_read && (
                                            <div className="absolute left-3 top-6 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                                        )}
                                        <p className={cn(
                                            "text-sm font-jakarta pl-5",
                                            !notification.is_read ? "text-dash-text font-semibold" : "text-dash-text-soft"
                                        )}>
                                            {notification.message}
                                        </p>
                                        <span className="text-[10px] text-dash-text-muted uppercase tracking-wider pl-5">
                                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: es })}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
