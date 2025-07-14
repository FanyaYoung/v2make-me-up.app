
import { Home, User, Palette, Camera, Crown, Package, CreditCard } from "lucide-react";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import ShadeMatcher from "./pages/ShadeMatcher";
import VirtualTryOnPage from "./pages/VirtualTryOn";
import PremiumLooks from "./pages/PremiumLooks";
import CosmeticsLibrary from "./pages/CosmeticsLibrary";
import Subscription from "./pages/Subscription";
import SubscriptionSuccess from "./pages/SubscriptionSuccess";
import SubscriptionCanceled from "./pages/SubscriptionCanceled";

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
    title: "Subscription",
    to: "/subscription",
    icon: <CreditCard className="h-4 w-4" />,
    page: <Subscription />,
  },
  {
    title: "Subscription Success",
    to: "/subscription-success",
    icon: <CreditCard className="h-4 w-4" />,
    page: <SubscriptionSuccess />,
  },
  {
    title: "Subscription Canceled",
    to: "/subscription-canceled",
    icon: <CreditCard className="h-4 w-4" />,
    page: <SubscriptionCanceled />,
  },
  {
    title: "Auth",
    to: "/auth",
    icon: <User className="h-4 w-4" />,
    page: <Auth />,
  },
];
