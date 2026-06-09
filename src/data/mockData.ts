import type { Venue, TimeSlot, Order, Notice, User, AdminSettings, Statistics } from '../types';
import { addDays, format } from 'date-fns';

const today = new Date();

export const venues: Venue[] = [
  {
    id: 'badminton-1',
    name: '羽毛球场 1号',
    type: 'badminton',
    capacity: 4,
    pricePerHour: 30,
    isFree: false,
    description: '标准羽毛球场地，专业地胶',
  },
  {
    id: 'badminton-2',
    name: '羽毛球场 2号',
    type: 'badminton',
    capacity: 4,
    pricePerHour: 30,
    isFree: false,
    description: '标准羽毛球场地，专业地胶',
  },
  {
    id: 'badminton-3',
    name: '羽毛球场 3号',
    type: 'badminton',
    capacity: 4,
    pricePerHour: 30,
    isFree: false,
    description: '标准羽毛球场地，专业地胶',
  },
  {
    id: 'tabletennis-1',
    name: '乒乓球桌 1号',
    type: 'tabletennis',
    capacity: 2,
    pricePerHour: 15,
    isFree: true,
    description: '红双喜乒乓球桌，免费使用',
  },
  {
    id: 'tabletennis-2',
    name: '乒乓球桌 2号',
    type: 'tabletennis',
    capacity: 2,
    pricePerHour: 15,
    isFree: true,
    description: '红双喜乒乓球桌，免费使用',
  },
  {
    id: 'tabletennis-3',
    name: '乒乓球桌 3号',
    type: 'tabletennis',
    capacity: 2,
    pricePerHour: 15,
    isFree: true,
    description: '红双喜乒乓球桌，免费使用',
  },
  {
    id: 'gym-1',
    name: '健身房 A区',
    type: 'gym',
    capacity: 20,
    pricePerHour: 0,
    isFree: true,
    description: '有氧器械区，跑步机、椭圆机等',
  },
  {
    id: 'gym-2',
    name: '健身房 B区',
    type: 'gym',
    capacity: 15,
    pricePerHour: 0,
    isFree: true,
    description: '力量器械区，哑铃、杠铃等',
  },
];

const timeSlotsTemplate = [
  { start: '08:00', end: '09:00' },
  { start: '09:00', end: '10:00' },
  { start: '10:00', end: '11:00' },
  { start: '11:00', end: '12:00' },
  { start: '14:00', end: '15:00' },
  { start: '15:00', end: '16:00' },
  { start: '16:00', end: '17:00' },
  { start: '17:00', end: '18:00' },
  { start: '18:00', end: '19:00' },
  { start: '19:00', end: '20:00' },
  { start: '20:00', end: '21:00' },
];

function generateTimeSlotsForDate(dateStr: string): TimeSlot[] {
  const slots: TimeSlot[] = [];
  
  venues.forEach((venue) => {
    timeSlotsTemplate.forEach((slot, index) => {
      const random = Math.random();
      let status: TimeSlot['status'] = 'available';
      let competitionName: string | undefined;
      
      if (venue.id === 'badminton-1' && index === 3) {
        status = 'competition';
        competitionName = '校羽毛球赛';
      }
      
      if (venue.id === 'gym-2' && index >= 8) {
        status = 'maintenance';
      }
      
      if (status === 'available') {
        if (random < 0.4) {
          status = 'booked';
        }
      }
      
      slots.push({
        id: `${venue.id}-${dateStr}-${slot.start}`,
        startTime: slot.start,
        endTime: slot.end,
        venueId: venue.id,
        date: dateStr,
        status,
        competitionName,
      });
    });
  });
  
  return slots;
}

export function generateTimeSlots(days: number = 7): TimeSlot[] {
  const allSlots: TimeSlot[] = [];
  for (let i = 0; i < days; i++) {
    const date = addDays(today, i);
    const dateStr = format(date, 'yyyy-MM-dd');
    allSlots.push(...generateTimeSlotsForDate(dateStr));
  }
  return allSlots;
}

export const initialOrders: Order[] = [
  {
    id: 'order-1',
    orderNo: 'GYM20240610001',
    venueId: 'badminton-1',
    venueName: '羽毛球场 1号',
    sportType: 'badminton',
    date: format(addDays(today, 1), 'yyyy-MM-dd'),
    startTime: '15:00',
    endTime: '17:00',
    peopleCount: 4,
    contactName: '张三',
    contactPhone: '13800138001',
    price: 60,
    status: 'pending',
    createdAt: new Date().toISOString(),
    isVerified: false,
  },
  {
    id: 'order-2',
    orderNo: 'GYM20240609002',
    venueId: 'gym-1',
    venueName: '健身房 A区',
    sportType: 'gym',
    date: format(today, 'yyyy-MM-dd'),
    startTime: '18:00',
    endTime: '20:00',
    peopleCount: 1,
    contactName: '张三',
    contactPhone: '13800138001',
    price: 0,
    status: 'completed',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    isVerified: true,
  },
  {
    id: 'order-3',
    orderNo: 'GYM20240608003',
    venueId: 'tabletennis-1',
    venueName: '乒乓球桌 1号',
    sportType: 'tabletennis',
    date: format(addDays(today, -2), 'yyyy-MM-dd'),
    startTime: '10:00',
    endTime: '11:00',
    peopleCount: 2,
    contactName: '张三',
    contactPhone: '13800138001',
    price: 0,
    status: 'no_show',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    isVerified: false,
  },
];

export const notices: Notice[] = [
  {
    id: 'notice-1',
    title: '关于校羽毛球比赛场地占用通知',
    content: '各位师生请注意，6月15日（周六）全天将举办校羽毛球比赛，届时羽毛球场1号至3号场地将暂停对外开放，比赛结束后恢复正常预约。给您带来的不便，敬请谅解。',
    type: 'competition',
    date: '2024-06-08',
    isImportant: true,
  },
  {
    id: 'notice-2',
    title: '健身房B区设备维护通知',
    content: '为提升健身体验，健身房B区将于每周二、周四晚间19:00-21:00进行设备维护保养。维护期间B区暂停开放，A区正常开放。请合理安排您的健身时间。',
    type: 'announcement',
    date: '2024-06-05',
    isImportant: false,
  },
  {
    id: 'notice-3',
    title: '暑期场馆开放时间调整',
    content: '暑假期间（7月1日-8月31日），体育馆开放时间调整为：周一至周五 09:00-20:00，周六周日 10:00-18:00。请广大师生合理安排运动时间。',
    type: 'announcement',
    date: '2024-06-01',
    isImportant: false,
  },
  {
    id: 'notice-4',
    title: '预约规则说明',
    content: '1. 每人每日最多可预约2个时段；2. 预约需提前1小时取消，未取消且未到场视为爽约；3. 累计爽约3次将暂停预约权限7天；4. 学生凭学生证入场，教职工凭工作证入场；5. 请爱护场地设施，损坏照价赔偿。',
    type: 'rule',
    date: '2024-05-01',
    isImportant: true,
  },
  {
    id: 'notice-5',
    title: '收费标准',
    content: '羽毛球：30元/小时（学生半价）；乒乓球：免费使用；健身房：免费使用；场地预约需提前1天，最长可预约7天内的场地。收费项目支持校园卡和微信支付。',
    type: 'rule',
    date: '2024-05-01',
    isImportant: false,
  },
];

export const currentUser: User = {
  id: 'user-1',
  name: '张三',
  phone: '13800138001',
  role: 'user',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangsan',
};

export const adminSettings: AdminSettings = {
  dailyBookingLimit: 2,
  openTime: '08:00',
  closeTime: '21:00',
};

export function generateStatistics(): Statistics {
  const dailyData = [];
  for (let i = 6; i >= 0; i--) {
    const date = addDays(today, -i);
    dailyData.push({
      date: format(date, 'MM-dd'),
      bookings: Math.floor(Math.random() * 30) + 20,
      checkIns: Math.floor(Math.random() * 25) + 15,
    });
  }
  
  const totalBookings = dailyData.reduce((sum, d) => sum + d.bookings, 0);
  const totalCheckIns = dailyData.reduce((sum, d) => sum + d.checkIns, 0);
  
  return {
    totalBookings,
    totalCheckIns,
    attendanceRate: Math.round((totalCheckIns / totalBookings) * 100),
    noShowCount: Math.floor(Math.random() * 10) + 3,
    dailyData,
  };
}
