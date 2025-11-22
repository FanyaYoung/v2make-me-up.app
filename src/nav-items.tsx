import { Home, User, Palette, ShoppingCart, Package, Lightbulb, Pipette, ScanFace, Sparkles } from "lucide-react";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import ShadeMatcher from "./pages/ShadeMatcher";
import CosmeticsLibrary from "./pages/CosmeticsLibrary";
import Cart from "./pages/Cart";
import LightingMatcher from "./pages/LightingMatcher";
import PigmentMixer from "./pages/PigmentMixer";
import AISkinAnalyzer from "./pages/AISkinAnalyzer";
import VirtualTryOn from "./pages/VirtualTryOn";

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
    title: "Lighting Matcher",
    to: "/lighting-matcher",
    icon: <Lightbulb className="h-4 w-4" />,
    page: <LightingMatcher />,
  },
  {
    title: "Pigment Mixer",
    to: "/pigment-mixer",
    icon: <Pipette className="h-4 w-4" />,
    page: <PigmentMixer />,
  },
  {
    title: "AI Skin Analyzer",
    to: "/skin-analyzer",
    icon: <ScanFace className="h-4 w-4" />,
    page: <AISkinAnalyzer />,
  },
  {
    title: "Virtual Try-On",
    to: "/virtual-tryon",
    icon: <Sparkles className="h-4 w-4" />,
    page: <VirtualTryOn />,
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
  {
    title: "Auth Callback",
    to: "/auth/callback",
    icon: <User className="h-4 w-4" />,
    page: <AuthCallback />,
  },
];
