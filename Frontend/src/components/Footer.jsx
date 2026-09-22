import { Link } from 'react-router-dom'
import './Footer.css'

export default function Footer() {
    return (
        <footer className="footer">
            <div className="container footer-grid">
                {/* Col 1: Logo + tagline */}
                <div className="footer-brand">
                    <Link to="/" className="footer-logo">
                        <div className="footer-logo-icon">
                            <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
                                <rect width="28" height="28" rx="4" fill="#c9a84c" />
                                <path d="M14 4 L14 24 M8 10 L20 10" stroke="#1e3a5f" strokeWidth="2.5" strokeLinecap="round" />
                            </svg>
                        </div>
                        <div>
                            <div className="footer-logo-name">St Mary's Cathedral</div>
                            <div className="footer-logo-sub">WREXHAM</div>
                        </div>
                    </Link>
                    <p className="footer-tagline">
                        Mother Church of the Diocese of Wrexham, serving our Catholic community with faith, hope, and charity.
                    </p>
                </div>

                {/* Col 2: Contact */}
                <div className="footer-col">
                    <h4 className="footer-heading">Contact Us</h4>
                    <ul className="footer-list">
                        <li>
                            <span className="footer-icon">📍</span>
                            <span>Regent Street<br />Wrexham<br />LL11 1RR</span>
                        </li>
                        <li>
                            <span className="footer-icon">📞</span>
                            <a href="tel:01978262826">01978 262 826</a>
                        </li>
                        <li>
                            <span className="footer-icon">✉</span>
                            <a href="mailto:secretarywrexhamcathedral@rcdwxm.org.uk">secretarywrexhamcathedral@rcdwxm.org.uk</a>
                        </li>
                    </ul>
                </div>

                {/* Col 3: Parish Life */}
                <div className="footer-col">
                    <h4 className="footer-heading">Parish Life</h4>
                    <ul className="footer-links-list">
                        <li><Link to="/newsletter">Weekly Newsletter</Link></li>
                        <li><Link to="/events">Events Calendar</Link></li>
                        <li><Link to="/news">News & Announcements</Link></li>
                        <li><Link to="/parish">Our Parish</Link></li>
                        <li><Link to="/prayer-devotions">Prayer & Devotions</Link></li>
                    </ul>
                </div>

                {/* Col 4: Quick Links */}
                <div className="footer-col">
                    <h4 className="footer-heading">Quick Links</h4>
                    <ul className="footer-links-list">
                        <li><Link to="/registration">Parish Registration</Link></li>
                        <li><Link to="/safeguarding">Safeguarding</Link></li>
                        <li><Link to="/schools">Schools Links</Link></li>
                        <li><Link to="/contact">Contact Us</Link></li>
                        <li><a href="https://www.wrexhamdiocese.org.uk/" target="_blank" rel="noopener noreferrer">Diocese of Wrexham</a></li>
                    </ul>
                    <div className="footer-social">
                        <a href="#" aria-label="Facebook" className="social-link">f</a>
                        <a href="#" aria-label="Instagram" className="social-link">📷</a>
                        <a href="mailto:secretarywrexhamcathedral@rcdwxm.org.uk" aria-label="Email" className="social-link">✉</a>
                        <a href="#" aria-label="LinkedIn" className="social-link">in</a>
                    </div>
                </div>
            </div>

            <div className="footer-bottom">
                <div className="container">
                    <p>© 2026 St Mary's Cathedral, Wrexham. All rights reserved. Registered Charity.</p>
                </div>
            </div>
        </footer>
    )
}
