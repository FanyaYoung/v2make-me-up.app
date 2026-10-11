import { Home, Palette, Package, Sparkles, User } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const tabs = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/shade-matcher', label: 'Match', icon: Palette },
  { to: '/virtual-tryon', label: 'Try On', icon: Sparkles },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/account', label: 'Account', icon: User },
];

export default function MobileNavigation() {
  return (
    <nav aria-label="Main navigation" className="mobile-navigation fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-rose-100 bg-white/95 backdrop-blur-md md:hidden">
      {tabs.map(({ to, label, icon: Icon }) => (
        <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) =>
          `flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-medium ${isActive ? 'text-rose-600' : 'text-gray-500'}`
        }>
          <Icon className="h-5 w-5" aria-hidden="true" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
