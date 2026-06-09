import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Venue, TimeSlot, BookingFormData, SportType, CompetitionInfo } from '../types';
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
  setCompetitionBySlots: (venueId: string, date: string, slotIds: string[], competitionName: string, competitionId?: string) => string;
  cancelCompetition: (venueId: string, date: string, slotIds: string[]) => void;
  updateCompetition: (venueId: string, date: string, oldSlotIds: string[], newSlotIds: string[], competitionName: string, competitionId: string) => void;
  moveCompetition: (competitionId: string, oldVenueId: string, oldDate: string, oldSlotIds: string[], newVenueId: string, newDate: string, newSlotIds: string[], competitionName: string) => boolean;
  getAllCompetitions: () => CompetitionInfo[];
  getCompetitionById: (competitionId: string) => CompetitionInfo | undefined;
  cancelCompetitionById: (competitionId: string) => void;
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

      setCompetitionBySlots: (venueId, date, slotIds, competitionName, competitionId) => {
        const newCompId = competitionId || `comp-${Date.now()}`;
        set((state) => ({
          timeSlots: state.timeSlots.map((slot) => {
            if (slot.venueId === venueId && slot.date === date && slotIds.includes(slot.id)) {
              if (slot.status === 'available') {
                return { ...slot, status: 'competition' as const, competitionName, competitionId: newCompId };
              }
              if (slot.status === 'competition') {
                return { ...slot, competitionName, competitionId: newCompId };
              }
            }
            return slot;
          }),
        }));
        return newCompId;
      },

      cancelCompetition: (venueId, date, slotIds) =>
        set((state) => ({
          timeSlots: state.timeSlots.map((slot) => {
            if (slot.venueId === venueId && slot.date === date && slotIds.includes(slot.id)) {
              if (slot.status === 'competition') {
                return { ...slot, status: 'available' as const, competitionName: undefined, competitionId: undefined };
              }
            }
            return slot;
          }),
        })),

      updateCompetition: (venueId, date, oldSlotIds, newSlotIds, competitionName, competitionId) =>
        set((state) => {
          const slotsToRemove = oldSlotIds.filter(id => !newSlotIds.includes(id));
          const slotsToAdd = newSlotIds.filter(id => !oldSlotIds.includes(id));
          const slotsToKeep = newSlotIds.filter(id => oldSlotIds.includes(id));
          
          return {
            timeSlots: state.timeSlots.map((slot) => {
              if (slot.venueId !== venueId || slot.date !== date) return slot;
              
              if (slotsToRemove.includes(slot.id) && slot.status === 'competition') {
                return { ...slot, status: 'available' as const, competitionName: undefined, competitionId: undefined };
              }
              
              if (slotsToAdd.includes(slot.id) && slot.status === 'available') {
                return { ...slot, status: 'competition' as const, competitionName, competitionId };
              }
              
              if (slotsToKeep.includes(slot.id) && slot.status === 'competition') {
                return { ...slot, competitionName, competitionId };
              }
              
              return slot;
            }),
          };
        }),

      cancelCompetitionById: (competitionId) =>
        set((state) => ({
          timeSlots: state.timeSlots.map((slot) => {
            if (slot.competitionId === competitionId && slot.status === 'competition') {
              return { ...slot, status: 'available' as const, competitionName: undefined, competitionId: undefined };
            }
            return slot;
          }),
        })),

      moveCompetition: (competitionId, oldVenueId, oldDate, oldSlotIds, newVenueId, newDate, newSlotIds, competitionName) => {
        const { timeSlots } = get();
        
        const newSlots = timeSlots.filter(
          slot => slot.venueId === newVenueId && slot.date === newDate && newSlotIds.includes(slot.id)
        );
        
        const hasConflict = newSlots.some(slot => 
          slot.status === 'booked' || 
          slot.status === 'maintenance' || 
          (slot.status === 'competition' && slot.competitionId !== competitionId)
        );
        
        if (hasConflict) return false;
        
        set((state) => ({
          timeSlots: state.timeSlots.map((slot) => {
            if (slot.venueId === oldVenueId && slot.date === oldDate && oldSlotIds.includes(slot.id) && slot.status === 'competition' && slot.competitionId === competitionId) {
              return { ...slot, status: 'available' as const, competitionName: undefined, competitionId: undefined };
            }
            
            if (slot.venueId === newVenueId && slot.date === newDate && newSlotIds.includes(slot.id) && slot.status === 'available') {
              return { ...slot, status: 'competition' as const, competitionName, competitionId };
            }
            
            return slot;
          }),
        }));
        
        return true;
      },

      getAllCompetitions: () => {
        const { timeSlots, venues } = get();
        const competitionMap = new Map<string, { slots: TimeSlot[]; venueId: string; date: string; name: string; id: string }>();
        
        timeSlots.forEach((slot) => {
          if (slot.status === 'competition' && slot.competitionId) {
            const key = slot.competitionId;
            if (!competitionMap.has(key)) {
              competitionMap.set(key, {
                slots: [],
                venueId: slot.venueId,
                date: slot.date,
                name: slot.competitionName || '',
                id: slot.competitionId,
              });
            }
            competitionMap.get(key)!.slots.push(slot);
          }
        });
        
        const competitions: CompetitionInfo[] = [];
        competitionMap.forEach((comp) => {
          const venue = venues.find(v => v.id === comp.venueId);
          const sortedSlots = [...comp.slots].sort((a, b) => a.startTime.localeCompare(b.startTime));
          
          const ranges: string[] = [];
          let rangeStart = sortedSlots[0].startTime;
          let prevEnd = sortedSlots[0].endTime;
          
          for (let i = 1; i < sortedSlots.length; i++) {
            if (sortedSlots[i].startTime === prevEnd) {
              prevEnd = sortedSlots[i].endTime;
            } else {
              ranges.push(`${rangeStart}-${prevEnd}`);
              rangeStart = sortedSlots[i].startTime;
              prevEnd = sortedSlots[i].endTime;
            }
          }
          ranges.push(`${rangeStart}-${prevEnd}`);
          
          competitions.push({
            id: comp.id,
            name: comp.name,
            venueId: comp.venueId,
            venueName: venue?.name || comp.venueId,
            sportType: venue?.type || 'badminton',
            date: comp.date,
            slotIds: sortedSlots.map(s => s.id),
            startTime: sortedSlots[0].startTime,
            endTime: sortedSlots[sortedSlots.length - 1].endTime,
            timeRanges: ranges.join('、'),
          });
        });
        
        return competitions.sort((a, b) => {
          if (a.date !== b.date) return a.date.localeCompare(b.date);
          return a.startTime.localeCompare(b.startTime);
        });
      },

      getCompetitionById: (competitionId) => {
        const all = get().getAllCompetitions();
        return all.find(c => c.id === competitionId);
      },
    }),
    {
      name: 'gym-booking-store',
      partialize: (state) => ({ timeSlots: state.timeSlots, selectedDate: state.selectedDate }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        
        const nameToId = new Map<string, string>();
        let counter = 0;
        
        state.timeSlots = state.timeSlots.map(slot => {
          if (slot.status === 'competition' && slot.competitionName && !slot.competitionId) {
            const key = `${slot.venueId}-${slot.date}-${slot.competitionName}`;
            if (!nameToId.has(key)) {
              counter++;
              nameToId.set(key, `comp-migrated-${Date.now()}-${counter}`);
            }
            return { ...slot, competitionId: nameToId.get(key) };
          }
          return slot;
        });
      },
    }
  )
);
