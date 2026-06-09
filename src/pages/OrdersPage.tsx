import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  CheckCircle,
  XCircle,
  XOctagon,
  QrCode,
  Calendar,
  MapPin,
  Users,
  Phone,
  ChevronRight,
  AlertTriangle,
  Target,
  CircleDot,
  Dumbbell,
} from 'lucide-react';
import { useUserStore } from '../store/useUserStore';
import { useBookingStore } from '../store/useBookingStore';
import type { OrderStatus, SportType } from '../types';
import { cn } from '../lib/utils';
import { format, isFuture, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const statusConfig: Record<OrderStatus, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  pending: { label: '待使用', color: 'text-orange-600', bgColor: 'bg-orange-100', icon: Clock },
  completed: { label: '已完成', color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircle },
  cancelled: { label: '已取消', color: 'text-gray-500', bgColor: 'bg-gray-100', icon: XCircle },
  no_show: { label: '已爽约', color: 'text-red-600', bgColor: 'bg-red-100', icon: XOctagon },
};

const sportIcons: Record<SportType, React.ElementType> = {
  badminton: Target,
  tabletennis: CircleDot,
  gym: Dumbbell,
};

const sportNames: Record<SportType, string> = {
  badminton: '羽毛球',
  tabletennis: '乒乓球',
  gym: '健身房',
};

type TabType = 'all' | OrderStatus;

export default function OrdersPage() {
  const navigate = useNavigate();
  const { orders, cancelOrder } = useUserStore();
  const { cancelBooking } = useBookingStore();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [showCancelModal, setShowCancelModal] = useState<string | null>(null);

  const tabs: { value: TabType; label: string }[] = [
    { value: 'all', label: '全部' },
    { value: 'pending', label: '待使用' },
    { value: 'completed', label: '已完成' },
    { value: 'cancelled', label: '已取消' },
  ];

  const filteredOrders = activeTab === 'all' 
    ? orders 
    : orders.filter((o) => o.status === activeTab);

  const handleCancel = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (order) {
      cancelOrder(orderId);
      const timeSlotId = `${order.venueId}-${order.date}-${order.startTime}`;
      cancelBooking(timeSlotId);
    }
    setShowCancelModal(null);
  };

  const isOrderUpcoming = (order: typeof orders[0]) => {
    const orderDateTime = parseISO(`${order.date}T${order.startTime}:00`);
    return isFuture(orderDateTime) && order.status === 'pending';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">我的订单</h2>
        <p className="text-sm text-slate-500 mt-1">查看和管理您的预约订单</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex border-b border-slate-200">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                'flex-1 py-4 text-sm font-medium transition-colors relative',
                activeTab === tab.value
                  ? 'text-orange-600'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              {tab.label}
              {activeTab === tab.value && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-orange-500 rounded-full" />
              )}
            </button>
          ))}
        </div>

        <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => {
              const StatusIcon = statusConfig[order.status].icon;
              const SportIcon = sportIcons[order.sportType];
              const canCancel = isOrderUpcoming(order);

              return (
                <div
                  key={order.id}
                  className={cn(
                    'rounded-xl border-2 p-4 transition-all hover:shadow-md',
                    order.status === 'cancelled' ? 'border-slate-200 bg-slate-50/50 opacity-75' :
                    order.status === 'no_show' ? 'border-red-200 bg-red-50/30' :
                    'border-slate-200 hover:border-slate-300'
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', statusConfig[order.status].bgColor)}>
                        <SportIcon className={cn('w-6 h-6', statusConfig[order.status].color)} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800">{order.venueName}</h3>
                        <p className="text-sm text-slate-500">{sportNames[order.sportType]}</p>
                      </div>
                    </div>
                    <div className={cn(
                      'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium',
                      statusConfig[order.status].bgColor,
                      statusConfig[order.status].color
                    )}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      {statusConfig[order.status].label}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span>{format(parseISO(order.date), 'MM月dd日 EEEE', { locale: zhCN })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>{order.startTime} - {order.endTime}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span>{order.venueName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Users className="w-4 h-4 text-slate-400" />
                      <span>{order.peopleCount} 人</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <div>
                      <span className="text-xs text-slate-500">订单号：{order.orderNo}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        'font-bold',
                        order.price > 0 ? 'text-orange-600' : 'text-green-600'
                      )}>
                        {order.price > 0 ? `¥${order.price}` : '免费'}
                      </span>
                      
                      {order.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setShowCancelModal(order.id)}
                            disabled={!canCancel}
                            className={cn(
                              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                              canCancel
                                ? 'text-red-600 hover:bg-red-50'
                                : 'text-slate-400 cursor-not-allowed'
                            )}
                          >
                            取消预约
                          </button>
                          <button
                            onClick={() => navigate(`/verification/${order.id}`)}
                            className="px-4 py-1.5 rounded-lg text-sm font-medium bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 transition-all flex items-center gap-1.5 shadow-md shadow-orange-500/20"
                          >
                            <QrCode className="w-4 h-4" />
                            入场码
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-10 h-10 text-slate-300" />
              </div>
              <p className="text-slate-500">暂无订单记录</p>
              <button
                onClick={() => navigate('/booking')}
                className="mt-4 px-6 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-colors"
              >
                去预约
              </button>
            </div>
          )}
        </div>
      </div>

      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 text-center mb-2">确认取消预约？</h3>
            <p className="text-slate-500 text-center text-sm mb-6">
              取消后该时段将释放给其他用户预约
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(null)}
                className="flex-1 px-4 py-3 rounded-xl bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors"
              >
                再想想
              </button>
              <button
                onClick={() => handleCancel(showCancelModal)}
                className="flex-1 px-4 py-3 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors"
              >
                确认取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
