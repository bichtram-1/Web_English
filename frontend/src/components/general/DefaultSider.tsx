import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { BookOpen, Layers, Sparkles, ChevronLeft, ChevronRight, BarChart3, PlusCircle } from 'lucide-react';
import { useDecks } from '../../hooks/useDecks';
import { getDeckDetailRoute, ROUTES } from '../../constants/routers';

interface DefaultSiderProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export default function DefaultSider({ collapsed: externalCollapsed, onToggle }: DefaultSiderProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const { decks } = useDecks();

  const collapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;
  const toggle = onToggle || (() => setInternalCollapsed((prev) => !prev));

  return (
    <aside
      className={`relative bg-white border-r border-slate-100 flex flex-col transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Toggle button */}
      <button
        onClick={toggle}
        className="absolute -right-3 top-6 w-6 h-6 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-500 hover:text-indigo-600 z-10"
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <div className="p-4 flex-1 overflow-y-auto space-y-6">
        <div>
          <div className="px-3 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            {!collapsed && 'Danh mục chính'}
          </div>
          <div className="space-y-1">
            <NavLink
              to={ROUTES.HOME}
              end
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <Layers size={18} className="shrink-0" />
              {!collapsed && <span>Tất cả bộ thẻ</span>}
            </NavLink>

            <NavLink
              to={ROUTES.STATS}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <BarChart3 size={18} className="shrink-0" />
              {!collapsed && <span>Tiến độ &amp; Thống kê</span>}
            </NavLink>

            <NavLink
              to={ROUTES.CREATE_DECK}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <PlusCircle size={18} className="shrink-0" />
              {!collapsed && <span>Tạo bộ thẻ mới</span>}
            </NavLink>
          </div>
        </div>

        <div>
          <div className="px-3 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            {!collapsed && <span>Bộ thẻ nổi bật</span>}
            {!collapsed && <Sparkles size={12} className="text-amber-400" />}
          </div>
          <div className="space-y-1">
            {decks.map((deck) => (
              <NavLink
                key={deck.id}
                to={getDeckDetailRoute(deck.id)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
                style={{ fontFamily: 'var(--font-display)' }}
              >
                <BookOpen size={15} className="shrink-0" />
                {!collapsed && <span className="truncate">{deck.title}</span>}
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
