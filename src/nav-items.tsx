
import { Home, User, Palette, ShoppingCart, Package } from "lucide-react";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import ShadeMatcher from "./pages/ShadeMatcher";
import CosmeticsLibrary from "./pages/CosmeticsLibrary";
import Cart from "./pages/Cart";

export const navItems = [
  {
    title: "Home",
    to: "/",
    icon: <Home className="h-4 w-4" />,
    page: <Landing />,
  },
  {
    title: "AI Shade Match", 
    to: "/shade-matcher",
    icon: <Palette className="h-4 w-4" />,
    page: <ShadeMatcher />,
  },
  {
    title: "Browse Products",
    to: "/products",
    icon: <Package className="h-4 w-4" />,
    page: <CosmeticsLibrary />,
  },
  {
    title: "Cart",
    to: "/cart",
    icon: <ShoppingCart className="h-4 w-4" />,
    page: <Cart />,
  },
  {
    title: "Auth",
    to: "/auth",
    icon: <User className="h-4 w-4" />,
    page: <Auth />,
  },
];
