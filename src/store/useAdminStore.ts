import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Notice, AdminSettings, Statistics, Order } from '../types';
import { notices, adminSettings } from '../data/mockData';
import { format, addDays, startOfDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const getTodayStr = () => format(new Date(), 'yyyy-MM-dd');

interface AdminState {
  settings: AdminSettings;
  notices: Notice[];
  statistics: Statistics;
  setDailyBookingLimit: (limit: number) => void;
  setOpenTime: (time: string) => void;
  setCloseTime: (time: string) => void;
  addNotice: (notice: Omit<Notice, 'id'>) => void;
  deleteNotice: (noticeId: string) => void;
  refreshStatistics: (orders: Order[]) => void;
}

function calculateStatistics(orders: Order[]): Statistics {
  const dailyData = [];
  const today = startOfDay(new Date());
  
  for (let i = 6; i >= 0; i--) {
    const date = addDays(today, -i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayOrders = orders.filter(o => o.date === dateStr && o.status !== 'cancelled');
    const bookings = dayOrders.length;
    const checkIns = dayOrders.filter(o => o.status === 'completed').length;
    
    dailyData.push({
      date: format(date, 'MM-dd', { locale: zhCN }),
      bookings,
      checkIns,
    });
  }
  
  const totalBookings = orders.filter(o => o.status !== 'cancelled').length;
  const totalCheckIns = orders.filter(o => o.status === 'completed').length;
  const noShowCount = orders.filter(o => o.status === 'no_show').length;
  
  return {
    totalBookings,
    totalCheckIns,
    attendanceRate: totalBookings > 0 ? Math.round((totalCheckIns / totalBookings) * 100) : 0,
    noShowCount,
    dailyData,
  };
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
      settings: adminSettings,
      notices,
      statistics: {
        totalBookings: 0,
        totalCheckIns: 0,
        attendanceRate: 0,
        noShowCount: 0,
        dailyData: [],
      },

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
      
      refreshStatistics: (orders) =>
        set({
          statistics: calculateStatistics(orders),
        }),
    }),
    {
      name: 'gym-admin-store',
      partialize: (state) => ({ settings: state.settings, notices: state.notices, statistics: state.statistics }),
    }
  )
);
