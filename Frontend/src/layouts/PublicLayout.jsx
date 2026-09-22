import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar'
import TopBar from '../components/TopBar'
import Footer from '../components/Footer'
import ScrollToTop from '../components/ScrollToTop'

export default function PublicLayout() {
  return (
    <>
      <ScrollToTop />
      <div className="site-header-fixed">
        <TopBar />
        <Navbar />
      </div>
      <main className="app-main-with-fixed-header">
        <Outlet />
      </main>
      <Footer />
    </>
  )
}

