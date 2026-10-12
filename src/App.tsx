import { HashRouter, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/callnest/Home';
import HowItWorks from './pages/callnest/HowItWorks';
import Features from './pages/callnest/Features';
import AIFeatures from './pages/callnest/AIFeatures';
import Pricing from './pages/callnest/Pricing';
import WhoItsFor from './pages/callnest/WhoItsFor';
import FAQ from './pages/callnest/FAQ';
import Contact from './pages/callnest/Contact';
import Privacy from './pages/callnest/Privacy';
import Terms from './pages/callnest/Terms';
import EarlyAccess from './pages/callnest/EarlyAccess';
import Admin from './pages/callnest/Admin';
import Results from './pages/callnest/Results';
import MyReviews from './pages/callnest/MyReviews';
import Settings from './pages/callnest/Settings';
import ReviewPage from './pages/callnest/ReviewPage';
import BookingPage from './pages/callnest/BookingPage';
import AIReceptionist from './pages/callnest/AIReceptionist';
import CallLog from './pages/callnest/CallLog';
import Login from './pages/Login';
import Navbar from './components/callnest/Navbar';
import Footer from './components/callnest/Footer';
import AIWidget from './components/callnest/AIWidget';
import SignupModal from './components/callnest/SignupModal';
import AnnouncementBar from './components/callnest/AnnouncementBar';

export default function App() {
  const [signupOpen, setSignupOpen] = useState(false);
  useEffect(() => { const open = () => setSignupOpen(true); window.addEventListener('callnest:open-signup', open); return () => window.removeEventListener('callnest:open-signup', open); }, []);
  useEffect(() => { const open = () => { window.location.hash = '#/early-access'; }; window.addEventListener('callnest:open-early-access', open); return () => window.removeEventListener('callnest:open-early-access', open); }, []);
  const trial = () => setSignupOpen(true);
  return <AuthProvider><HashRouter><div className="min-h-screen bg-[#f8fafc] text-[#0f172a]"><AnnouncementBar /><Navbar onStartTrial={trial} /><main><Routes>
    <Route path="/" element={<Home onStartTrial={trial} />} /><Route path="/how-it-works" element={<HowItWorks onStartTrial={trial} />} /><Route path="/features" element={<Features />} /><Route path="/ai-features" element={<AIFeatures />} /><Route path="/pricing" element={<Pricing onStartTrial={trial} />} /><Route path="/who-its-for" element={<WhoItsFor onStartTrial={trial} />} /><Route path="/faq" element={<FAQ />} /><Route path="/contact" element={<Contact onStartTrial={trial} />} /><Route path="/privacy" element={<Privacy />} /><Route path="/terms" element={<Terms />} /><Route path="/early-access" element={<EarlyAccess />} /><Route path="/login" element={<Login />} />
    <Route element={<ProtectedRoute />}><Route path="/results" element={<Results />} /><Route path="/my-reviews" element={<MyReviews />} /><Route path="/settings" element={<Settings />} /><Route path="/receptionist" element={<AIReceptionist />} /><Route path="/call-log" element={<CallLog />} /></Route>
    <Route path="/review/:token" element={<ReviewPage />} /><Route path="/book/:businessId" element={<BookingPage />} />
    <Route element={<ProtectedRoute role="admin" />}><Route path="/admin" element={<Admin />} /></Route>
  </Routes></main><Footer /><AIWidget /><SignupModal open={signupOpen} onClose={() => setSignupOpen(false)} /></div></HashRouter></AuthProvider>;
}