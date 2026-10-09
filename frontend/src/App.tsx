import { BrowserRouter, Route, Routes } from 'react-router'
import { useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import './index.css'

import LandingPage from './pages/LandingPage'
import SignInPage from './pages/SignInPage'
import DashboardPage from './pages/DashboardPage'

import TestComponent from './pages/TestComponent'

import { ROUTES } from './routes'
import ProtectedRoute from './components/ProtectedRoute'
import PublicRoute from './components/PublicRoute'
import BackendStatusBanner from './components/BackendStatusBanner'
import Overview from './modules/dashboard/content/Overview'
import Messages from './modules/dashboard/content/Messages'
import Appointments from './modules/dashboard/content/Appointments'
import MyDevices from './modules/dashboard/content/MyDevices'
import Profile from './modules/dashboard/content/Profile'
import Adminstration from './modules/dashboard/content/Adminstration'
import SettingsDashboard from './modules/dashboard/content/Settings'
import RoleGuard from './components/common/RoleGuard'
import Workspace from './modules/dashboard/content/Workspace'
import RepairQueue from './modules/dashboard/content/RepairQueue'
import PartsInventory from './modules/dashboard/content/PartsInventory'
import POS from './modules/dashboard/content/POS'
import Customers from './modules/dashboard/content/Customers'
import Devices from './modules/dashboard/content/Devices'
import Technicians from './modules/dashboard/content/Technicians'
import Staff from './modules/dashboard/content/Staff'
import Reports from './modules/dashboard/content/Reports'
import ArchivePage from './modules/dashboard/content/Archive'
import LoadingScreen from './components/common/LoadingScreen'
import { LoadingProvider } from './context/LoadingContext'
import { EventProvider } from './context/EventContext'

export default function App() {
  const { loading } = useAuth();

  return (
    <ThemeProvider>
      <BrowserRouter>


        <BackendStatusBanner />
        {loading && <LoadingScreen />}
        <Routes>


          <Route path={ROUTES.LANDINGPAGE} element={
            <PublicRoute>
              <LandingPage/>
            </PublicRoute>
          }/>

          <Route path={ROUTES.AUTHPAGE} element={
            <PublicRoute>
              <SignInPage/>
            </PublicRoute>
          }/>

          <Route path={ROUTES.DASHBOARD.ROOT} element={
            <ProtectedRoute skip={false}>
              <RoleGuard>
                <EventProvider>
                  <LoadingProvider>
                    <DashboardPage/>
                  </LoadingProvider>
                </EventProvider>
              </RoleGuard>
            </ProtectedRoute>
          }>
            <Route index element={<Overview />} />
            <Route path={ROUTES.DASHBOARD.MESSAGES} element={<Messages />} />
            <Route path={ROUTES.DASHBOARD.APPOINTMENTS} element={<Appointments />} />
            <Route path={ROUTES.DASHBOARD.MY_DEVICES} element={<MyDevices />} />
            <Route path={ROUTES.DASHBOARD.PROFILE} element={<Profile />} />
            <Route path={ROUTES.DASHBOARD.ADMINISTRATION} element={<Adminstration />} />
            <Route path={ROUTES.DASHBOARD.SETTINGS} element={<SettingsDashboard />} />
            <Route path={ROUTES.DASHBOARD.ARCHIVE} element={<ArchivePage />} />

            {/* Workspace / role-specific */}
            <Route path={ROUTES.DASHBOARD.WORKSPACE} element={<Workspace />} />
            <Route path={ROUTES.DASHBOARD.REPAIR_QUEUE} element={<RepairQueue />} />
            <Route path={ROUTES.DASHBOARD.PARTS_INVENTORY} element={<PartsInventory />} />
            <Route path={ROUTES.DASHBOARD.POS} element={<POS />} />
            <Route path={ROUTES.DASHBOARD.CUSTOMERS} element={<Customers />} />
            <Route path={ROUTES.DASHBOARD.DEVICES} element={<Devices />} />
            <Route path={ROUTES.DASHBOARD.TECHNICIANS} element={<Technicians />} />
            <Route path={ROUTES.DASHBOARD.STAFF} element={<Staff />} />
            <Route path={ROUTES.DASHBOARD.REPORTS} element={<Reports />} />

            <Route path="*" element={<Overview />} />
          </Route>

          {/* http://localhost:5173/test-components */}
          {/* remove after development */}
          <Route path="/test-components" element={<TestComponent/>}/>

        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}
