import './TopBar.css'

export default function TopBar() {
    return (
        <div className="topbar">
            <div className="container topbar-inner">
                <div className="topbar-left">
                    <span>📍 Regent Street, Wrexham, LL11 1RB</span>
                </div>
                <div className="topbar-right">
                    <a href="tel:01978263943" className="topbar-link">📞 01978 263943</a>
                    <span className="topbar-divider">|</span>
                    <a href="mailto:secretarywrexhamcathedral@rcdwxm.org.uk" className="topbar-link">✉ secretarywrexhamcathedral@rcdwxm.org.uk</a>
                </div>
            </div>
        </div>
    )
}
