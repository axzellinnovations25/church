import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { queryClient } from '../lib/queryClient'
import { prefetchPublicDataForPath } from '../lib/publicData'
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
    const [expandedMobileCategories, setExpandedMobileCategories] = useState({})
    const location = useLocation()
    const pathname = location.pathname
    const prefetch = path => prefetchPublicDataForPath(queryClient, path)

    const handleToggleMobile = () => {
        setMobileOpen(prev => {
            const nextOpen = !prev
            if (nextOpen) {
                const activeCategory = navItems.find(item => item.children && getActiveChild(item, pathname))
                if (activeCategory) {
                    setExpandedMobileCategories(prevExpanded => ({
                        ...prevExpanded,
                        [activeCategory.label]: true,
                    }))
                }
            }
            return nextOpen
        })
    }

    // Lock body scroll when mobile menu drawer is open
    useEffect(() => {
        if (mobileOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => {
            document.body.style.overflow = ''
        }
    }, [mobileOpen])

    // Close mobile menu on desktop window resize
    useEffect(() => {
        function handleResize() {
            if (window.innerWidth > 1024) {
                setMobileOpen(false)
            }
        }
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    const toggleMobileCategory = (label) => {
        setExpandedMobileCategories(prev => ({
            ...prev,
            [label]: !prev[label],
        }))
    }

    return (
        <nav className="navbar">
            <div className="container navbar-inner">
                {/* Logo */}
                <Link to="/" className="navbar-logo" onClick={() => setMobileOpen(false)}>
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
                                        onMouseEnter={() => {
                                            setOpenDropdown(item.label)
                                            prefetch(item.path)
                                        }}
                                        onFocus={() => prefetch(item.path)}
                                    >
                                        {item.label} <span className="dropdown-arrow">▼</span>
                                    </Link>
                                    {openDropdown === item.label && (
                                        <ul className="dropdown" onMouseLeave={() => setOpenDropdown(null)}>
                                            {item.children.map(child => (
                                                <li key={child.label}>
                                                    <Link
                                                        to={child.path}
                                                        className={`dropdown-link ${isRouteMatch(pathname, child.path) ? 'active' : ''}`}
                                                        onMouseEnter={() => prefetch(child.path)}
                                                        onFocus={() => prefetch(child.path)}
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
                                    onMouseEnter={() => prefetch(item.path)}
                                    onFocus={() => prefetch(item.path)}
                                >
                                    {item.label}
                                </Link>
                            )}
                        </li>
                    ))}
                </ul>

                <Link to="/donate" className="btn-gold navbar-donate">Donate</Link>

                <button
                    className={`hamburger ${mobileOpen ? 'open' : ''}`}
                    onClick={handleToggleMobile}
                    aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
                    aria-expanded={mobileOpen}
                    aria-controls="mobile-nav-menu"
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </div>

            {/* Mobile Drawer Backdrop */}
            {mobileOpen && (
                <div
                    className="mobile-menu-backdrop"
                    onClick={() => setMobileOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Mobile Navigation Sidebar Drawer */}
            {mobileOpen && (
                <div id="mobile-nav-menu" className="mobile-menu">
                    <div className="mobile-menu-inner">
                        {navItems.map(item => {
                            const isExpanded = !!expandedMobileCategories[item.label]
                            const hasActiveChild = getActiveChild(item, pathname)
                            const isParentActive = isRouteMatch(pathname, item.path) || hasActiveChild

                            return (
                                <div key={item.label} className={`mobile-nav-group ${isExpanded ? 'is-expanded' : ''}`}>
                                    {item.children ? (
                                        <>
                                            <div className="mobile-group-header">
                                                <Link
                                                    to={item.path}
                                                    className={`mobile-link ${isParentActive ? 'active' : ''}`}
                                                    onTouchStart={() => prefetch(item.path)}
                                                    onClick={() => setMobileOpen(false)}
                                                >
                                                    {item.label}
                                                </Link>
                                                <button
                                                    type="button"
                                                    className={`mobile-expand-btn ${isExpanded ? 'expanded' : ''}`}
                                                    onClick={() => toggleMobileCategory(item.label)}
                                                    aria-label={`${isExpanded ? 'Minimize' : 'Expand'} ${item.label} section`}
                                                    aria-expanded={isExpanded}
                                                >
                                                    <span className="expand-chevron">▼</span>
                                                </button>
                                            </div>
                                            {isExpanded && (
                                                <div className="mobile-sub">
                                                    {item.children.map(child => (
                                                        <Link
                                                            key={child.label}
                                                            to={child.path}
                                                            className={`mobile-sub-link ${isRouteMatch(pathname, child.path) ? 'active' : ''}`}
                                                            onTouchStart={() => prefetch(child.path)}
                                                            onClick={() => setMobileOpen(false)}
                                                        >
                                                            {child.label}
                                                        </Link>
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <Link
                                            to={item.path}
                                            className={`mobile-link ${isRouteMatch(pathname, item.path) ? 'active' : ''}`}
                                            onTouchStart={() => prefetch(item.path)}
                                            onClick={() => setMobileOpen(false)}
                                        >
                                            {item.label}
                                        </Link>
                                    )}
                                </div>
                            )
                        })}
                        <div className="mobile-donate-wrapper">
                            <Link
                                to="/donate"
                                className="btn-gold mobile-donate-btn"
                                onClick={() => setMobileOpen(false)}
                            >
                                Donate
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    )
}

