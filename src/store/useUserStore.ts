import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Order, User, UserRole, OrderStatus } from '../types';
import { initialOrders, currentUser } from '../data/mockData';
import { useAdminStore } from './useAdminStore';

interface UserState {
  user: User;
  orders: Order[];
  role: UserRole;
  setRole: (role: UserRole) => void;
  toggleRole: () => void;
  addOrder: (order: Order) => void;
  cancelOrder: (orderId: string) => void;
  getOrderById: (orderId: string) => Order | undefined;
  getOrdersByStatus: (status: OrderStatus) => Order[];
  markAsVerified: (orderId: string) => void;
  markAsNoShow: (orderId: string) => void;
  getDailyBookingCount: (date: string) => number;
}

const refreshAdminStats = (orders: Order[]) => {
  try {
    useAdminStore.getState().refreshStatistics(orders);
  } catch (e) {
    // admin store 未初始化时忽略
  }
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: currentUser,
      orders: initialOrders,
      role: 'user',

      setRole: (role) => set({ role }),
      
      toggleRole: () =>
        set((state) => ({
          role: state.role === 'user' ? 'admin' : 'user',
        })),
      
      addOrder: (order) => {
        set((state) => ({
          orders: [order, ...state.orders],
        }));
        refreshAdminStats(get().orders);
      },
      
      cancelOrder: (orderId) => {
        set((state) => ({
          orders: state.orders.map((order) =>
            order.id === orderId ? { ...order, status: 'cancelled' as const } : order
          ),
        }));
        refreshAdminStats(get().orders);
      },
      
      getOrderById: (orderId) => {
        const { orders } = get();
        return orders.find((o) => o.id === orderId);
      },
      
      getOrdersByStatus: (status) => {
        const { orders } = get();
        return orders.filter((o) => o.status === status);
      },
      
      markAsVerified: (orderId) => {
        set((state) => ({
          orders: state.orders.map((order) =>
            order.id === orderId ? { ...order, isVerified: true, status: 'completed' as const } : order
          ),
        }));
        refreshAdminStats(get().orders);
      },
      
      markAsNoShow: (orderId) => {
        set((state) => ({
          orders: state.orders.map((order) =>
            order.id === orderId ? { ...order, status: 'no_show' as const } : order
          ),
        }));
        refreshAdminStats(get().orders);
      },
      
      getDailyBookingCount: (date) => {
        const { orders, user } = get();
        return orders.filter(
          (o) => o.date === date && o.status !== 'cancelled' && o.contactName === user.name
        ).length;
      },
    }),
    {
      name: 'gym-user-store',
      onRehydrateStorage: () => (state) => {
        if (state) {
          refreshAdminStats(state.orders);
        }
      },
    }
  )
);
