
import { Home, User } from "lucide-react";
import Index from "./pages/Index";
import Auth from "./pages/Auth";

export const navItems = [
  {
    title: "Home",
    to: "/",
    icon: <Home className="h-4 w-4" />,
    page: <Index />,
  },
  {
    title: "Auth",
    to: "/auth",
    icon: <User className="h-4 w-4" />,
    page: <Auth />,
  },
];
