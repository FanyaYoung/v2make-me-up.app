
import { Home, User, Palette, Camera, Crown, Package } from "lucide-react";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import ShadeMatcher from "./pages/ShadeMatcher";
import VirtualTryOnPage from "./pages/VirtualTryOn";
import PremiumLooks from "./pages/PremiumLooks";
import CosmeticsLibrary from "./pages/CosmeticsLibrary";

export const navItems = [
  {
    title: "Home",
    to: "/",
    icon: <Home className="h-4 w-4" />,
    page: <Landing />,
  },
  {
    title: "Shade Matcher", 
    to: "/shade-matcher",
    icon: <Palette className="h-4 w-4" />,
    page: <ShadeMatcher />,
  },
  {
    title: "Virtual Try-On",
    to: "/virtual-try-on", 
    icon: <Camera className="h-4 w-4" />,
    page: <VirtualTryOnPage />,
  },
  {
    title: "Premium Looks",
    to: "/premium-looks",
    icon: <Crown className="h-4 w-4" />,
    page: <PremiumLooks />,
  },
  {
    title: "Cosmetics Library",
    to: "/cosmetics-library",
    icon: <Package className="h-4 w-4" />,
    page: <CosmeticsLibrary />,
  },
  {
    title: "Auth",
    to: "/auth",
    icon: <User className="h-4 w-4" />,
    page: <Auth />,
  },
];
