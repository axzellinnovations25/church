import './TopBar.css'

export default function TopBar() {
    return (
        <div className="topbar">
            <div className="container topbar-inner">
                <div className="topbar-left">
                    <span>📍 Regent Street, Wrexham, LL11 1RR</span>
                </div>
                <div className="topbar-right">
                    <a href="tel:01978262826" className="topbar-link">📞 01978 262 826</a>
                    <span className="topbar-divider">|</span>
                    <a href="mailto:secretarywrexhamcathedral@rcdwxm.org.uk" className="topbar-link">✉ secretarywrexhamcathedral@rcdwxm.org.uk</a>
                </div>
            </div>
        </div>
    )
}
