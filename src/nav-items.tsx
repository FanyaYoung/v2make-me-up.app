
import { Home, User, Palette, Camera, Crown, Package, CreditCard, Sparkles, Star } from "lucide-react";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import ShadeMatcher from "./pages/ShadeMatcher";
import VirtualTryOnPage from "./pages/VirtualTryOn";
import PremiumLooks from "./pages/PremiumLooks";
import CosmeticsLibrary from "./pages/CosmeticsLibrary";
import Subscription from "./pages/Subscription";
import SubscriptionSuccess from "./pages/SubscriptionSuccess";
import SubscriptionCanceled from "./pages/SubscriptionCanceled";
import TrueMatchAI from "./pages/TrueMatchAI";
import PerfectMatches from "./pages/PerfectMatches";

export const navItems = [
  {
    title: "Home",
    to: "/",
    icon: <Home className="h-4 w-4" />,
    page: <Landing />,
  },
  {
    title: "TrueMatch AI",
    to: "/truematch-ai",
    icon: <Sparkles className="h-4 w-4" />,
    page: <TrueMatchAI />,
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
    title: "Perfect Matches",
    to: "/perfect-matches",
    icon: <Star className="h-4 w-4" />,
    page: <PerfectMatches />,
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
