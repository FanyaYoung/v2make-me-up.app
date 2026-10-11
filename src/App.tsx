
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { navItems } from "./nav-items"
import { Toaster as CustomToaster } from "@/components/ui/toaster"
import { CartProvider } from "@/contexts/CartContext"
import MobileNavigation from "@/components/MobileNavigation"
import NativeAppLifecycle from "@/components/NativeAppLifecycle"

const queryClient = new QueryClient()

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <CartProvider>
          <BrowserRouter>
            <NativeAppLifecycle />
            <Routes>
              {navItems.map(({ to, page }) => (
                <Route key={to} path={to} element={page} />
              ))}
            </Routes>
            <MobileNavigation />
            <Toaster />
            <CustomToaster />
          </BrowserRouter>
        </CartProvider>
      </TooltipProvider>
    </QueryClientProvider>
  )
}

export default App
