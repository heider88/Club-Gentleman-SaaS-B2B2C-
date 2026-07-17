import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ActionBottomSheet } from './ActionBottomSheet';

// Mock dependencies
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: [] })),
      })),
    })),
  })),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('@/app/actions/appointments', () => ({
  rescheduleAppointment: vi.fn(),
}));

const mockAppt = {
  id: '123',
  start_time: '2024-01-01T10:00:00Z',
  end_time: '2024-01-01T11:00:00Z',
  customer_name: 'John Doe',
  customer_phone: '1234567890',
  status: 'pending',
  barber_id: 'barber1',
  services: {
    id: 'service1',
    name: 'Haircut',
    price: 20,
    duration_minutes: 30,
  }
};

describe('ActionBottomSheet', () => {
  it('does not show "Cancelar Cita" button when user is not admin', () => {
    render(
      <ActionBottomSheet 
        appt={mockAppt} 
        onClose={() => {}} 
        onAction={async () => {}} 
        isAdmin={false} 
      />
    );
    
    // El botón NO debería estar en el documento
    expect(screen.queryByText('Cancelar Cita')).toBeNull();
  });

  it('shows "Cancelar Cita" button when user is admin', () => {
    render(
      <ActionBottomSheet 
        appt={mockAppt} 
        onClose={() => {}} 
        onAction={async () => {}} 
        isAdmin={true} 
      />
    );
    
    // El botón SÍ debería estar en el documento
    expect(screen.getByText('Cancelar Cita')).toBeTruthy();
  });
});
