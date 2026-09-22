import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import FeedbackDialog from '../components/FeedbackDialog'
import PageHero from '../components/PageHero'
import { getBackendUrl } from '../lib/auth'
import { capitalizeFirst, titleCaseWords } from '../lib/textFormat'
import { firstError, hasErrors, requireField, validateEmail, validateMaxLength, validateNameText, validatePhone } from '../lib/validation'
import './ContactPage.css'

const publicAsset = (path) => encodeURI(`${import.meta.env.BASE_URL}${path}`)

const categoryOptions = [
    { value: '', label: 'Select enquiry type' },
    { value: 'general', label: 'General Enquiry', hint: 'General questions about the cathedral, parish life, or visiting.' },
    { value: 'mass_times', label: 'Mass Times', hint: 'Questions about weekday, weekend, or special liturgy times.' },
    { value: 'liturgy', label: 'Liturgy / Ministry', hint: 'Enquiries about reading, serving, music, or other ministries.' },
    { value: 'sacraments', label: 'Sacraments', hint: 'General sacramental enquiries or preparation guidance.' },
    { value: 'baptism', label: 'Baptism', hint: 'Questions about baptism for children or adults.' },
    { value: 'first_holy_communion', label: 'First Holy Communion', hint: 'Enquiries about First Holy Communion preparation.' },
    { value: 'confirmation', label: 'Confirmation', hint: 'Questions about confirmation classes or readiness.' },
    { value: 'marriage', label: 'Marriage', hint: 'Wedding preparation and marriage enquiries.' },
    { value: 'becoming_catholic', label: 'Becoming Catholic / RCIA', hint: 'For anyone exploring the Catholic faith or RCIA.' },
    { value: 'pastoral_care', label: 'Pastoral Care', hint: 'Home visits, support during illness, or general pastoral help.' },
    { value: 'parish_registration', label: 'Parish Registration', hint: 'Help with joining the parish or registration questions.' },
    { value: 'newsletter', label: 'Newsletter / Communications', hint: 'Questions about the parish newsletter or updates.' },
    { value: 'safeguarding', label: 'Safeguarding', hint: 'Safeguarding concerns or requests for the safeguarding team.' },
    { value: 'cathedral_hire', label: 'Cathedral Hire / Facilities', hint: 'Venue, facility, or hire-related enquiries.' },
    { value: 'donations', label: 'Donations / Fundraising', hint: 'Giving, donations, fundraising, or support enquiries.' },
    { value: 'schools', label: 'Schools / Education', hint: 'School links, education, or children and family-related enquiries.' },
    { value: 'group_join', label: 'Join a Group', hint: 'Choose this if you want your message routed to a parish group.' },
    { value: 'other', label: 'Other', hint: 'Anything not covered by the options above.' },
]

const initialContactForm = {
    name: '',
    email: '',
    phone: '',
    category: '',
    group_id: '',
    subject: '',
    isMember: 'yes',
    message: '',
}

export default function ContactPage() {
    const [searchParams] = useSearchParams()
    const [contactForm, setContactForm] = useState(initialContactForm)
    const [groups, setGroups] = useState([])
    const [loading, setLoading] = useState(false)
    const [successDialogOpen, setSuccessDialogOpen] = useState(false)
    const [error, setError] = useState('')
    const [contactErrors, setContactErrors] = useState({})
    const selectedCategory = categoryOptions.find(option => option.value === contactForm.category)

    useEffect(() => {
        window.scrollTo(0, 0)
        const subj = searchParams.get('subject')

        if (subj) {
            setContactForm(prev => ({ ...prev, subject: subj }))
        }
    }, [searchParams])

    useEffect(() => {
        let ignore = false

        async function loadGroups() {
            try {
                const response = await fetch(getBackendUrl('/api/v1/groups'))
                const payload = await response.json()

                if (!ignore && response.ok && Array.isArray(payload.data)) {
                    setGroups(payload.data)
                }
            } catch (loadError) {
                console.log('Error loading groups for contact form:', loadError)
            }
        }

        loadGroups()

        return () => {
            ignore = true
        }
    }, [])

    function handleContactChange(event) {
        const { name, value } = event.target
        const nextErrors = {}

        if (name === 'name') {
            validateNameText(nextErrors, 'name', value, 'Name', true)
            validateMaxLength(nextErrors, 'name', value, 255, 'Name')
        } else if (name === 'email') {
            validateEmail(nextErrors, 'email', value)
        } else if (name === 'phone') {
            validatePhone(nextErrors, 'phone', value, 'Phone number', true)
        } else if (name === 'subject') {
            requireField(nextErrors, 'subject', value, 'Subject')
            validateMaxLength(nextErrors, 'subject', value, 255, 'Subject')
        } else if (name === 'category') {
            requireField(nextErrors, 'category', value, 'Category')
        } else if (name === 'message') {
            requireField(nextErrors, 'message', value, 'Message')
        }

        const nextForm = { ...contactForm, [name]: value }

        if (name === 'category' && value !== 'group_join') {
            nextForm.group_id = ''
        }

        setContactForm(nextForm)
        setContactErrors(current => ({ ...current, [name]: nextErrors[name] }))
    }

    function formatContactField(name, formatter) {
        const value = contactForm[name] || ''
        setContactForm(current => ({
            ...current,
            [name]: formatter(value.trim()),
        }))
    }

    function validateContactForm() {
        const nextErrors = {}

        validateNameText(nextErrors, 'name', contactForm.name, 'Name', true)
        validateMaxLength(nextErrors, 'name', contactForm.name, 255, 'Name')
        validateEmail(nextErrors, 'email', contactForm.email)
        validatePhone(nextErrors, 'phone', contactForm.phone, 'Phone number', true)
        requireField(nextErrors, 'category', contactForm.category, 'Category')
        requireField(nextErrors, 'subject', contactForm.subject, 'Subject')
        validateMaxLength(nextErrors, 'subject', contactForm.subject, 255, 'Subject')
        requireField(nextErrors, 'message', contactForm.message, 'Message')

        if (contactForm.category === 'group_join' && !contactForm.group_id) {
            nextErrors.group_id = ['Please choose which group you want to join.']
        }

        return nextErrors
    }

    async function handleContactSubmit() {
        const validationErrors = validateContactForm()
        setContactErrors(validationErrors)

        if (hasErrors(validationErrors)) {
            setError(firstError(validationErrors) || 'Please review the highlighted fields.')
            return
        }

        setLoading(true)
        setSuccessDialogOpen(false)
        setError('')

        try {
            const response = await fetch(getBackendUrl('/api/v1/contact'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(contactForm),
            })

            const rawBody = await response.text()
            let data = null

            try {
                data = rawBody ? JSON.parse(rawBody) : null
            } catch {
                data = null
            }

            if (!response.ok) {
                const firstApiError = data?.errors && typeof data.errors === 'object'
                    ? Object.values(data.errors).flat().filter(Boolean)[0]
                    : null

                if (data?.errors && typeof data.errors === 'object') {
                    setContactErrors(current => ({ ...current, ...data.errors }))
                }

                if (firstApiError) {
                    setError(firstApiError)
                } else if (response.status < 500 && data?.message) {
                    setError(data.message)
                } else {
                    console.error('Contact form submission failed:', response.status, rawBody)
                    setError("We could not send your message right now. Please try again in a moment, or contact the parish office by phone or email.")
                }

                return
            }

            setContactForm(initialContactForm)
            setContactErrors({})
            setSuccessDialogOpen(true)
        } catch (submitError) {
            console.error('Contact form submission error:', submitError)
            setError("We could not send your message right now. Please check your connection and try again, or contact the parish office by phone or email.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="contact-page-container">
            <PageHero
                title="Contact Us"
                subtitle="We would be glad to hear from you. Contact the parish team for worship, sacraments, visits, groups, and pastoral support."
                centered={true}
            />

            <section className="contact-top-section">
                <div className="container">
                    <div className="contact-hero-grid">
                        <div className="contact-map-wrapper">
                            <iframe
                                title="Cathedral Location"
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2402.0460492866634!2d-2.9964526841753!3d53.04566497991732!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x487ad39f9b5c3b5d%3A0x8e8e8e8e8e8e8e8e!2sSt%20Mary&#39;s%20Cathedral%2C%20Wrexham!5e0!3m2!1sen!2suk!4v1620000000000!5m2!1sen!2suk"
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                allowFullScreen=""
                                loading="lazy"
                            ></iframe>
                        </div>
                        <div className="contact-intro-content">
                            <p className="contact-kicker">Parish Office</p>
                            <h2>Find us in the heart of Wrexham</h2>
                            <p>
                                Thank you for your interest in St Mary's Cathedral. Please use the form below or the parish office contact details for enquiries about worship, parish life, sacramental preparation, or pastoral support.
                            </p>
                            <p>
                                St Mary's Cathedral Parish includes the Cathedral in Wrexham and the Church of the Holy Family in Coedpoeth. We are always happy to help parishioners, visitors, and those exploring the Catholic faith.
                            </p>
                            <p>
                                To learn more about St Mary's, please <Link to="/about" className="click-here-link">click here</Link>.
                            </p>
                            <p>
                                For more directions via Google Maps, please <a href="https://goo.gl/maps/8nN7F1H1R3J2" target="_blank" rel="noopener noreferrer" className="click-here-link">click here</a>.
                            </p>
                            <div className="contact-photo-wrap">
                                <img src={publicAsset('gallery/IMG_4301.jpeg')} alt="Entrance to St Mary's Cathedral" />
                            </div>
                        </div>
                    </div>

                    <div className="contact-methods">
                        <a className="contact-method-card" href="tel:01978263943">
                            <span className="contact-method-icon">Tel</span>
                            <span>
                                <strong>Call the office</strong>
                                <small>01978 263943</small>
                            </span>
                        </a>
                        <a className="contact-method-card" href="mailto:secretarywrexhamcathedral@rcdwxm.org.uk">
                            <span className="contact-method-icon">@</span>
                            <span>
                                <strong>Email us</strong>
                                <small>secretarywrexhamcathedral@rcdwxm.org.uk</small>
                            </span>
                        </a>
                        <div className="contact-method-card">
                            <span className="contact-method-icon">Hrs</span>
                            <span>
                                <strong>Office hours</strong>
                                <small>Tue, Wed, Fri: 9:30 AM - 2:30 PM</small>
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            <section className="section contact-main-section">
                <div className="container">
                    <div className="contact-bottom-grid two-columns">
                        <div className="contact-column contact-details-panel">
                            <p className="contact-kicker">Visit and Write</p>
                            <h3>Contact Details</h3>
                            <div className="address-list">
                                <div className="address-item">
                                    <span className="address-icon" aria-hidden="true">C</span>
                                    <div className="address-text">
                                        <strong>Cathedral Location</strong><br />
                                        St Mary's Cathedral<br />
                                        Regent Street, Wrexham<br />
                                        LL11 1RB, United Kingdom
                                    </div>
                                </div>
                                <div className="address-item">
                                    <span className="address-icon" aria-hidden="true">O</span>
                                    <div className="address-text">
                                        <strong>Parish Office / Mailing</strong><br />
                                        Cathedral House<br />
                                        Regent Street, Wrexham<br />
                                        LL11 1RB
                                    </div>
                                </div>
                                <div className="address-item">
                                    <span className="address-icon" aria-hidden="true">T</span>
                                    <div className="address-text">01978 263943</div>
                                </div>
                                <div className="address-item">
                                    <span className="address-icon" aria-hidden="true">@</span>
                                    <div className="address-text">
                                        secretarywrexhamcathedral@rcdwxm.org.uk<br />
                                        Office hours: Tuesday, Wednesday and Friday, 9:30 AM - 2:30 PM<br />
                                        To subscribe to our emails,<br />
                                        please <Link to="/newsletter" className="click-here-link">click here</Link>.
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="contact-column contact-form-panel">
                            <div className="contact-form-heading">
                                <p className="contact-kicker">Send a Message</p>
                                <h3>How can we help?</h3>
                                <p>Choose the best enquiry type and your message will be sent to the parish team.</p>
                            </div>

                            {error ? <div className="contact-feedback error">{error}</div> : null}

                            <form
                                className="contact-form-minimal"
                                onSubmit={event => {
                                    event.preventDefault()
                                    handleContactSubmit()
                                }}
                                noValidate
                            >
                                <div className="grid-2 contact-form-grid">
                                    <div className="form-group">
                                        <label>Name</label>
                                        <input name="name" value={contactForm.name} onChange={handleContactChange} onBlur={() => formatContactField('name', titleCaseWords)} required aria-invalid={Boolean(contactErrors.name)} />
                                        {contactErrors.name ? <span className="field-error">{contactErrors.name[0]}</span> : null}
                                    </div>
                                    <div className="form-group">
                                        <label>Email</label>
                                        <input name="email" type="email" value={contactForm.email} onChange={handleContactChange} required aria-invalid={Boolean(contactErrors.email)} />
                                        {contactErrors.email ? <span className="field-error">{contactErrors.email[0]}</span> : null}
                                    </div>
                                </div>

                                <div className="grid-2 contact-form-grid">
                                    <div className="form-group">
                                        <label>Category</label>
                                        <select name="category" value={contactForm.category} onChange={handleContactChange} aria-invalid={Boolean(contactErrors.category)}>
                                            {categoryOptions.map(option => (
                                                <option key={option.value || 'placeholder'} value={option.value} disabled={option.value === ''}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                        {selectedCategory?.hint ? <span className="field-hint">{selectedCategory.hint}</span> : null}
                                        {contactErrors.category ? <span className="field-error">{contactErrors.category[0]}</span> : null}
                                    </div>
                                    <div className="form-group">
                                        <label>Phone Number <span className="required">*</span></label>
                                        <input name="phone" value={contactForm.phone} onChange={handleContactChange} required aria-invalid={Boolean(contactErrors.phone)} />
                                        {contactErrors.phone ? <span className="field-error">{contactErrors.phone[0]}</span> : null}
                                    </div>
                                </div>

                                {contactForm.category === 'group_join' ? (
                                    <div className="form-group">
                                        <label>Which group would you like to join?</label>
                                        <select name="group_id" value={contactForm.group_id} onChange={handleContactChange} aria-invalid={Boolean(contactErrors.group_id)}>
                                            <option value="">Select a group</option>
                                            {groups.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}
                                        </select>
                                        {contactErrors.group_id ? <span className="field-error">{contactErrors.group_id[0]}</span> : null}
                                    </div>
                                ) : null}

                                <div className="contact-form-grid single">
                                    <div className="form-group">
                                        <label>Subject</label>
                                        <input name="subject" value={contactForm.subject} onChange={handleContactChange} onBlur={() => formatContactField('subject', titleCaseWords)} required aria-invalid={Boolean(contactErrors.subject)} />
                                        {contactErrors.subject ? <span className="field-error">{contactErrors.subject[0]}</span> : null}
                                    </div>
                                </div>

                                <div className="radio-group">
                                    <label className="radio-option">
                                        <input type="radio" name="isMember" value="yes" checked={contactForm.isMember === 'yes'} onChange={handleContactChange} />
                                        Yes, I attend St Mary's.
                                    </label>
                                    <label className="radio-option">
                                        <input type="radio" name="isMember" value="no" checked={contactForm.isMember === 'no'} onChange={handleContactChange} />
                                        No, I do not attend St Mary's.
                                    </label>
                                </div>

                                <div className="form-group">
                                    <label>Message</label>
                                    <textarea name="message" value={contactForm.message} onChange={handleContactChange} onBlur={() => formatContactField('message', capitalizeFirst)} rows={5} required aria-invalid={Boolean(contactErrors.message)}></textarea>
                                    {contactErrors.message ? <span className="field-error">{contactErrors.message[0]}</span> : null}
                                </div>

                                <div className="form-actions-row">
                                    <button
                                        type="button"
                                        className="btn-form-secondary"
                                        onClick={() => {
                                            setContactForm(initialContactForm)
                                            setContactErrors({})
                                            setError('')
                                        }}
                                    >
                                        Clear
                                    </button>
                                    <button type="submit" className="btn-form-primary" disabled={loading}>
                                        {loading ? 'Sending...' : 'Send Message'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </section>

            <FeedbackDialog
                open={successDialogOpen}
                tone="success"
                title="Message sent successfully"
                message="Thank you for contacting St Mary's Cathedral. Your enquiry has been submitted successfully."
                confirmLabel="Close"
                onClose={() => setSuccessDialogOpen(false)}
            />
        </div>
    )
}
