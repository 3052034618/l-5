import { create } from 'zustand';
import type { Notice, AdminSettings, Statistics } from '../types';
import { notices, adminSettings, generateStatistics } from '../data/mockData';

interface AdminState {
  settings: AdminSettings;
  notices: Notice[];
  statistics: Statistics;
  setDailyBookingLimit: (limit: number) => void;
  setOpenTime: (time: string) => void;
  setCloseTime: (time: string) => void;
  addNotice: (notice: Omit<Notice, 'id'>) => void;
  deleteNotice: (noticeId: string) => void;
  refreshStatistics: () => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  settings: adminSettings,
  notices,
  statistics: generateStatistics(),

  setDailyBookingLimit: (limit) =>
    set((state) => ({
      settings: { ...state.settings, dailyBookingLimit: limit },
    })),
  
  setOpenTime: (time) =>
    set((state) => ({
      settings: { ...state.settings, openTime: time },
    })),
  
  setCloseTime: (time) =>
    set((state) => ({
      settings: { ...state.settings, closeTime: time },
    })),
  
  addNotice: (notice) =>
    set((state) => ({
      notices: [
        {
          ...notice,
          id: `notice-${Date.now()}`,
        },
        ...state.notices,
      ],
    })),
  
  deleteNotice: (noticeId) =>
    set((state) => ({
      notices: state.notices.filter((n) => n.id !== noticeId),
    })),
  
  refreshStatistics: () =>
    set({
      statistics: generateStatistics(),
    }),
}));
