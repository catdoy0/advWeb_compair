import { BrowserRouter, Route, Routes } from 'react-router'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import './index.css'

import LandingPage from './pages/LandingPage'
import SignInPage from './pages/SignInPage'
import DashboardPage from './pages/DashboardPage'

import TestComponent from './pages/TestComponent'

import { ROUTES } from './routes'
import ProtectedRoute from './components/ProtectedRoute'
import PublicRoute from './components/PublicRoute'

export default function App() {

  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
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

              <Route path={ROUTES.DASHBOARD} element={
                <ProtectedRoute skip={false}>
                  <DashboardPage/>
                </ProtectedRoute>
              }/>

            {/* http://localhost:5173/test-components */}
            {/* remove after development */}
            <Route path="/test-components" element={<TestComponent/>}/>

          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  )
}

