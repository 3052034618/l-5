import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  QrCode,
  Clock,
  Calendar,
  MapPin,
  Users,
  User,
  Phone,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Target,
  CircleDot,
  Dumbbell,
} from 'lucide-react';
import { useUserStore } from '../store/useUserStore';
import type { SportType } from '../types';
import { cn } from '../lib/utils';
import { format, parseISO, isFuture, isPast, differenceInMinutes } from 'date-fns';
import { zhCN } from 'date-fns/locale';

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

export default function VerificationPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { getOrderById, orders } = useUserStore();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const displayOrder = orderId 
    ? getOrderById(orderId) 
    : orders.find((o) => o.status === 'pending');

  if (!displayOrder) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-slate-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">未找到订单</h2>
          <p className="text-slate-500 mb-6">该订单不存在或已被删除</p>
          <button
            onClick={() => navigate('/orders')}
            className="px-6 py-3 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors"
          >
            返回订单列表
          </button>
        </div>
      </div>
    );
  }

  const SportIcon = sportIcons[displayOrder.sportType];
  const orderStartDateTime = parseISO(`${displayOrder.date}T${displayOrder.startTime}:00`);
  const orderEndDateTime = parseISO(`${displayOrder.date}T${displayOrder.endTime}:00`);
  const isUpcoming = isFuture(orderStartDateTime);
  const isOngoing = !isFuture(orderStartDateTime) && isFuture(orderEndDateTime);
  const isExpired = isPast(orderEndDateTime);

  const minutesUntilStart = differenceInMinutes(orderStartDateTime, currentTime);
  const countdownText = minutesUntilStart > 60
    ? `${Math.floor(minutesUntilStart / 60)}小时${minutesUntilStart % 60}分钟后开始`
    : minutesUntilStart > 0
    ? `${minutesUntilStart}分钟后开始`
    : '已开始';

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">入场核验</h2>
          <p className="text-sm text-slate-500 mt-1">扫码入场，快速核验</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 text-white text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-3">
            <SportIcon className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold">{displayOrder.venueName}</h3>
          <p className="text-orange-100 text-sm mt-1">{sportNames[displayOrder.sportType]}</p>
        </div>

        <div className="p-6">
          <div className="flex justify-center mb-6">
            <div className="relative p-4 bg-white border-4 border-slate-100 rounded-2xl shadow-inner">
              <QRCodeSVG
                value={`gym-booking:${displayOrder.orderNo}`}
                size={200}
                level="H"
                includeMargin={false}
                bgColor="#ffffff"
                fgColor="#0f172a"
              />
              {displayOrder.isVerified && (
                <div className="absolute inset-0 bg-green-500/90 rounded-2xl flex items-center justify-center">
                  <div className="text-center text-white">
                    <CheckCircle className="w-16 h-16 mx-auto mb-2" />
                    <p className="font-bold text-lg">已核验</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="text-center mb-6">
            <p className="text-sm text-slate-500">订单号</p>
            <p className="text-lg font-mono font-bold text-slate-800">{displayOrder.orderNo}</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-slate-500">日期</p>
                <p className="font-medium text-slate-800">
                  {format(parseISO(displayOrder.date), 'yyyy年MM月dd日 EEEE', { locale: zhCN })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center">
                <Clock className="w-5 h-5 text-cyan-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-500">时间</p>
                <p className="font-medium text-slate-800">
                  {displayOrder.startTime} - {displayOrder.endTime}
                </p>
              </div>
              <div className={cn(
                'px-3 py-1 rounded-full text-xs font-medium',
                isUpcoming ? 'bg-orange-100 text-orange-700' :
                isOngoing ? 'bg-green-100 text-green-700' :
                'bg-gray-100 text-gray-600'
              )}>
                {isUpcoming ? countdownText : isOngoing ? '进行中' : '已结束'}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-slate-500">场地</p>
                <p className="font-medium text-slate-800">{displayOrder.venueName}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                <Users className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-slate-500">预约人数</p>
                <p className="font-medium text-slate-800">{displayOrder.peopleCount} 人</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center gap-3 mb-2">
                <User className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600">{displayOrder.contactName}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600">{displayOrder.contactPhone}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-sm">费用</span>
            <span className={cn(
              'text-xl font-bold',
              displayOrder.price > 0 ? 'text-orange-600' : 'text-green-600'
            )}>
              {displayOrder.price > 0 ? `¥${displayOrder.price}` : '免费'}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-cyan-50 to-teal-50 rounded-2xl border border-cyan-100 p-5">
        <div className="flex items-start gap-3">
          <QrCode className="w-6 h-6 text-cyan-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-slate-800">使用说明</h4>
            <ul className="mt-2 text-sm text-slate-600 space-y-1">
              <li>• 请在预约开始前 15 分钟内到场扫码入场</li>
              <li>• 向工作人员出示此二维码进行核验</li>
              <li>• 如需取消请提前 1 小时操作</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
