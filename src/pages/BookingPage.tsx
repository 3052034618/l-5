import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ChevronRight,
  User,
  Phone,
  Users,
  Check,
  AlertCircle,
  ArrowLeft,
  Target,
  CircleDot,
  Dumbbell,
} from 'lucide-react';
import { useBookingStore } from '../store/useBookingStore';
import { useUserStore } from '../store/useUserStore';
import { useAdminStore } from '../store/useAdminStore';
import type { SportType, TimeSlot, Venue } from '../types';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const sportConfig: Record<SportType, { name: string; icon: React.ElementType; color: string; bgColor: string }> = {
  badminton: { name: '羽毛球', icon: Target, color: 'text-orange-600', bgColor: 'bg-orange-50' },
  tabletennis: { name: '乒乓球', icon: CircleDot, color: 'text-green-600', bgColor: 'bg-green-50' },
  gym: { name: '健身房', icon: Dumbbell, color: 'text-blue-600', bgColor: 'bg-blue-50' },
};

export default function BookingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { venues, selectedDate, setSelectedDate, getTimeSlotsByVenue, bookTimeSlot, formData, setFormData, resetFormData } = useBookingStore();
  const { addOrder, user, getDailyBookingCount } = useUserStore();
  const { settings } = useAdminStore();

  const [step, setStep] = useState(1);
  const [selectedSport, setSelectedSport] = useState<SportType | null>(null);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [peopleCount, setPeopleCount] = useState(1);
  const [contactName, setContactName] = useState(user.name);
  const [contactPhone, setContactPhone] = useState(user.phone);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (location.state) {
      const { venueId, timeSlotId, date, sportType } = location.state as any;
      if (date) setSelectedDate(date);
      if (sportType) {
        setSelectedSport(sportType);
        setStep(2);
      }
      if (venueId) {
        const venue = venues.find((v) => v.id === venueId);
        if (venue) {
          setSelectedVenue(venue);
          setSelectedSport(venue.type);
          setStep(2);
        }
      }
      if (timeSlotId && venueId) {
        const slots = getTimeSlotsByVenue(venueId);
        const slot = slots.find((s) => s.id === timeSlotId);
        if (slot) {
          setSelectedSlot(slot);
          setStep(3);
        }
      }
    }
  }, [location.state, venues, getTimeSlotsByVenue, setSelectedDate]);

  const filteredVenues = selectedSport ? venues.filter((v) => v.type === selectedSport) : venues;
  const availableSlots = selectedVenue ? getTimeSlotsByVenue(selectedVenue.id).filter((s) => s.status === 'available') : [];

  const dailyCount = getDailyBookingCount(selectedDate);
  const canBookMore = dailyCount < settings.dailyBookingLimit;

  const handleSportSelect = (sport: SportType) => {
    setSelectedSport(sport);
    setSelectedVenue(null);
    setSelectedSlot(null);
    setStep(2);
  };

  const handleVenueSelect = (venue: Venue) => {
    setSelectedVenue(venue);
    setSelectedSlot(null);
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
  };

  const validateStep3 = () => {
    const newErrors: Record<string, string> = {};
    if (!contactName.trim()) newErrors.contactName = '请输入联系人姓名';
    if (!contactPhone.trim()) newErrors.contactPhone = '请输入联系电话';
    else if (!/^1[3-9]\d{9}$/.test(contactPhone)) newErrors.contactPhone = '请输入正确的手机号';
    if (peopleCount < 1) newErrors.peopleCount = '人数至少为1';
    if (selectedVenue && peopleCount > selectedVenue.capacity) {
      newErrors.peopleCount = `人数不能超过场地容量 ${selectedVenue.capacity} 人`;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateStep3()) return;
    if (!selectedVenue || !selectedSlot) return;

    const orderNo = `GYM${format(new Date(), 'yyyyMMdd')}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
    
    const duration = parseInt(selectedSlot.endTime) - parseInt(selectedSlot.startTime);
    const price = selectedVenue.isFree ? 0 : selectedVenue.pricePerHour * duration;

    const newOrder: Order = {
      id: `order-${Date.now()}`,
      orderNo,
      venueId: selectedVenue.id,
      venueName: selectedVenue.name,
      sportType: selectedVenue.type,
      date: selectedDate,
      startTime: selectedSlot.startTime,
      endTime: selectedSlot.endTime,
      peopleCount,
      contactName,
      contactPhone,
      price,
      status: 'pending',
      createdAt: new Date().toISOString(),
      isVerified: false,
    };

    bookTimeSlot(selectedSlot.id);
    addOrder(newOrder);
    setLastOrder(newOrder);
    setShowSuccess(true);
  };

  const handleViewOrder = () => {
    resetFormData();
    navigate('/orders');
  };

  if (showSuccess && lastOrder) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">预约成功</h2>
          <p className="text-slate-500 mb-6">您的场地已预约成功，请按时到场</p>
          
          <div className="bg-slate-50 rounded-xl p-4 mb-6 text-left space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-500 text-sm">订单号</span>
              <span className="text-slate-800 font-medium text-sm font-mono">{lastOrder.orderNo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 text-sm">场地</span>
              <span className="text-slate-800 font-medium text-sm">{lastOrder.venueName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 text-sm">时间</span>
              <span className="text-slate-800 font-medium text-sm">
                {format(new Date(lastOrder.date), 'MM月dd日')} {lastOrder.startTime}-{lastOrder.endTime}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 text-sm">人数</span>
              <span className="text-slate-800 font-medium text-sm">{lastOrder.peopleCount} 人</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-200">
              <span className="text-slate-600 font-medium">费用</span>
              <span className="text-orange-600 font-bold text-lg">
                {lastOrder.price > 0 ? `¥${lastOrder.price}` : '免费'}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex-1 px-4 py-3 rounded-xl bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors"
            >
              返回首页
            </button>
            <button
              onClick={handleViewOrder}
              className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/25"
            >
              查看订单
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">预约场地</h2>
          <p className="text-sm text-slate-500 mt-1">选择项目、场地和时段，完成预约</p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 py-4">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all',
                step >= s
                  ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25'
                  : 'bg-slate-100 text-slate-400'
              )}
            >
              {step > s ? <Check className="w-5 h-5" /> : s}
            </div>
            {s < 3 && (
              <div
                className={cn(
                  'w-16 h-1 mx-2 rounded transition-all',
                  step > s ? 'bg-orange-500' : 'bg-slate-200'
                )}
              />
            )}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        {step === 1 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-800">选择运动项目</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(Object.keys(sportConfig) as SportType[]).map((sport) => {
                const config = sportConfig[sport];
                const Icon = config.icon;
                return (
                  <button
                    key={sport}
                    onClick={() => handleSportSelect(sport)}
                    className={cn(
                      'p-6 rounded-2xl border-2 transition-all duration-200 text-left group',
                      selectedSport === sport
                        ? 'border-orange-500 bg-orange-50/50 shadow-md'
                        : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                    )}
                  >
                    <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center mb-4', config.bgColor)}>
                      <Icon className={cn('w-7 h-7', config.color)} />
                    </div>
                    <h4 className="font-semibold text-slate-800 text-lg">{config.name}</h4>
                    <p className="text-sm text-slate-500 mt-1">
                      {venues.filter((v) => v.type === sport).length} 个场地
                    </p>
                    <div className="mt-4 flex items-center text-orange-500 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      选择项目 <ChevronRight className="w-4 h-4 ml-1" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">选择场地和时段</h3>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span>今日已预约 {dailyCount}/{settings.dailyBookingLimit} 次</span>
                {!canBookMore && (
                  <span className="text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    已达上限
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredVenues.map((venue) => (
                <button
                  key={venue.id}
                  onClick={() => handleVenueSelect(venue)}
                  className={cn(
                    'p-4 rounded-xl border-2 transition-all text-left',
                    selectedVenue?.id === venue.id
                      ? 'border-cyan-500 bg-cyan-50/50'
                      : 'border-slate-200 hover:border-slate-300'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-slate-800">{venue.name}</h4>
                      <p className="text-sm text-slate-500 mt-1">{venue.description}</p>
                    </div>
                    <div className="text-right">
                      <span className={venue.isFree ? 'text-green-600' : 'text-orange-600'}>
                        {venue.isFree ? '免费' : `¥${venue.pricePerHour}/小时`}
                      </span>
                      <p className="text-xs text-slate-400 mt-1">容量 {venue.capacity} 人</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {selectedVenue && (
              <div className="space-y-3">
                <h4 className="font-medium text-slate-700">
                  {format(new Date(selectedDate), 'yyyy年MM月dd日 EEEE', { locale: zhCN })}
                </h4>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                  {availableSlots.length > 0 ? (
                    availableSlots.map((slot) => (
                      <button
                        key={slot.id}
                        onClick={() => handleSlotSelect(slot)}
                        disabled={!canBookMore}
                        className={cn(
                          'py-3 px-2 rounded-xl text-sm font-medium transition-all',
                          selectedSlot?.id === slot.id
                            ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md'
                            : canBookMore
                            ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        )}
                      >
                        {slot.startTime}
                        <div className="text-[10px] mt-0.5 opacity-75">{slot.endTime}</div>
                      </button>
                    ))
                  ) : (
                    <p className="col-span-full text-center text-slate-400 py-8">该场地暂无可用时段</p>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 rounded-xl bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors"
              >
                上一步
              </button>
              <button
                onClick={() => selectedSlot && setStep(3)}
                disabled={!selectedSlot}
                className={cn(
                  'flex-1 px-6 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2',
                  selectedSlot
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25 hover:from-orange-600 hover:to-orange-700'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                )}
              >
                下一步 <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-800">填写预约信息</h3>

            <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500 text-sm">场地</span>
                <span className="text-slate-800 font-medium">{selectedVenue?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 text-sm">时间</span>
                <span className="text-slate-800 font-medium">
                  {format(new Date(selectedDate), 'MM月dd日')} {selectedSlot?.startTime} - {selectedSlot?.endTime}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200">
                <span className="text-slate-600 font-medium">费用</span>
                <span className="text-orange-600 font-bold text-lg">
                  {selectedVenue?.isFree ? '免费' : `¥${selectedVenue?.pricePerHour}`}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  联系人姓名
                </label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className={cn(
                    'w-full px-4 py-3 rounded-xl border-2 transition-colors focus:outline-none',
                    errors.contactName
                      ? 'border-red-300 focus:border-red-500 bg-red-50'
                      : 'border-slate-200 focus:border-orange-500 bg-white'
                  )}
                  placeholder="请输入联系人姓名"
                />
                {errors.contactName && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.contactName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-1" />
                  联系电话
                </label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className={cn(
                    'w-full px-4 py-3 rounded-xl border-2 transition-colors focus:outline-none',
                    errors.contactPhone
                      ? 'border-red-300 focus:border-red-500 bg-red-50'
                      : 'border-slate-200 focus:border-orange-500 bg-white'
                  )}
                  placeholder="请输入联系电话"
                />
                {errors.contactPhone && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.contactPhone}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Users className="w-4 h-4 inline mr-1" />
                  预约人数
                </label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setPeopleCount(Math.max(1, peopleCount - 1))}
                    className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 font-bold text-xl hover:bg-slate-200 transition-colors"
                  >
                    -
                  </button>
                  <span className="text-2xl font-bold text-slate-800 w-12 text-center">{peopleCount}</span>
                  <button
                    onClick={() => setPeopleCount(Math.min(selectedVenue?.capacity || 10, peopleCount + 1))}
                    className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 font-bold text-xl hover:bg-slate-200 transition-colors"
                  >
                    +
                  </button>
                  <span className="text-sm text-slate-500">
                    （最多 {selectedVenue?.capacity} 人）
                  </span>
                </div>
                {errors.peopleCount && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.peopleCount}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-3 rounded-xl bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors"
              >
                上一步
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/25"
              >
                确认预约
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
