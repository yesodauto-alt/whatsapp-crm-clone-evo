import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from 'next-themes'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/hooks/use-auth'
import { LanguageProvider } from '@/hooks/use-language'
import { IntegrationProvider } from '@/hooks/use-integration'

import Layout from './components/Layout'
import DashboardLayout from './components/DashboardLayout'
import Index from './pages/Index'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Contacts from './pages/Contacts'
import Pipeline from './pages/Pipeline'
import Settings from './pages/Settings'
import Chat from './pages/Chat'
import Agents from './pages/Agents'
import Products from './pages/Products'
import Teams from './pages/Teams'
import Reports from './pages/Reports'
import NotFound from './pages/NotFound'
import Onboarding from './pages/Onboarding'
import { Leads, Priorities, Profile, Queue } from './pages/Workspace'
import { KnowledgeBase, LeadDetail, Opportunities, SupportDetail } from './pages/CRMDetails'
import { Automations, Channels, Support, Templates } from './pages/Operations'

// Build trigger for Skip. No runtime or functional behavior.
const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
    <LanguageProvider>
      <BrowserRouter>
        <AuthProvider>
          <IntegrationProvider>
            <TooltipProvider>
              <Sonner position="top-right" richColors />
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
              </Route>

              <Route path="/app" element={<DashboardLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="onboarding" element={<Onboarding />} />
                <Route path="pipeline" element={<Pipeline />} />
                <Route path="contacts" element={<Contacts />} />
                <Route path="conversations" element={<Contacts />} />
                <Route path="chat/:id" element={<Chat />} />
                <Route path="priorities" element={<Priorities />} />
                <Route path="queue" element={<Queue />} />
                <Route path="leads" element={<Leads />} />
                <Route path="leads/:id" element={<LeadDetail />} />
                <Route path="channels" element={<Channels />} />
                <Route path="agents" element={<Agents />} />
                <Route path="knowledge" element={<KnowledgeBase />} />
                <Route path="opportunities" element={<Opportunities />} />
                <Route path="products" element={<Products />} />
                <Route path="reports" element={<Reports />} />
                <Route path="teams" element={<Teams />} />
                <Route path="support" element={<Support />} />
                <Route path="support/:id" element={<SupportDetail />} />
                <Route path="automations" element={<Automations />} />
                <Route path="templates" element={<Templates />} />
                <Route path="profile" element={<Profile />} />
              </Route>

              <Route path="/settings" element={<DashboardLayout />}>
                <Route index element={<Settings />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </IntegrationProvider>
      </AuthProvider>
    </BrowserRouter>
    </LanguageProvider>
  </ThemeProvider>
)

export default App
