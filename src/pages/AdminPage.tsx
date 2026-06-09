import { useState } from 'react';
import {
  Settings,
  TrendingUp,
  Users,
  CheckCircle,
  XCircle,
  MapPin,
  Bell,
  Plus,
  Trash2,
  Wrench,
  Trophy,
  Clock,
  Calendar,
  AlertTriangle,
  BarChart3,
  UserX,
  Save,
  Target,
  CircleDot,
  Dumbbell,
  QrCode,
  Search,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useAdminStore } from '../store/useAdminStore';
import { useBookingStore } from '../store/useBookingStore';
import { useUserStore } from '../store/useUserStore';
import { cn } from '../lib/utils';
import { format, addDays } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { SportType } from '../types';

type TabType = 'overview' | 'venues' | 'competitions' | 'notices' | 'verification' | 'settings' | 'noshow';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const { settings, setDailyBookingLimit, statistics, notices, addNotice, deleteNotice } = useAdminStore();
  const { venues, setMaintenance, selectedDate, setSelectedDate, getTimeSlotsByVenue, getTimeSlotsByVenueAndDate, setCompetitionBySlots, cancelCompetition } = useBookingStore();
  const { orders, markAsNoShow, markAsVerified } = useUserStore();

  const [newNoticeTitle, setNewNoticeTitle] = useState('');
  const [newNoticeContent, setNewNoticeContent] = useState('');
  const [newNoticeType, setNewNoticeType] = useState<'announcement' | 'competition' | 'rule'>('announcement');
  const [newNoticeImportant, setNewNoticeImportant] = useState(false);

  const [compSportType, setCompSportType] = useState<SportType | ''>('');
  const [compVenueId, setCompVenueId] = useState('');
  const [compDate, setCompDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [compName, setCompName] = useState('');
  const [selectedSlotIds, setSelectedSlotIds] = useState<string[]>([]);
  const [verifySearch, setVerifySearch] = useState('');

  const tabs: { value: TabType; label: string; icon: React.ElementType }[] = [
    { value: 'overview', label: '数据概览', icon: BarChart3 },
    { value: 'venues', label: '场地管理', icon: MapPin },
    { value: 'competitions', label: '赛事排期', icon: Trophy },
    { value: 'notices', label: '公告管理', icon: Bell },
    { value: 'verification', label: '入场核销', icon: QrCode },
    { value: 'settings', label: '预约设置', icon: Settings },
    { value: 'noshow', label: '爽约管理', icon: UserX },
  ];

  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const completedOrders = orders.filter((o) => o.status === 'completed');
  const noShowOrders = orders.filter((o) => o.status === 'no_show');

  const handleAddNotice = () => {
    if (!newNoticeTitle.trim() || !newNoticeContent.trim()) return;
    addNotice({
      title: newNoticeTitle,
      content: newNoticeContent,
      type: newNoticeType,
      date: format(new Date(), 'yyyy-MM-dd'),
      isImportant: newNoticeImportant,
    });
    setNewNoticeTitle('');
    setNewNoticeContent('');
    setNewNoticeType('announcement');
    setNewNoticeImportant(false);
  };

  const handleToggleMaintenance = (venueId: string) => {
    const slots = getTimeSlotsByVenue(venueId);
    const hasMaintenance = slots.some((s) => s.status === 'maintenance');
    setMaintenance(venueId, selectedDate, !hasMaintenance);
  };

  const filteredVenues = compSportType 
    ? venues.filter(v => v.type === compSportType) 
    : venues;

  const compSlots = compVenueId 
    ? getTimeSlotsByVenueAndDate(compVenueId, compDate) 
    : [];

  const sortedCompSlots = [...compSlots].sort((a, b) => a.startTime.localeCompare(b.startTime));

  const handleToggleSlot = (slotId: string) => {
    setSelectedSlotIds(prev => 
      prev.includes(slotId) 
        ? prev.filter(id => id !== slotId) 
        : [...prev, slotId]
    );
  };

  const formatSelectedTimeRanges = (): string => {
    if (selectedSlotIds.length === 0) return '';
    
    const selectedSlots = sortedCompSlots.filter(s => selectedSlotIds.includes(s.id));
    if (selectedSlots.length === 0) return '';
    
    if (selectedSlots.length === 1) {
      return `${selectedSlots[0].startTime}-${selectedSlots[0].endTime}`;
    }
    
    const ranges: string[] = [];
    let rangeStart = selectedSlots[0].startTime;
    let prevEnd = selectedSlots[0].endTime;
    
    for (let i = 1; i < selectedSlots.length; i++) {
      const slot = selectedSlots[i];
      if (slot.startTime === prevEnd) {
        prevEnd = slot.endTime;
      } else {
        ranges.push(`${rangeStart}-${prevEnd}`);
        rangeStart = slot.startTime;
        prevEnd = slot.endTime;
      }
    }
    ranges.push(`${rangeStart}-${prevEnd}`);
    
    return ranges.join('、');
  };

  const getSelectedCompetitionName = (): string | null => {
    const selectedSlots = compSlots.filter(s => selectedSlotIds.includes(s.id));
    const compSlots2 = selectedSlots.filter(s => s.status === 'competition' && s.competitionName);
    if (compSlots2.length === 0) return null;
    return compSlots2[0].competitionName || null;
  };

  const hasMixedCompetitions = (): boolean => {
    const selectedSlots = compSlots.filter(s => selectedSlotIds.includes(s.id));
    const compNames = new Set(selectedSlots.filter(s => s.status === 'competition').map(s => s.competitionName));
    return compNames.size > 1;
  };

  const canPublish = (): boolean => {
    if (!compVenueId || !compName.trim() || selectedSlotIds.length === 0) return false;
    
    const selectedSlots = compSlots.filter(s => selectedSlotIds.includes(s.id));
    const hasBooked = selectedSlots.some(s => s.status === 'booked');
    const hasMaintenance = selectedSlots.some(s => s.status === 'maintenance');
    if (hasBooked || hasMaintenance) return false;
    
    if (hasMixedCompetitions()) return false;
    
    return true;
  };

  const handlePublishCompetition = () => {
    if (!canPublish()) return;
    
    const venue = venues.find(v => v.id === compVenueId);
    const timeRanges = formatSelectedTimeRanges();
    const existingCompName = getSelectedCompetitionName();
    
    setCompetitionBySlots(compVenueId, compDate, selectedSlotIds, compName);
    
    const actionWord = existingCompName && existingCompName === compName ? '更新' : '发布';
    
    addNotice({
      title: `${compName}（${actionWord}）`,
      content: `${venue?.name || ''}将于${compDate} ${timeRanges}举办${compName}，该时段暂不开放预约。`,
      type: 'competition',
      date: format(new Date(), 'yyyy-MM-dd'),
      isImportant: true,
    });
    
    setCompSportType('');
    setCompVenueId('');
    setCompName('');
    setSelectedSlotIds([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">管理面板</h2>
          <p className="text-sm text-slate-500 mt-1">场馆运营数据和管理功能</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-red-50 rounded-xl border border-red-200">
          <Settings className="w-5 h-5 text-red-500" />
          <span className="text-sm font-medium text-red-700">管理员模式</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  'flex-1 min-w-[120px] py-4 px-4 text-sm font-medium transition-colors relative flex items-center justify-center gap-2 whitespace-nowrap',
                  activeTab === tab.value
                    ? 'text-orange-600 bg-orange-50/50'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {activeTab === tab.value && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-orange-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        <div className="p-6 border-t border-slate-200">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-5 border border-blue-100">
                  <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm mb-3">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="text-sm text-slate-500">总预约数</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{statistics.totalBookings}</p>
                  <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    较上周 +12%
                  </p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 border border-green-100">
                  <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm mb-3">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="text-sm text-slate-500">到场人次</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{statistics.totalCheckIns}</p>
                  <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    较上周 +8%
                  </p>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-5 border border-orange-100">
                  <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm mb-3">
                    <Users className="w-6 h-6 text-orange-600" />
                  </div>
                  <p className="text-sm text-slate-500">到场率</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{statistics.attendanceRate}%</p>
                  <p className="text-xs text-orange-600 mt-2">目标 85%</p>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl p-5 border border-red-100">
                  <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm mb-3">
                    <XCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <p className="text-sm text-slate-500">爽约次数</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{statistics.noShowCount}</p>
                  <p className="text-xs text-red-600 mt-2">需关注</p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-6">
                <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-orange-500" />
                  近 7 天预约 / 到场趋势
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statistics.dailyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748b' }} />
                      <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e2e8f0',
                          borderRadius: '12px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        }}
                      />
                      <Legend />
                      <Bar dataKey="bookings" name="预约数" fill="#f97316" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="checkIns" name="到场数" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'venues' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">场地状态管理</h3>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="space-y-3">
                {venues.map((venue) => {
                  const slots = getTimeSlotsByVenue(venue.id);
                  const hasMaintenance = slots.some((s) => s.status === 'maintenance');
                  const hasCompetition = slots.some((s) => s.status === 'competition');
                  const availableCount = slots.filter((s) => s.status === 'available').length;
                  const bookedCount = slots.filter((s) => s.status === 'booked').length;

                  return (
                    <div
                      key={venue.id}
                      className="rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'w-12 h-12 rounded-xl flex items-center justify-center',
                            hasMaintenance ? 'bg-gray-100' :
                            hasCompetition ? 'bg-blue-50' : 'bg-green-50'
                          )}>
                            <MapPin className={cn(
                              'w-6 h-6',
                              hasMaintenance ? 'text-gray-500' :
                              hasCompetition ? 'text-blue-600' : 'text-green-600'
                            )} />
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-800">{venue.name}</h4>
                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                              <span className="flex items-center gap-1">
                                <CheckCircle className="w-3 h-3 text-green-500" />
                                空闲 {availableCount}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-orange-500" />
                                已订 {bookedCount}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleMaintenance(venue.id)}
                            className={cn(
                              'px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
                              hasMaintenance
                                ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                            )}
                          >
                            <Wrench className="w-4 h-4" />
                            {hasMaintenance ? '恢复开放' : '关闭维护'}
                          </button>
                          
                          {hasCompetition && (
                            <span className="px-3 py-2 rounded-lg bg-blue-50 text-blue-700 text-sm font-medium flex items-center gap-1">
                              <Trophy className="w-4 h-4" />
                              赛事占用
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'competitions' && (
            <div className="space-y-6">
              <h3 className="font-semibold text-slate-800">赛事排期</h3>
              
              <div className="bg-slate-50 rounded-xl p-5 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">运动项目</label>
                  <div className="flex gap-2">
                    {[
                      { value: 'badminton', label: '羽毛球', icon: Target },
                      { value: 'tabletennis', label: '乒乓球', icon: CircleDot },
                      { value: 'gym', label: '健身房', icon: Dumbbell },
                    ].map((item) => (
                      <button
                        key={item.value}
                        onClick={() => {
                          setCompSportType(item.value as SportType);
                          setCompVenueId('');
                          setSelectedSlotIds([]);
                        }}
                        className={cn(
                          'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                          compSportType === item.value
                            ? 'bg-blue-500 text-white shadow-md shadow-blue-500/25'
                            : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                        )}
                      >
                        <item.icon className="w-4 h-4" />
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">选择场地</label>
                    <select
                      value={compVenueId}
                      onChange={(e) => {
                        setCompVenueId(e.target.value);
                        setSelectedSlotIds([]);
                      }}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-white"
                    >
                      <option value="">请选择场地</option>
                      {filteredVenues.map((venue) => (
                        <option key={venue.id} value={venue.id}>
                          {venue.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">选择日期</label>
                    <input
                      type="date"
                      value={compDate}
                      onChange={(e) => {
                        setCompDate(e.target.value);
                        setSelectedSlotIds([]);
                      }}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">赛事名称</label>
                  <input
                    type="text"
                    value={compName}
                    onChange={(e) => setCompName(e.target.value)}
                    placeholder="请输入赛事名称，如：校羽毛球公开赛"
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-white"
                  />
                </div>

                {compVenueId && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      选择时段（可多选）
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                      {compSlots.map((slot) => {
                        const isSelected = selectedSlotIds.includes(slot.id);
                        const isBooked = slot.status === 'booked';
                        const isMaintenance = slot.status === 'maintenance';
                        const isCompetition = slot.status === 'competition';
                        const isDisabled = isBooked || isMaintenance;

                        return (
                          <button
                            key={slot.id}
                            onClick={() => !isDisabled && handleToggleSlot(slot.id)}
                            disabled={isDisabled}
                            className={cn(
                              'px-2 py-3 rounded-lg text-xs font-medium transition-all text-center',
                              isSelected && 'bg-blue-500 text-white shadow-md',
                              !isSelected && !isDisabled && 'bg-white text-slate-700 border border-slate-200 hover:border-blue-400 hover:bg-blue-50',
                              isBooked && 'bg-orange-50 text-orange-500 border border-orange-200 cursor-not-allowed',
                              isMaintenance && 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed',
                              isCompetition && !isSelected && 'bg-blue-50 text-blue-500 border border-blue-200'
                            )}
                          >
                            <div>{slot.startTime}</div>
                            <div className="text-[10px] opacity-75">
                              {isBooked && '已订'}
                              {isMaintenance && '维护'}
                              {isCompetition && !isSelected && '赛事'}
                              {!isBooked && !isMaintenance && !isCompetition && '可选'}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      已选择 <span className="font-medium text-blue-600">{selectedSlotIds.length}</span> 个时段
                      {selectedSlotIds.length > 0 && (
                        <>
                          <span className="mx-2">·</span>
                          <span className="text-slate-600">{formatSelectedTimeRanges()}</span>
                        </>
                      )}
                    </p>
                    {hasMixedCompetitions() && (
                      <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        选中的时段包含不同赛事，请选择同一赛事的时段
                      </p>
                    )}
                    {getSelectedCompetitionName() && !hasMixedCompetitions() && (
                      <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                        <Trophy className="w-3 h-3" />
                        将更新「{getSelectedCompetitionName()}」赛事信息
                      </p>
                    )}
                  </div>
                )}

                <div className="pt-3 border-t border-slate-200">
                  <button
                    onClick={handlePublishCompetition}
                    disabled={!canPublish()}
                    className={cn(
                      'w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2',
                      canPublish()
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/25'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    )}
                  >
                    <Trophy className="w-5 h-5" />
                    {getSelectedCompetitionName() && !hasMixedCompetitions() ? '更新赛事排期' : '发布赛事排期'}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-slate-700">排期说明</h4>
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <ul className="text-sm text-blue-700 space-y-2">
                    <li>• 赛事排期发布后，对应时段将显示为比赛状态（蓝色）</li>
                    <li>• 普通用户无法预约赛事占用的时段</li>
                    <li>• 发布赛事时会自动生成一条赛事公告</li>
                    <li>• 已被预约的时段不能设置为赛事</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notices' && (
            <div className="space-y-6">
              <h3 className="font-semibold text-slate-800">发布公告</h3>
              
              <div className="bg-slate-50 rounded-xl p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">公告类型</label>
                  <div className="flex gap-2">
                    {[
                      { value: 'announcement', label: '普通公告' },
                      { value: 'competition', label: '赛事公告' },
                      { value: 'rule', label: '规则说明' },
                    ].map((type) => (
                      <button
                        key={type.value}
                        onClick={() => setNewNoticeType(type.value as any)}
                        className={cn(
                          'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                          newNoticeType === type.value
                            ? 'bg-orange-500 text-white'
                            : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                        )}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">标题</label>
                  <input
                    type="text"
                    value={newNoticeTitle}
                    onChange={(e) => setNewNoticeTitle(e.target.value)}
                    placeholder="请输入公告标题"
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-orange-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">内容</label>
                  <textarea
                    value={newNoticeContent}
                    onChange={(e) => setNewNoticeContent(e.target.value)}
                    placeholder="请输入公告内容"
                    rows={4}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-orange-500 bg-white resize-none"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newNoticeImportant}
                      onChange={(e) => setNewNoticeImportant(e.target.checked)}
                      className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500"
                    />
                    <span className="text-sm text-slate-600">设为重要公告</span>
                  </label>

                  <button
                    onClick={handleAddNotice}
                    className="px-6 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium hover:from-orange-600 hover:to-orange-700 transition-all flex items-center gap-2 shadow-md shadow-orange-500/20"
                  >
                    <Plus className="w-4 h-4" />
                    发布公告
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-slate-700">已有公告 ({notices.length})</h4>
                {notices.map((notice) => (
                  <div
                    key={notice.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-white border border-slate-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-3">
                      <Bell className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="font-medium text-slate-800">{notice.title}</p>
                        <p className="text-xs text-slate-500">{notice.date}</p>
                      </div>
                      {notice.isImportant && (
                        <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-xs font-medium">
                          重要
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => deleteNotice(notice.id)}
                      className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'verification' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">入场核销</h3>
                <div className="text-sm text-slate-500">
                  待核销 <span className="font-medium text-orange-600">{pendingOrders.length}</span> 单
                  <span className="mx-2">·</span>
                  已核销 <span className="font-medium text-green-600">{completedOrders.length}</span> 单
                </div>
              </div>

              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={verifySearch}
                  onChange={(e) => setVerifySearch(e.target.value)}
                  placeholder="搜索订单号、姓名、手机号..."
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 bg-white"
                />
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-slate-700">待核销订单</h4>
                {pendingOrders
                  .filter((o) => {
                    if (!verifySearch.trim()) return true;
                    const keyword = verifySearch.toLowerCase();
                    return (
                      o.orderNo.toLowerCase().includes(keyword) ||
                      o.contactName.toLowerCase().includes(keyword) ||
                      o.contactPhone.includes(keyword) ||
                      o.venueName.toLowerCase().includes(keyword)
                    );
                  })
                  .map((order) => (
                    <div
                      key={order.id}
                      className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
                            <QrCode className="w-6 h-6 text-orange-500" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{order.venueName}</p>
                            <p className="text-sm text-slate-500">
                              {order.date} {order.startTime}-{order.endTime}
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5 font-mono">
                              {order.orderNo}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-slate-700">{order.contactName}</p>
                          <p className="text-xs text-slate-500">{order.contactPhone}</p>
                          <p className="text-xs text-slate-500 mt-1">{order.peopleCount} 人</p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-slate-100 flex justify-end gap-2">
                        <button
                          onClick={() => markAsVerified(order.id)}
                          className="px-4 py-2 rounded-lg bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-colors flex items-center gap-1.5"
                        >
                          <CheckCircle className="w-4 h-4" />
                          确认入场
                        </button>
                      </div>
                    </div>
                  ))}
                {pendingOrders.filter((o) => {
                  if (!verifySearch.trim()) return true;
                  const keyword = verifySearch.toLowerCase();
                  return (
                    o.orderNo.toLowerCase().includes(keyword) ||
                    o.contactName.toLowerCase().includes(keyword) ||
                    o.contactPhone.includes(keyword) ||
                    o.venueName.toLowerCase().includes(keyword)
                  );
                }).length === 0 && (
                  <div className="text-center py-12 text-slate-400">
                    <QrCode className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>暂无待核销订单</p>
                  </div>
                )}
              </div>

              {completedOrders.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-slate-700">今日已核销</h4>
                  {completedOrders.slice(0, 5).map((order) => (
                    <div
                      key={order.id}
                      className="bg-green-50 rounded-xl border border-green-100 p-3 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <div>
                          <p className="text-sm font-medium text-slate-700">{order.venueName}</p>
                          <p className="text-xs text-slate-500">
                            {order.contactName} · {order.startTime}-{order.endTime}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-green-600 font-medium">已入场</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-lg">
              <h3 className="font-semibold text-slate-800">预约设置</h3>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    每人每日预约上限
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={settings.dailyBookingLimit}
                      onChange={(e) => setDailyBookingLimit(parseInt(e.target.value))}
                      className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                    <span className="w-12 text-center font-bold text-orange-600 text-xl">
                      {settings.dailyBookingLimit}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">次 / 人 / 天</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      开场时间
                    </label>
                    <input
                      type="time"
                      value={settings.openTime}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      闭场时间
                    </label>
                    <input
                      type="time"
                      value={settings.closeTime}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-cyan-50 border border-cyan-200">
                  <h4 className="font-medium text-cyan-800 mb-2">📌 预约规则</h4>
                  <ul className="text-sm text-cyan-700 space-y-1">
                    <li>• 可提前 7 天预约场地</li>
                    <li>• 提前 1 小时可免费取消</li>
                    <li>• 爽约 3 次暂停预约权限 7 天</li>
                    <li>• 学生凭学生证入场</li>
                  </ul>
                </div>
              </div>

              <button className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium hover:from-orange-600 hover:to-orange-700 transition-all flex items-center justify-center gap-2 shadow-md shadow-orange-500/20">
                <Save className="w-5 h-5" />
                保存设置
              </button>
            </div>
          )}

          {activeTab === 'noshow' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">爽约管理</h3>
                <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-medium">
                  {noShowOrders.length} 条爽约记录
                </span>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium">爽约规则</p>
                    <p className="mt-1">用户预约后未按时到场且未提前取消，记为爽约。累计爽约3次将暂停预约权限7天。</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {orders.filter((o) => o.status === 'pending' || o.status === 'completed').map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-white border border-slate-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                        <UserX className="w-5 h-5 text-slate-500" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{order.contactName}</p>
                        <p className="text-xs text-slate-500">
                          {order.venueName} · {order.date} {order.startTime}
                        </p>
                      </div>
                    </div>

                    {order.status === 'pending' ? (
                      <button
                        onClick={() => markAsNoShow(order.id)}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors border border-red-200"
                      >
                        标记爽约
                      </button>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                        已到场
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {noShowOrders.length > 0 && (
                <>
                  <h4 className="font-medium text-slate-700 pt-4 border-t border-slate-200">
                    爽约记录
                  </h4>
                  <div className="space-y-2">
                    {noShowOrders.map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-red-50 border border-red-100"
                      >
                        <div>
                          <p className="text-sm font-medium text-red-800">{order.contactName}</p>
                          <p className="text-xs text-red-600">
                            {order.venueName} · {order.date} {order.startTime}
                          </p>
                        </div>
                        <span className="text-xs text-red-500 font-medium">已标记</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
