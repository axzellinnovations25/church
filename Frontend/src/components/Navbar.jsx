import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import './Navbar.css'

function isRouteMatch(pathname, path) {
    if (!path) {
        return false
    }

    if (pathname === path) {
        return true
    }

    return pathname.startsWith(`${path}/`)
}

function getActiveChild(item, pathname) {
    if (!item?.children?.length) {
        return null
    }

    return item.children.find(child => isRouteMatch(pathname, child.path)) || null
}

const navItems = [
    { label: 'Home', path: '/' },
    {
        label: 'Mass & Sacraments',
        path: '/mass-sacraments',
        children: [
            { label: 'Mass & Sacraments', path: '/mass-sacraments' },
            { label: 'Baptism', path: '/baptism' },
            { label: 'First Holy Communion', path: '/first-holy-communion' },
            { label: 'Confirmation', path: '/confirmation' },
            { label: 'Marriage', path: '/marriage' },
            { label: 'Reconciliation', path: '/reconciliation' },
            { label: 'Becoming a Catholic', path: '/becoming-catholic' },
            { label: 'Prayer & Devotions', path: '/prayer-devotions' },
        ],
    },
    {
        label: 'Parish',
        path: '/parish',
        children: [
            { label: 'Our Parish', path: '/parish' },
            { label: 'Parish Council', path: '/parish-council' },
            { label: 'Parish Groups', path: '/parish-groups' },
            { label: 'Photo Gallery', path: '/gallery' },
            { label: 'Building Project', path: '/building-project' },
            { label: 'Fundraising', path: '/fundraising' },
            { label: 'Policies & Safeguarding', path: '/safeguarding' },
            { label: 'Pastoral Care', path: '/pastoral-care' },
            { label: 'Schools Links', path: '/schools' },
            { label: 'Parking', path: '/parking' },
            { label: 'Cathedral Hire', path: '/cathedral-hire' },
        ],
    },
    {
        label: 'News & Events',
        path: '/news-events',
        children: [
            { label: 'News & Events', path: '/news-events' },
            { label: 'Events Calendar', path: '/events' },
            { label: 'News & Announcements', path: '/news' },
            { label: 'Weekly Newsletter', path: '/newsletter' },
            { label: 'Newsletter Archive', path: '/newsletter-archive' },
        ],
    },
    {
        label: 'Contact',
        path: '/contact',
        children: [
            { label: 'Contact Us', path: '/contact' },
            { label: 'Parish Registration', path: '/registration' },
        ],
    },
    {
        label: 'Links',
        path: '/links',
        children: [
            { label: 'Diocese of Wrexham', path: '/diocese' },
            { label: 'Useful Links', path: '/links' },
        ],
    },
]

export default function Navbar() {
    const [mobileOpen, setMobileOpen] = useState(false)
    const [openDropdown, setOpenDropdown] = useState(null)
    const location = useLocation()
    const pathname = location.pathname

    return (
        <nav className="navbar">
            <div className="container navbar-inner">
                {/* Logo */}
                <Link to="/" className="navbar-logo">
                    <span style={{ fontSize: '1.8rem' }}>⛪</span>
                    <div className="logo-text">
                        <span className="logo-name">ST MARY'S CATHEDRAL</span>
                        <span className="logo-sub">WREXHAM</span>
                    </div>
                </Link>

                <ul className="navbar-links">
                    {navItems.map(item => (
                        <li key={item.label} className="nav-item">
                            {item.children ? (
                                <>
                                    <Link
                                        to={item.path}
                                        className={`nav-link ${getActiveChild(item, pathname) ? 'active' : ''}`}
                                        onMouseEnter={() => setOpenDropdown(item.label)}
                                    >
                                        {getActiveChild(item, pathname)?.label || item.label} <span className="dropdown-arrow">▼</span>
                                    </Link>
                                    {openDropdown === item.label && (
                                        <ul className="dropdown" onMouseLeave={() => setOpenDropdown(null)}>
                                            {item.children.map(child => (
                                                <li key={child.label}>
                                                    <Link
                                                        to={child.path}
                                                        className="dropdown-link"
                                                        onClick={() => setOpenDropdown(null)}
                                                    >
                                                        {child.label}
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </>
                            ) : (
                                <Link
                                    to={item.path}
                                    className={`nav-link ${isRouteMatch(pathname, item.path) ? 'active' : ''}`}
                                >
                                    {item.label}
                                </Link>
                            )}
                        </li>
                    ))}
                </ul>

                <Link to="/donate" className="btn-gold navbar-donate">Donate</Link>

                <button
                    className="hamburger"
                    onClick={() => setMobileOpen(!mobileOpen)}
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </div>

            {mobileOpen && (
                <div className="mobile-menu">
                    {navItems.map(item => (
                        <div key={item.label}>
                            {item.children ? (
                                <>
                                    <span className="mobile-link">{getActiveChild(item, pathname)?.label || item.label}</span>
                                    <div className="mobile-sub">
                                        {item.children.map(child => (
                                            <Link
                                                key={child.label}
                                                to={child.path}
                                                className={`mobile-sub-link ${isRouteMatch(pathname, child.path) ? 'active' : ''}`}
                                                onClick={() => setMobileOpen(false)}
                                            >
                                                {child.label}
                                            </Link>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <Link
                                    to={item.path}
                                    className={`mobile-link ${isRouteMatch(pathname, item.path) ? 'active' : ''}`}
                                    onClick={() => setMobileOpen(false)}
                                >
                                    {item.label}
                                </Link>
                            )}
                        </div>
                    ))}
                    <Link
                        to="/donate"
                        className="mobile-link"
                        style={{ color: 'var(--gold)' }}
                        onClick={() => setMobileOpen(false)}
                    >
                        Donate
                    </Link>
                </div>
            )}
        </nav>
    )
}
