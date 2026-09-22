import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import PublicLayout from './layouts/PublicLayout'
import HomePage from './pages/HomePage'
import AboutPage from './pages/AboutPage'
import MassTimesPage from './pages/MassTimesPage'
import ContactPage from './pages/ContactPage'
import DonatePage from './pages/DonatePage'
import OurParishPage from './pages/OurParishPage'
import ParishCouncilPage from './pages/ParishCouncilPage'
import ParishGroupsPage from './pages/ParishGroupsPage'
import GroupJoinPage from './pages/GroupJoinPage'
import BuildingProjectPage from './pages/BuildingProjectPage'
import FundraisingPage from './pages/FundraisingPage'
import SafeguardingPage from './pages/SafeguardingPage'
import NewsEventsPage from './pages/NewsEventsPage'
import EventDetailPage from './pages/EventDetailPage'
import EventsCalendarPage from './pages/EventsCalendarPage'
import NewsAnnouncementsPage from './pages/NewsAnnouncementsPage'
import NewsDetailPage from './pages/NewsDetailPage'
import WeeklyNewsletterPage from './pages/WeeklyNewsletterPage'
import NewsletterArchivePage from './pages/NewsletterArchivePage'
import UsefulLinksPage from './pages/UsefulLinksPage'
import RegistrationPage from './pages/RegistrationPage'
import BaptismPage from './pages/BaptismPage'
import FirstHolyCommunionPage from './pages/FirstHolyCommunionPage'
import ConfirmationPage from './pages/ConfirmationPage'
import MarriagePage from './pages/MarriagePage'
import ReconciliationPage from './pages/ReconciliationPage'
import BecomingCatholicPage from './pages/BecomingCatholicPage'
import PrayerDevotionsPage from './pages/PrayerDevotionsPage'
import PastoralCarePage from './pages/PastoralCarePage'
import SchoolsPage from './pages/SchoolsPage'
import ParkingPage from './pages/ParkingPage'
import CathedralHirePage from './pages/CathedralHirePage'
import DiocesePage from './pages/DiocesePage'
import GalleryPage from './pages/GalleryPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import AdminLayout from './admin/AdminLayout'
import AdminOverviewPage from './pages/admin/AdminOverviewPage'
import AdminEventsPage from './pages/admin/AdminEventsPage'
import AdminMassTimesPage from './pages/admin/AdminMassTimesPage'
import AdminNewslettersPage from './pages/admin/AdminNewslettersPage'
import AdminNewsPage from './pages/admin/AdminNewsPage'
import AdminRegistrationsPage from './pages/admin/AdminRegistrationsPage'
import AdminContactMessagesPage from './pages/admin/AdminContactMessagesPage'
import AdminProfilePage from './pages/admin/AdminProfilePage'
import AdminParishCouncilPage from './pages/admin/AdminParishCouncilPage'
import AdminGroupsPage from './pages/admin/AdminGroupsPage'
import AdminAccountsPage from './pages/admin/AdminAccountsPage'
import AdminMyGroupPage from './pages/admin/AdminMyGroupPage'
import AdminGalleryPage from './pages/admin/AdminGalleryPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/mass-times" element={<MassTimesPage />} />
          <Route path="/mass-sacraments" element={<MassTimesPage />} />
          <Route path="/baptism" element={<BaptismPage />} />
          <Route path="/first-holy-communion" element={<FirstHolyCommunionPage />} />
          <Route path="/confirmation" element={<ConfirmationPage />} />
          <Route path="/marriage" element={<MarriagePage />} />
          <Route path="/reconciliation" element={<ReconciliationPage />} />
          <Route path="/becoming-catholic" element={<BecomingCatholicPage />} />
          <Route path="/prayer-devotions" element={<PrayerDevotionsPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/registration" element={<RegistrationPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          <Route path="/donate" element={<DonatePage />} />
          <Route path="/parish" element={<OurParishPage />} />
          <Route path="/parish-council" element={<ParishCouncilPage />} />
          <Route path="/parish-groups" element={<ParishGroupsPage />} />
          <Route path="/parish-groups/:groupSlug/join" element={<GroupJoinPage />} />
          <Route path="/building-project" element={<BuildingProjectPage />} />
          <Route path="/fundraising" element={<FundraisingPage />} />
          <Route path="/safeguarding" element={<SafeguardingPage />} />
          <Route path="/pastoral-care" element={<PastoralCarePage />} />
          <Route path="/schools" element={<SchoolsPage />} />
          <Route path="/parking" element={<ParkingPage />} />
          <Route path="/cathedral-hire" element={<CathedralHirePage />} />
          <Route path="/news-events" element={<NewsEventsPage />} />
          <Route path="/events" element={<EventsCalendarPage />} />
          <Route path="/events/:eventId" element={<EventDetailPage />} />
          <Route path="/news" element={<NewsAnnouncementsPage />} />
          <Route path="/news/:newsId" element={<NewsDetailPage />} />
          <Route path="/newsletter" element={<WeeklyNewsletterPage />} />
          <Route path="/newsletter-archive" element={<NewsletterArchivePage />} />
          <Route path="/diocese" element={<DiocesePage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/links" element={<UsefulLinksPage />} />
        </Route>

        <Route path="/dashboard" element={<AdminLayout />}>
          <Route index element={<AdminOverviewPage />} />
          <Route path="events" element={<AdminEventsPage />} />
          <Route path="mass-times" element={<AdminMassTimesPage />} />
          <Route path="newsletters" element={<AdminNewslettersPage />} />
          <Route path="news" element={<AdminNewsPage />} />
          <Route path="registrations" element={<AdminRegistrationsPage />} />
          <Route path="contact-messages" element={<AdminContactMessagesPage />} />
          <Route path="parish-council" element={<AdminParishCouncilPage />} />
          <Route path="groups" element={<AdminGroupsPage />} />
          <Route path="gallery" element={<AdminGalleryPage />} />
          <Route path="accounts" element={<AdminAccountsPage />} />
          <Route path="my-group" element={<AdminMyGroupPage />} />
          <Route path="profile" element={<AdminProfilePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
