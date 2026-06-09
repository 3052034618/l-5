import { useState } from 'react';
import {
  Bell,
  Trophy,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Star,
  Calendar,
  Tag,
} from 'lucide-react';
import { useAdminStore } from '../store/useAdminStore';
import { cn } from '../lib/utils';

const typeConfig = {
  announcement: {
    label: '公告通知',
    icon: Bell,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
  },
  competition: {
    label: '赛事活动',
    icon: Trophy,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
  },
  rule: {
    label: '规则说明',
    icon: BookOpen,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
};

type TabType = 'all' | 'announcement' | 'competition' | 'rule';

export default function NoticePage() {
  const { notices } = useAdminStore();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const tabs: { value: TabType; label: string; icon: React.ElementType }[] = [
    { value: 'all', label: '全部', icon: Bell },
    { value: 'announcement', label: '公告', icon: Bell },
    { value: 'competition', label: '赛事', icon: Trophy },
    { value: 'rule', label: '规则', icon: BookOpen },
  ];

  const filteredNotices = activeTab === 'all'
    ? notices
    : notices.filter((n) => n.type === activeTab);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">公告规则</h2>
        <p className="text-sm text-slate-500 mt-1">查看场馆公告、赛事活动和预约规则</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex border-b border-slate-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  'flex-1 py-4 text-sm font-medium transition-colors relative flex items-center justify-center gap-2',
                  activeTab === tab.value
                    ? 'text-orange-600'
                    : 'text-slate-500 hover:text-slate-700'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {activeTab === tab.value && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-orange-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
          {filteredNotices.length > 0 ? (
            filteredNotices.map((notice) => {
              const config = typeConfig[notice.type];
              const Icon = config.icon;
              const isExpanded = expandedId === notice.id;
              const isLong = notice.content.length > 80;

              return (
                <div
                  key={notice.id}
                  className={cn(
                    'rounded-xl border-2 transition-all overflow-hidden',
                    notice.isImportant
                      ? 'border-orange-300 bg-orange-50/30'
                      : `${config.borderColor} bg-white hover:shadow-md`
                  )}
                >
                  <div
                    className="p-4 cursor-pointer"
                    onClick={() => isLong && toggleExpand(notice.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', config.bgColor)}>
                        <Icon className={cn('w-5 h-5', config.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-slate-800">{notice.title}</h4>
                          {notice.isImportant && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-xs font-medium">
                              <Star className="w-3 h-3 fill-current" />
                              重要
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {notice.date}
                          </span>
                          <span className={cn('flex items-center gap-1', config.color)}>
                            <Tag className="w-3 h-3" />
                            {config.label}
                          </span>
                        </div>
                        <p className={cn(
                          'text-sm text-slate-600 mt-3 leading-relaxed',
                          !isExpanded && isLong && 'line-clamp-2'
                        )}>
                          {notice.content}
                        </p>
                        {isLong && (
                          <button className="flex items-center gap-1 mt-2 text-sm text-orange-500 hover:text-orange-600 font-medium">
                            {isExpanded ? (
                              <>
                                收起 <ChevronUp className="w-4 h-4" />
                              </>
                            ) : (
                              <>
                                展开查看 <ChevronDown className="w-4 h-4" />
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Bell className="w-10 h-10 text-slate-300" />
              </div>
              <p className="text-slate-500">暂无相关公告</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100 p-5">
          <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm mb-4">
            <Trophy className="w-6 h-6 text-green-600" />
          </div>
          <h4 className="font-semibold text-slate-800 mb-2">收费标准</h4>
          <ul className="text-sm text-slate-600 space-y-1">
            <li>羽毛球：30元/小时</li>
            <li>乒乓球：免费</li>
            <li>健身房：免费</li>
            <li className="text-xs text-slate-400 pt-1">*学生享半价优惠</li>
          </ul>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border border-blue-100 p-5">
          <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm mb-4">
            <Calendar className="w-6 h-6 text-blue-600" />
          </div>
          <h4 className="font-semibold text-slate-800 mb-2">开放时间</h4>
          <ul className="text-sm text-slate-600 space-y-1">
            <li>周一至周五</li>
            <li className="font-medium">08:00 - 21:00</li>
            <li>周六周日</li>
            <li className="font-medium">09:00 - 20:00</li>
          </ul>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-100 p-5">
          <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm mb-4">
            <BookOpen className="w-6 h-6 text-purple-600" />
          </div>
          <h4 className="font-semibold text-slate-800 mb-2">预约规则</h4>
          <ul className="text-sm text-slate-600 space-y-1">
            <li>• 每日最多预约 2 次</li>
            <li>• 可预约未来 7 天场地</li>
            <li>• 提前 1 小时可取消</li>
            <li>• 爽约 3 次暂停权限</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
