import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FeedbackDialog from '../components/FeedbackDialog'
import PageHero from '../components/PageHero'
import { getBackendUrl } from '../lib/auth'
import { titleCaseWords } from '../lib/textFormat'
import {
    asError,
    firstError,
    hasErrors,
    requireField,
    UK_POSTCODE_PATTERN,
    validateDateNotFuture,
    validateEmail,
    validateMaxLength,
    validateNameText,
    validatePhone,
} from '../lib/validation'
import './RegistrationPage.css'

function FieldError({ errors, name }) {
    if (!errors?.[name]?.[0]) {
        return null
    }

    return <span className="field-error">{errors[name][0]}</span>
}

export default function RegistrationPage() {
    const navigate = useNavigate()
    const [regType, setRegType] = useState('individual')
    const [children, setChildren] = useState([{ id: 1, name: '', date_of_birth: '' }])
    const [formData, setFormData] = useState({})
    const [dialogState, setDialogState] = useState({
        open: false,
        tone: 'neutral',
        title: '',
        message: null,
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formErrors, setFormErrors] = useState({})
    const formRef = useRef(null)

    const handleChange = event => {
        const { name, value, type, checked } = event.target
        const nextValue = type === 'checkbox' ? checked : value
        const nextFormData = {
            ...formData,
            [name]: nextValue,
        }

        setFormData(nextFormData)
        setFormErrors(current => ({ ...current, [name]: validateRegistrationField(name, nextValue, nextFormData) }))
    }

    const formatFieldValue = (event, formatter) => {
        const { name, value } = event.target
        const nextValue = formatter(value.trim())
        const nextFormData = {
            ...formData,
            [name]: nextValue,
        }

        event.target.value = nextValue
        setFormData(nextFormData)
        setFormErrors(current => ({ ...current, [name]: validateRegistrationField(name, nextValue, nextFormData) }))
    }

    const formatChildName = id => {
        const nextChildren = children.map(child =>
            child.id === id ? { ...child, name: titleCaseWords(child.name.trim()) } : child,
        )
        const changedChild = nextChildren.find(child => child.id === id)
        const childErrors = validateChildFields(changedChild)

        setChildren(nextChildren)
        setFormErrors(current => ({
            ...current,
            [`children.${id}.name`]: childErrors.name,
            [`children.${id}.date_of_birth`]: childErrors.date_of_birth,
        }))
    }

    const handleChildChange = (id, field, value) => {
        const nextChildren = children.map(child =>
            child.id === id ? { ...child, [field]: value } : child,
        )
        const changedChild = nextChildren.find(child => child.id === id)
        const childErrors = validateChildFields(changedChild)

        setChildren(nextChildren)
        setFormErrors(current => ({
            ...current,
            [`children.${id}.name`]: childErrors.name,
            [`children.${id}.date_of_birth`]: childErrors.date_of_birth,
        }))
    }

    const handleAddChild = () => {
        setChildren([...children, { id: Date.now(), name: '', date_of_birth: '' }])
    }

    const handleRemoveChild = id => {
        if (children.length > 1) {
            setChildren(children.filter(child => child.id !== id))
        }
    }

    const resetRegistrationForm = () => {
        formRef.current?.reset()
        setFormData({})
        setFormErrors({})
        setChildren([{ id: 1, name: '', date_of_birth: '' }])
        setRegType('individual')
    }

    const validateRegistrationForm = () => {
        const nextErrors = {}

        validateNameText(nextErrors, 'full_name', formData.full_name, 'Full name', true)
        validateMaxLength(nextErrors, 'full_name', formData.full_name, 255, 'Full name')
        requireField(nextErrors, 'date_of_birth', formData.date_of_birth, 'Date of birth')
        validateDateNotFuture(nextErrors, 'date_of_birth', formData.date_of_birth, 'Date of birth')
        requireField(nextErrors, 'gender', formData.gender, 'Gender')

        validateMaxLength(nextErrors, 'nationality', formData.nationality, 255, 'Nationality')
        validateMaxLength(nextErrors, 'occupation', formData.occupation, 255, 'Occupation')
        requireField(nextErrors, 'address_line1', formData.address_line1, 'Home address')
        validateNameText(nextErrors, 'city', formData.city, 'City or town', true)
        requireField(nextErrors, 'city', formData.city, 'City or town')
        requireField(nextErrors, 'postcode', formData.postcode, 'Postcode')

        if (formData.postcode && !UK_POSTCODE_PATTERN.test(formData.postcode.trim())) {
            nextErrors.postcode = asError('Enter a valid UK postcode.')
        }

        validatePhone(nextErrors, 'phone', formData.phone, 'Telephone number', true)
        validateEmail(nextErrors, 'email', formData.email)
        validateNameText(nextErrors, 'partner_name', formData.partner_name, 'Partner name')
        validateMaxLength(nextErrors, 'partner_name', formData.partner_name, 255, 'Partner name')

        if (regType === 'family') {
            children.forEach(child => {
                const hasName = child.name.trim() !== ''
                const hasDateOfBirth = String(child.date_of_birth).trim() !== ''

                if (!hasName && hasDateOfBirth) {
                    nextErrors[`children.${child.id}.name`] = asError('Child name is required when date of birth is entered.')
                }

                if (hasName && !hasDateOfBirth) {
                    nextErrors[`children.${child.id}.date_of_birth`] = asError('Child date of birth is required when name is entered.')
                }

                if (hasName) {
                    validateNameText(nextErrors, `children.${child.id}.name`, child.name, 'Child name')
                }

                if (hasDateOfBirth) {
                    validateDateNotFuture(nextErrors, `children.${child.id}.date_of_birth`, child.date_of_birth, 'Child date of birth')
                }
            })
        }

        if (!formData.consent) {
            nextErrors.consent = asError('Consent is required before submitting.')
        }

        validateNameText(nextErrors, 'signature', formData.signature, 'Signature', true)
        requireField(nextErrors, 'signed_date', formData.signed_date, 'Signed date')
        validateDateNotFuture(nextErrors, 'signed_date', formData.signed_date, 'Signed date')

        return nextErrors
    }

    const validateRegistrationField = (name, value, data) => {
        const nextErrors = {}

        if (name === 'full_name') {
            validateNameText(nextErrors, 'full_name', value, 'Full name', true)
            validateMaxLength(nextErrors, 'full_name', value, 255, 'Full name')
        } else if (name === 'date_of_birth') {
            requireField(nextErrors, 'date_of_birth', value, 'Date of birth')
            validateDateNotFuture(nextErrors, 'date_of_birth', value, 'Date of birth')
        } else if (name === 'gender') {
            requireField(nextErrors, 'gender', value, 'Gender')
        } else if (name === 'nationality') {
            validateMaxLength(nextErrors, 'nationality', value, 255, 'Nationality')
        } else if (name === 'occupation') {
            validateMaxLength(nextErrors, 'occupation', value, 255, 'Occupation')
        } else if (name === 'address_line1') {
            requireField(nextErrors, 'address_line1', value, 'Home address')
        } else if (name === 'city') {
            validateNameText(nextErrors, 'city', value, 'City or town', true)
        } else if (name === 'postcode') {
            requireField(nextErrors, 'postcode', value, 'Postcode')

            if (value && !UK_POSTCODE_PATTERN.test(value.trim())) {
                nextErrors.postcode = asError('Enter a valid UK postcode.')
            }
        } else if (name === 'phone') {
            validatePhone(nextErrors, 'phone', value, 'Telephone number', true)
        } else if (name === 'email') {
            validateEmail(nextErrors, 'email', value)
        } else if (name === 'partner_name') {
            validateNameText(nextErrors, 'partner_name', value, 'Partner name')
            validateMaxLength(nextErrors, 'partner_name', value, 255, 'Partner name')
        } else if (name === 'consent' && !data.consent) {
            nextErrors.consent = asError('Consent is required before submitting.')
        } else if (name === 'signature') {
            validateNameText(nextErrors, 'signature', value, 'Signature', true)
        } else if (name === 'signed_date') {
            requireField(nextErrors, 'signed_date', value, 'Signed date')
            validateDateNotFuture(nextErrors, 'signed_date', value, 'Signed date')
        }

        return nextErrors[name]
    }

    const validateChildFields = child => {
        const nextErrors = {}

        if (!child) {
            return nextErrors
        }

        const hasName = child.name.trim() !== ''
        const hasDateOfBirth = String(child.date_of_birth).trim() !== ''

        if (!hasName && hasDateOfBirth) {
            nextErrors.name = asError('Child name is required when date of birth is entered.')
        }

        if (hasName) {
            validateNameText(nextErrors, 'name', child.name, 'Child name')
        }

        if (hasName && !hasDateOfBirth) {
            nextErrors.date_of_birth = asError('Child date of birth is required when name is entered.')
        }

        if (hasDateOfBirth) {
            validateDateNotFuture(nextErrors, 'date_of_birth', child.date_of_birth, 'Child date of birth')
        }

        return nextErrors
    }

    const handleSubmit = async event => {
        event.preventDefault()
        const validationErrors = validateRegistrationForm()
        setFormErrors(validationErrors)

        if (hasErrors(validationErrors)) {
            setDialogState({
                open: true,
                tone: 'error',
                title: 'Please check the form',
                message: firstError(validationErrors) || 'Please review the highlighted fields and try again.',
            })
            return
        }

        setIsSubmitting(true)

        try {
            const payload = {
                ...formData,
                registration_type: regType,
                consent_confirmed: Boolean(formData.consent),
                contact_by_phone: Boolean(formData.contact_by_phone),
                contact_by_email: Boolean(formData.contact_by_email),
                children: regType === 'family'
                    ? children
                        .filter(child => child.name.trim() !== '')
                        .map(child => ({
                            child_name: child.name,
                            date_of_birth: child.date_of_birth || null,
                        }))
                    : [],
                interests: {
                    volunteering: Boolean(formData.volunteering),
                    parish_groups: Boolean(formData.parish_groups),
                    sacramental_preparation: Boolean(formData.sacramental_preparation),
                    weekly_newsletter: Boolean(formData.weekly_newsletter),
                },
            }

            const response = await fetch(getBackendUrl('/api/v1/parish-registrations'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            })

            const rawBody = await response.text()
            let data = null

            try {
                data = rawBody ? JSON.parse(rawBody) : null
            } catch {
                data = null
            }

            if (response.ok && data?.success) {
                resetRegistrationForm()
                setDialogState({
                    open: true,
                    tone: 'success',
                    title: 'Registration submitted successfully',
                    message: (
                        <>
                            <p>Thank you for registering with St Mary's Cathedral Parish.</p>
                            <p>Your parish member ID is <strong>{data.member_id}</strong>.</p>
                        </>
                    ),
                })
            } else {
                const firstApiError = data?.errors && typeof data.errors === 'object'
                    ? Object.values(data.errors).flat().filter(Boolean)[0]
                    : null

                setDialogState({
                    open: true,
                    tone: 'error',
                    title: 'We could not submit your registration',
                    message: firstApiError
                        || data?.message
                        || (rawBody ? `Request failed (${response.status}). ${response.statusText || 'Please try again.'}` : 'Please review the form details and try again.'),
                })
            }
        } catch (error) {
            console.error(error)
            setDialogState({
                open: true,
                tone: 'error',
                title: 'Submission failed',
                message: error?.message || 'Something went wrong while sending your registration. Please try again in a moment.',
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="registration-page">
            <PageHero
                title="Parish Registration"
                subtitle="Register as a member of St Mary's Cathedral parish"
                centered={true}
            />

            <div className="container reg-container">
                <div className="reg-welcome">
                    <h2 className="reg-welcome-title">Welcome to our Parish Family</h2>
                    <p>We are delighted that you have chosen to join St Mary's Cathedral. Please fill out the form below so we can keep you informed and involved in our community.</p>
                </div>

                <form ref={formRef} onSubmit={handleSubmit} noValidate>
                    <div className="reg-section">
                        <span className="reg-type-label">Registration Type</span>
                        <div className="reg-type-grid">
                            <div
                                className={`reg-type-card ${regType === 'individual' ? 'active' : ''}`}
                                onClick={() => setRegType('individual')}
                            >
                                <div className="reg-type-icon" aria-hidden="true">1</div>
                                <span className="reg-type-text">Individual / Couple</span>
                            </div>
                            <div
                                className={`reg-type-card ${regType === 'family' ? 'active' : ''}`}
                                onClick={() => setRegType('family')}
                            >
                                <div className="reg-type-icon" aria-hidden="true">2</div>
                                <span className="reg-type-text">Family Registration</span>
                            </div>
                        </div>
                    </div>

                    <div className="reg-section">
                        <h2 className="reg-section-title">Personal Information</h2>

                        <div className="form-group">
                            <label>Full Name <span className="required">*</span></label>
                            <input type="text" className="form-input" placeholder="Enter your full title and name" required name="full_name" onChange={handleChange} onBlur={event => formatFieldValue(event, titleCaseWords)} aria-invalid={Boolean(formErrors.full_name)} />
                            <FieldError errors={formErrors} name="full_name" />
                        </div>

                        <div className="form-grid-2">
                            <div className="form-group">
                                <label>Date of Birth <span className="required">*</span></label>
                                <input type="date" className="form-input" required name="date_of_birth" onChange={handleChange} aria-invalid={Boolean(formErrors.date_of_birth)} />
                                <FieldError errors={formErrors} name="date_of_birth" />
                            </div>
                            <div className="form-group">
                                <label>Gender <span className="required">*</span></label>
                                <div className="radio-group" style={{ padding: '12px 0' }}>
                                    <label className="radio-label">
                                        <input type="radio" name="gender" value="male" required onChange={handleChange} /> Male
                                    </label>
                                    <label className="radio-label">
                                        <input type="radio" name="gender" value="female" required onChange={handleChange} /> Female
                                    </label>
                                </div>
                                <FieldError errors={formErrors} name="gender" />
                            </div>
                        </div>

                        <div className="form-grid-2">
                            <div className="form-group">
                                <label>Nationality</label>
                                <input type="text" className="form-input" placeholder="e.g. British" name="nationality" onChange={handleChange} onBlur={event => formatFieldValue(event, titleCaseWords)} aria-invalid={Boolean(formErrors.nationality)} />
                                <FieldError errors={formErrors} name="nationality" />
                            </div>
                            <div className="form-group">
                                <label>Occupation</label>
                                <input type="text" className="form-input" placeholder="Your profession" name="occupation" onChange={handleChange} onBlur={event => formatFieldValue(event, titleCaseWords)} aria-invalid={Boolean(formErrors.occupation)} />
                                <FieldError errors={formErrors} name="occupation" />
                            </div>
                        </div>
                    </div>

                    <div className="reg-section">
                        <h2 className="reg-section-title">Address & Contact Information</h2>

                        <div className="form-group">
                            <label>Home Address <span className="required">*</span></label>
                            <input type="text" className="form-input" placeholder="House number and street name" style={{ marginBottom: '12px' }} required name="address_line1" onChange={handleChange} onBlur={event => formatFieldValue(event, titleCaseWords)} aria-invalid={Boolean(formErrors.address_line1)} />
                            <FieldError errors={formErrors} name="address_line1" />
                            <input type="text" className="form-input" placeholder="Address line 2 (optional)" name="address_line2" onChange={handleChange} onBlur={event => formatFieldValue(event, titleCaseWords)} />
                        </div>

                        <div className="form-grid-2">
                            <div className="form-group">
                                <label>City / Town <span className="required">*</span></label>
                                <input type="text" className="form-input" placeholder="e.g. Wrexham" required name="city" onChange={handleChange} onBlur={event => formatFieldValue(event, titleCaseWords)} aria-invalid={Boolean(formErrors.city)} />
                                <FieldError errors={formErrors} name="city" />
                            </div>
                            <div className="form-group">
                                <label>Postcode <span className="required">*</span></label>
                                <input type="text" className="form-input" placeholder="e.g. LL11 1RR" required name="postcode" onChange={handleChange} onBlur={event => formatFieldValue(event, value => value.toUpperCase())} aria-invalid={Boolean(formErrors.postcode)} />
                                <FieldError errors={formErrors} name="postcode" />
                            </div>
                        </div>

                        <div className="form-grid-2">
                            <div className="form-group">
                                <label>Telephone Number <span className="required">*</span></label>
                                <input type="tel" className="form-input" placeholder="Mobile or landline" required name="phone" onChange={handleChange} aria-invalid={Boolean(formErrors.phone)} />
                                <FieldError errors={formErrors} name="phone" />
                            </div>
                            <div className="form-group">
                                <label>Email Address <span className="required">*</span></label>
                                <input type="email" className="form-input" placeholder="your.email@example.com" required name="email" onChange={handleChange} aria-invalid={Boolean(formErrors.email)} />
                                <FieldError errors={formErrors} name="email" />
                            </div>
                        </div>
                    </div>

                    {regType === 'individual' ? (
                        <div className="reg-section">
                            <h2 className="reg-section-title">Partner Information (Optional)</h2>
                            <div className="form-group">
                                <label>Spouse / Partner Name</label>
                                <input type="text" className="form-input" placeholder="Enter spouse or partner's full name" name="partner_name" onChange={handleChange} onBlur={event => formatFieldValue(event, titleCaseWords)} aria-invalid={Boolean(formErrors.partner_name)} />
                                <FieldError errors={formErrors} name="partner_name" />
                            </div>
                        </div>
                    ) : (
                        <div className="reg-section">
                            <h2 className="reg-section-title">Family Information</h2>
                            <div className="form-group">
                                <label>Spouse / Partner Name</label>
                                <input type="text" className="form-input" placeholder="Enter spouse or partner's full name" name="partner_name" onChange={handleChange} onBlur={event => formatFieldValue(event, titleCaseWords)} aria-invalid={Boolean(formErrors.partner_name)} />
                                <FieldError errors={formErrors} name="partner_name" />
                            </div>

                            <div className="children-header">
                                <h3>Children Information</h3>
                                <button type="button" className="btn-add-child" onClick={handleAddChild}>
                                    + Add Child
                                </button>
                            </div>

                            {children.map((child, index) => (
                                <div key={child.id} className="child-row">
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label>{index === 0 ? 'Child Name (If applicable)' : 'Child Name'}</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="Full name"
                                            value={child.name}
                                            aria-invalid={Boolean(formErrors[`children.${child.id}.name`])}
                                            onChange={changeEvent => handleChildChange(child.id, 'name', changeEvent.target.value)}
                                            onBlur={() => formatChildName(child.id)}
                                        />
                                        <FieldError errors={formErrors} name={`children.${child.id}.name`} />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label>Date of Birth</label>
                                        <input
                                            type="date"
                                            className="form-input"
                                            value={child.date_of_birth}
                                            aria-invalid={Boolean(formErrors[`children.${child.id}.date_of_birth`])}
                                            onChange={changeEvent => handleChildChange(child.id, 'date_of_birth', changeEvent.target.value)}
                                        />
                                        <FieldError errors={formErrors} name={`children.${child.id}.date_of_birth`} />
                                    </div>
                                    <div style={{ paddingTop: '28px' }}>
                                        <button type="button" className="btn-remove-child" onClick={() => handleRemoveChild(child.id)} aria-label="Remove child">x</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="reg-section">
                        <h2 className="reg-section-title">Parish Involvement (Optional)</h2>
                        <div className="checkbox-group">
                            <label className="checkbox-label">
                                <input type="checkbox" name="volunteering" onChange={handleChange} />
                                <div>
                                    <span>Volunteering</span>
                                    <span className="checkbox-desc">I am interested in volunteering for parish activities (e.g. reading, welcoming, flower arranging).</span>
                                </div>
                            </label>
                            <label className="checkbox-label">
                                <input type="checkbox" name="parish_groups" onChange={handleChange} />
                                <div>
                                    <span>Parish Groups</span>
                                    <span className="checkbox-desc">I would like information about joining parish groups or choirs.</span>
                                </div>
                            </label>
                            <label className="checkbox-label">
                                <input type="checkbox" name="sacramental_preparation" onChange={handleChange} />
                                <div>
                                    <span>Sacramental Preparation</span>
                                    <span className="checkbox-desc">I require information about baptism, first communion, or confirmation.</span>
                                </div>
                            </label>
                            <label className="checkbox-label">
                                <input type="checkbox" name="weekly_newsletter" onChange={handleChange} />
                                <div>
                                    <span>Weekly Newsletter</span>
                                    <span className="checkbox-desc">I would like to receive the parish newsletter by email.</span>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div className="reg-section">
                        <h2 className="reg-section-title">Data Protection & Signature</h2>

                        <p style={{ color: 'var(--text-mid)', fontSize: '0.95rem', marginBottom: '24px', lineHeight: '1.6' }}>
                            Your privacy is important to us. The personal data you provide will be stored securely by St Mary's Cathedral and the Diocese of Wrexham in accordance with GDPR regulations. It will only be used for parish administration, pastoral care, and communication.
                        </p>

                        <div className="checkbox-group">
                            <label className="checkbox-label">
                                <input type="checkbox" name="contact_by_phone" onChange={handleChange} />
                                <span>I am happy to be contacted by Phone</span>
                            </label>
                            <label className="checkbox-label">
                                <input type="checkbox" name="contact_by_email" onChange={handleChange} />
                                <span>I am happy to be contacted by Email</span>
                            </label>
                        </div>

                        <div className="consent-box">
                            <label className="checkbox-label" style={{ fontWeight: '600', color: 'var(--navy)' }}>
                                <input type="checkbox" required name="consent" onChange={handleChange} />
                                <span>I confirm that I consent to the parish maintaining my records as detailed above *</span>
                            </label>
                            <FieldError errors={formErrors} name="consent" />
                        </div>

                        <div className="form-grid-2" style={{ marginTop: '32px' }}>
                            <div className="form-group">
                                <label>Signed (Type your full name) <span className="required">*</span></label>
                                <input type="text" className="form-input" placeholder="Your signature" required name="signature" onChange={handleChange} onBlur={event => formatFieldValue(event, titleCaseWords)} aria-invalid={Boolean(formErrors.signature)} />
                                <FieldError errors={formErrors} name="signature" />
                            </div>
                            <div className="form-group">
                                <label>Date <span className="required">*</span></label>
                                <input type="date" className="form-input" required name="signed_date" onChange={handleChange} aria-invalid={Boolean(formErrors.signed_date)} />
                                <FieldError errors={formErrors} name="signed_date" />
                            </div>
                        </div>
                    </div>

                    <div className="reg-action-bar">
                        <span className="reg-footnote">Your information will be securely stored and used only for parish purposes.</span>
                        <div className="reg-action-buttons">
                            <button type="reset" className="btn-outline-white" onClick={resetRegistrationForm}>Clear Form</button>
                            <button type="submit" className="btn-gold" disabled={isSubmitting}>
                                {isSubmitting ? 'Submitting...' : 'Submit Registration'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
            <FeedbackDialog
                open={dialogState.open}
                tone={dialogState.tone}
                title={dialogState.title}
                message={dialogState.message}
                confirmLabel={dialogState.tone === 'success' ? 'Register Another' : 'Close'}
                secondaryLabel={dialogState.tone === 'success' ? 'Back to Home' : ''}
                onSecondary={dialogState.tone === 'success' ? () => {
                    setDialogState(current => ({ ...current, open: false }))
                    navigate('/')
                } : undefined}
                onClose={() => setDialogState(current => ({ ...current, open: false }))}
            />
        </div>
    )
}
