import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Guards
import { GuestGuard } from './components/auth/GuestGuard';
import { NotFound } from './pages/NotFound';

// Layouts
import { BaseLayout } from './components/layout/BaseLayout';
import { DashboardLayout } from './components/layout/DashboardLayout';

// Context Providers
import { PropertiesProvider } from './contexts/PropertiesContext';

// Pages
import { Home } from './pages/Home';
import { SignIn } from './pages/SignIn';
import { SignUp } from './pages/SignUp';
import { Dashboard } from './pages/Dashboard';
import { Properties } from './pages/Properties';
import { PropertyDetail } from './pages/PropertyDetail';
import { Tenants } from './pages/Tenants'; 
import { TenantDetail } from './pages/TenantDetail';
import { Staff } from './pages/Staff';
import { StaffDetail } from './pages/StaffDetail';
import { Tickets } from './pages/Tickets';
import { TicketDetail } from './pages/TicketDetail';

import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <PropertiesProvider>
        <Routes>
          <Route element={<BaseLayout />}>
            <Route path="/" element={<Home />} />
            
            {/* GUEST ONLY ROUTES: Logged in users get kicked out of these */}
            <Route element={<GuestGuard />}>
              <Route path="/signin" element={<SignIn />} />
              <Route path="/signup" element={<SignUp />} />
            </Route>

            {/* PROTECTED ROUTES: DashboardLayout handles the Auth check */}
            <Route element={<DashboardLayout />}>
              <Route path="/organizations/:organizationId/dashboard" element={<Dashboard />} />
              
              <Route path="/organizations/:organizationId/tenants" element={<Tenants />} />
              <Route path="/organizations/:organizationId/staff" element={<Staff />} />
              <Route path="/organizations/:organizationId/tickets" element={<Tickets />} />

              <Route path="/organizations/:organizationId/properties" element={<Properties />} />
              <Route 
                path="/organizations/:organizationId/properties/:propertyId" 
                element={<PropertyDetail />} 
              />

              <Route 
                path="/organizations/:organizationId/properties/:propertyId/staff/:userId" 
                element={<StaffDetail />} 
              />

              <Route 
                path="/organizations/:organizationId/properties/:propertyId/tenants/:userId" 
                element={<TenantDetail />} 
              />

              <Route 
                path="/organizations/:organizationId/properties/:propertyId/tickets/:ticketId" 
                element={<TicketDetail />} 
              />

              {/* UNIVERSAL 404 */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Route>
        </Routes>
      </PropertiesProvider>
    </BrowserRouter>
  </React.StrictMode>
);