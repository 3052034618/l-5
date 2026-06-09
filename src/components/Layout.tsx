import { NavLink, useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  ClipboardList,
  Ticket,
  QrCode,
  Bell,
  Settings,
  User,
  ChevronDown,
  Dumbbell,
} from 'lucide-react';
import { useUserStore } from '../store/useUserStore';
import { useState } from 'react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { role, toggleRole, user } = useUserStore();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const navItems = [
    { path: '/', icon: CalendarDays, label: '场地日历' },
    { path: '/booking', icon: ClipboardList, label: '预约场地' },
    { path: '/orders', icon: Ticket, label: '我的订单' },
    { path: '/verification', icon: QrCode, label: '入场核验' },
    { path: '/notice', icon: Bell, label: '公告规则' },
  ];

  if (role === 'admin') {
    navItems.push({ path: '/admin', icon: Settings, label: '管理面板' });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/25">
                <Dumbbell className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800">智慧体育馆</h1>
                <p className="text-xs text-slate-500">Smart Gym Booking</p>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                      isActive
                        ? 'bg-orange-50 text-orange-600'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-medium text-slate-700">{user.name}</p>
                  <p className="text-xs text-slate-500">
                    {role === 'admin' ? '管理员' : '普通用户'}
                  </p>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-medium text-slate-700">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.phone}</p>
                  </div>
                  <button
                    onClick={() => {
                      toggleRole();
                      setShowUserMenu(false);
                      navigate('/');
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    切换为{role === 'admin' ? '普通用户' : '管理员'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 safe-area-bottom">
        <div className="flex items-center justify-around py-2">
          {navItems.slice(0, 5).map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-3 py-1 text-xs font-medium transition-colors ${
                  isActive ? 'text-orange-600' : 'text-slate-500'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-6">
        <div className="animate-fadeIn">{children}</div>
      </main>
    </div>
  );
}
