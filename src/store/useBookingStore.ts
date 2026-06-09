import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Venue, TimeSlot, BookingFormData, SportType } from '../types';
import { venues, generateTimeSlots } from '../data/mockData';
import { format } from 'date-fns';

const getTodayStr = () => format(new Date(), 'yyyy-MM-dd');

interface BookingState {
  venues: Venue[];
  timeSlots: TimeSlot[];
  selectedDate: string;
  selectedSport: SportType | 'all';
  formData: BookingFormData;
  setSelectedDate: (date: string) => void;
  setSelectedSport: (sport: SportType | 'all') => void;
  setFormData: (data: Partial<BookingFormData>) => void;
  resetFormData: () => void;
  getFilteredVenues: () => Venue[];
  getFilteredTimeSlots: () => TimeSlot[];
  getTimeSlotsByVenue: (venueId: string) => TimeSlot[];
  getTimeSlotsByVenueAndDate: (venueId: string, date: string) => TimeSlot[];
  bookTimeSlot: (timeSlotId: string) => void;
  cancelBooking: (timeSlotId: string) => void;
  setMaintenance: (venueId: string, date: string, isMaintenance: boolean) => void;
  setCompetition: (venueId: string, date: string, competitionName: string, timeRange: string) => void;
  setCompetitionBySlots: (venueId: string, date: string, slotIds: string[], competitionName: string) => void;
  cancelCompetition: (venueId: string, date: string, slotIds: string[]) => void;
}

const initialFormData: BookingFormData = {
  sportType: null,
  venueId: null,
  date: getTodayStr(),
  timeSlotId: null,
  peopleCount: 1,
  contactName: '',
  contactPhone: '',
};

export const useBookingStore = create<BookingState>()(
  persist(
    (set, get) => ({
      venues,
      timeSlots: generateTimeSlots(14),
      selectedDate: getTodayStr(),
      selectedSport: 'all',
      formData: initialFormData,

      setSelectedDate: (date) => set({ selectedDate: date }),
      
      setSelectedSport: (sport) => set({ selectedSport: sport }),
      
      setFormData: (data) =>
        set((state) => ({
          formData: { ...state.formData, ...data },
        })),
      
      resetFormData: () => set({ formData: initialFormData }),
      
      getFilteredVenues: () => {
        const { venues, selectedSport } = get();
        if (selectedSport === 'all') return venues;
        return venues.filter((v) => v.type === selectedSport);
      },
      
      getFilteredTimeSlots: () => {
        const { timeSlots, selectedDate, selectedSport, venues } = get();
        const venueIds = selectedSport === 'all' 
          ? venues.map(v => v.id)
          : venues.filter(v => v.type === selectedSport).map(v => v.id);
        
        return timeSlots.filter(
          (slot) => slot.date === selectedDate && venueIds.includes(slot.venueId)
        );
      },
      
      getTimeSlotsByVenue: (venueId) => {
        const { timeSlots, selectedDate } = get();
        return timeSlots.filter(
          (slot) => slot.venueId === venueId && slot.date === selectedDate
        );
      },

      getTimeSlotsByVenueAndDate: (venueId, date) => {
        const { timeSlots } = get();
        return timeSlots.filter(
          (slot) => slot.venueId === venueId && slot.date === date
        );
      },
      
      bookTimeSlot: (timeSlotId) =>
        set((state) => ({
          timeSlots: state.timeSlots.map((slot) =>
            slot.id === timeSlotId ? { ...slot, status: 'booked' as const } : slot
          ),
        })),
      
      cancelBooking: (timeSlotId) =>
        set((state) => ({
          timeSlots: state.timeSlots.map((slot) =>
            slot.id === timeSlotId ? { ...slot, status: 'available' as const } : slot
          ),
        })),
      
      setMaintenance: (venueId, date, isMaintenance) =>
        set((state) => ({
          timeSlots: state.timeSlots.map((slot) => {
            if (slot.venueId !== venueId || slot.date !== date) return slot;
            
            if (isMaintenance) {
              if (slot.status === 'available') {
                return { ...slot, status: 'maintenance' as const };
              }
              return slot;
            } else {
              if (slot.status === 'maintenance') {
                return { ...slot, status: 'available' as const };
              }
              return slot;
            }
          }),
        })),
      
      setCompetition: (venueId, date, competitionName, timeRange) =>
        set((state) => {
          const [start, end] = timeRange.split('-');
          return {
            timeSlots: state.timeSlots.map((slot) => {
              if (
                slot.venueId === venueId &&
                slot.date === date &&
                slot.startTime >= start &&
                slot.startTime < end
              ) {
                return { ...slot, status: 'competition' as const, competitionName };
              }
              return slot;
            }),
          };
        }),

      setCompetitionBySlots: (venueId, date, slotIds, competitionName) =>
        set((state) => ({
          timeSlots: state.timeSlots.map((slot) => {
            if (slot.venueId === venueId && slot.date === date && slotIds.includes(slot.id)) {
              if (slot.status === 'available') {
                return { ...slot, status: 'competition' as const, competitionName };
              }
            }
            return slot;
          }),
        })),

      cancelCompetition: (venueId, date, slotIds) =>
        set((state) => ({
          timeSlots: state.timeSlots.map((slot) => {
            if (slot.venueId === venueId && slot.date === date && slotIds.includes(slot.id)) {
              if (slot.status === 'competition') {
                return { ...slot, status: 'available' as const, competitionName: undefined };
              }
            }
            return slot;
          }),
        })),
    }),
    {
      name: 'gym-booking-store',
      partialize: (state) => ({ timeSlots: state.timeSlots, selectedDate: state.selectedDate }),
    }
  )
);
