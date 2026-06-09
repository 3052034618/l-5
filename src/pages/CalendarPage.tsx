import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CircleDot,
  CheckCircle,
  XCircle,
  Trophy,
  Wrench,
} from 'lucide-react';
import { useBookingStore } from '../store/useBookingStore';
import { useUserStore } from '../store/useUserStore';
import { format, addDays, isToday } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { VenueStatus, SportType } from '../types';
import { cn } from '../lib/utils';

const statusConfig: Record<VenueStatus, { label: string; color: string; bgColor: string; borderColor: string }> = {
  available: {
    label: '空闲',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  booked: {
    label: '已订',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
  },
  maintenance: {
    label: '维护',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-300',
  },
  competition: {
    label: '比赛',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
};

const sportTabs: { value: SportType | 'all'; label: string; icon: string }[] = [
  { value: 'all', label: '全部', icon: '🏟️' },
  { value: 'badminton', label: '羽毛球', icon: '🏸' },
  { value: 'tabletennis', label: '乒乓球', icon: '🏓' },
  { value: 'gym', label: '健身房', icon: '🏋️' },
];

export default function CalendarPage() {
  const navigate = useNavigate();
  const {
    selectedDate,
    selectedSport,
    setSelectedDate,
    setSelectedSport,
    getFilteredVenues,
    getTimeSlotsByVenue,
  } = useBookingStore();
  const { role } = useUserStore();

  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);

  const venues = getFilteredVenues();

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(new Date(), i);
    return {
      date,
      dateStr: format(date, 'yyyy-MM-dd'),
      dayName: format(date, 'EEE', { locale: zhCN }),
      dayNum: format(date, 'd'),
      isToday: isToday(date),
      isSelected: selectedDate === format(date, 'yyyy-MM-dd'),
    };
  });

  const timeSlots = venues.length > 0 ? getTimeSlotsByVenue(venues[0].id) : [];

  const handleSlotClick = (venueId: string, slotId: string, status: VenueStatus) => {
    if (status === 'available') {
      navigate('/booking', {
        state: {
          venueId,
          timeSlotId: slotId,
          date: selectedDate,
          sportType: selectedSport === 'all' ? venues.find(v => v.id === venueId)?.type : selectedSport,
        },
      });
    }
  };

  const getStatusIcon = (status: VenueStatus) => {
    switch (status) {
      case 'available':
        return <CheckCircle className="w-3 h-3" />;
      case 'booked':
        return <XCircle className="w-3 h-3" />;
      case 'maintenance':
        return <Wrench className="w-3 h-3" />;
      case 'competition':
        return <Trophy className="w-3 h-3" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">场地日历</h2>
          <p className="text-sm text-slate-500 mt-1">查看各场地时段状态，快速预约</p>
        </div>
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-orange-500" />
          <span className="text-sm font-medium text-slate-700">
            {format(new Date(selectedDate), 'yyyy年MM月dd日 EEEE', { locale: zhCN })}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedDate(format(addDays(new Date(selectedDate), -1), 'yyyy-MM-dd'))}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <span className="text-sm font-medium text-slate-700 w-24 text-center">
              {format(new Date(selectedDate), 'MM月dd日')}
            </span>
            <button
              onClick={() => setSelectedDate(format(addDays(new Date(selectedDate), 1), 'yyyy-MM-dd'))}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            {Object.entries(statusConfig).map(([key, config]) => (
              <div key={key} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded-full ${config.bgColor} border ${config.borderColor}`} />
                <span className={`text-xs ${config.color}`}>{config.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {weekDays.map((day) => (
            <button
              key={day.dateStr}
              onClick={() => setSelectedDate(day.dateStr)}
              className={cn(
                'flex-shrink-0 flex flex-col items-center px-4 py-3 rounded-xl transition-all duration-200 min-w-[60px]',
                day.isSelected
                  ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
              )}
            >
              <span className={cn('text-xs font-medium', day.isSelected ? 'text-orange-100' : 'text-slate-500')}>
                {day.dayName}
              </span>
              <span className={cn('text-lg font-bold mt-1', day.isToday && !day.isSelected && 'text-orange-600')}>
                {day.dayNum}
              </span>
              {day.isToday && (
                <div className={cn('w-1.5 h-1.5 rounded-full mt-1', day.isSelected ? 'bg-white' : 'bg-orange-500')} />
              )}
            </button>
          ))}
        </div>

        <div className="flex gap-2 mb-6">
          {sportTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setSelectedSport(tab.value)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                selectedSport === tab.value
                  ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                  : 'bg-slate-50 text-slate-600 border border-transparent hover:bg-slate-100'
              )}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <div className="min-w-[700px]">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-slate-50 to-slate-100">
                  <th className="p-3 text-left text-sm font-medium text-slate-500 w-28 sticky left-0 bg-gradient-to-r from-slate-50 to-slate-100 z-10">
                    时段
                  </th>
                  {venues.map((venue) => (
                    <th key={venue.id} className="p-3 text-center min-w-[120px]">
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-semibold text-slate-700">{venue.name}</span>
                        <span className={cn(
                          'text-xs mt-1',
                          venue.isFree ? 'text-green-600' : 'text-orange-600'
                        )}>
                          {venue.isFree ? '免费' : `¥${venue.pricePerHour}/小时`}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.length > 0 ? (
                  timeSlots.map((slot) => (
                    <tr key={slot.id} className="border-t border-slate-100">
                      <td className="p-2 sticky left-0 bg-white z-10">
                        <div className="text-sm font-medium text-slate-600">
                          {slot.startTime}
                        </div>
                        <div className="text-xs text-slate-400">
                          {slot.endTime}
                        </div>
                      </td>
                      {venues.map((venue) => {
                        const venueSlot = getTimeSlotsByVenue(venue.id).find(
                          (s) => s.startTime === slot.startTime
                        );
                        if (!venueSlot) {
                          return (
                            <td key={`empty-${venue.id}-${slot.id}`} className="p-2">
                              <div className="h-14" />
                            </td>
                          );
                        }

                        const config = statusConfig[venueSlot.status];
                        const isHovered = hoveredSlot === venueSlot.id;
                        const isClickable = venueSlot.status === 'available';

                        return (
                          <td key={venueSlot.id} className="p-2">
                            <button
                              onClick={() => handleSlotClick(venue.id, venueSlot.id, venueSlot.status)}
                              onMouseEnter={() => setHoveredSlot(venueSlot.id)}
                              onMouseLeave={() => setHoveredSlot(null)}
                              disabled={!isClickable && role === 'user'}
                              className={cn(
                                'w-full h-14 rounded-lg border-2 transition-all duration-200 flex flex-col items-center justify-center relative overflow-hidden',
                                config.bgColor,
                                config.borderColor,
                                isClickable && 'hover:shadow-md hover:-translate-y-0.5 cursor-pointer',
                                !isClickable && 'cursor-not-allowed opacity-75'
                              )}
                            >
                              <div className={cn('flex items-center gap-1', config.color)}>
                                {getStatusIcon(venueSlot.status)}
                                <span className="text-xs font-medium">{config.label}</span>
                              </div>
                              {venueSlot.competitionName && (
                                <span className="text-[10px] text-blue-600 mt-0.5 truncate w-full text-center px-1">
                                  {venueSlot.competitionName}
                                </span>
                              )}
                              {isHovered && isClickable && (
                                <div className="absolute inset-0 bg-orange-500/10 flex items-center justify-center">
                                  <span className="text-xs font-semibold text-orange-600">点击预约</span>
                                </div>
                              )}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={venues.length + 1} className="p-8 text-center text-slate-400">
                      暂无场地数据
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-cyan-50 to-teal-50 rounded-2xl border border-cyan-100 p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm">
            <CircleDot className="w-6 h-6 text-cyan-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-800">预约须知</h3>
            <ul className="mt-2 text-sm text-slate-600 space-y-1">
              <li>• 每人每日最多预约 2 个时段</li>
              <li>• 请提前 1 小时取消预约，否则记为爽约</li>
              <li>• 累计爽约 3 次将暂停预约权限 7 天</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
