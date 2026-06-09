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
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useAdminStore } from '../store/useAdminStore';
import { useBookingStore } from '../store/useBookingStore';
import { useUserStore } from '../store/useUserStore';
import { cn } from '../lib/utils';
import { format, addDays } from 'date-fns';
import { zhCN } from 'date-fns/locale';

type TabType = 'overview' | 'venues' | 'notices' | 'settings' | 'noshow';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const { settings, setDailyBookingLimit, statistics, notices, addNotice, deleteNotice } = useAdminStore();
  const { venues, setMaintenance, selectedDate, setSelectedDate, getTimeSlotsByVenue } = useBookingStore();
  const { orders, markAsNoShow } = useUserStore();

  const [newNoticeTitle, setNewNoticeTitle] = useState('');
  const [newNoticeContent, setNewNoticeContent] = useState('');
  const [newNoticeType, setNewNoticeType] = useState<'announcement' | 'competition' | 'rule'>('announcement');
  const [newNoticeImportant, setNewNoticeImportant] = useState(false);

  const tabs: { value: TabType; label: string; icon: React.ElementType }[] = [
    { value: 'overview', label: '数据概览', icon: BarChart3 },
    { value: 'venues', label: '场地管理', icon: MapPin },
    { value: 'notices', label: '公告管理', icon: Bell },
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
