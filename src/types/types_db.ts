export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface ScheduleSettings {
    workDays: number[];
    startHour: number;
    endHour: number;
    lunchStart: number;
    lunchEnd: number;
}

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    email: string | null
                    full_name: string | null
                    avatar_url: string | null
                    bio: string | null
                    phone: string | null
                    schedule_settings: ScheduleSettings | null
                    created_at: string | null
                }
                Insert: {
                    id: string
                    email?: string | null
                    full_name?: string | null
                    avatar_url?: string | null
                    bio?: string | null
                    phone?: string | null
                    schedule_settings?: ScheduleSettings | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    email?: string | null
                    full_name?: string | null
                    avatar_url?: string | null
                    bio?: string | null
                    phone?: string | null
                    schedule_settings?: ScheduleSettings | null
                    created_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "profiles_id_fkey"
                        columns: ["id"]
                        isOneToOne: true
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            services: {
                Row: {
                    id: string
                    barber_id: string
                    name: string
                    duration_minutes: number
                    price: number
                    description: string | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    barber_id: string
                    name: string
                    duration_minutes: number
                    price: number
                    description?: string | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    barber_id?: string
                    name?: string
                    duration_minutes?: number
                    price?: number
                    description?: string | null
                    created_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "services_barber_id_fkey"
                        columns: ["barber_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            appointments: {
                Row: {
                    id: string
                    barber_id: string
                    service_id: string | null
                    customer_name: string
                    customer_email: string
                    customer_phone: string
                    start_time: string
                    end_time: string
                    status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | null
                    notes: string | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    barber_id: string
                    service_id?: string | null
                    customer_name: string
                    customer_email: string
                    customer_phone: string
                    start_time: string
                    end_time: string
                    status?: 'pending' | 'confirmed' | 'cancelled' | 'completed' | null
                    notes?: string | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    barber_id?: string
                    service_id?: string | null
                    customer_name?: string
                    customer_email?: string
                    customer_phone?: string
                    start_time?: string
                    end_time?: string
                    status?: 'pending' | 'confirmed' | 'cancelled' | 'completed' | null
                    notes?: string | null
                    created_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "appointments_barber_id_fkey"
                        columns: ["barber_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "appointments_service_id_fkey"
                        columns: ["service_id"]
                        isOneToOne: false
                        referencedRelation: "services"
                        referencedColumns: ["id"]
                    }
                ]
            }
            availability_blocks: {
                Row: {
                    id: string
                    barber_id: string
                    start_time: string
                    end_time: string
                    reason: string | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    barber_id: string
                    start_time: string
                    end_time: string
                    reason?: string | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    barber_id?: string
                    start_time?: string
                    end_time?: string
                    reason?: string | null
                    created_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "availability_blocks_barber_id_fkey"
                        columns: ["barber_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            appointment_status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
        }
    }
}
