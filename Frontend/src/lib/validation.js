export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const PHONE_PATTERN = /^[+()\d\s-]{7,20}$/
export const UK_POSTCODE_PATTERN = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i
export const NAME_TEXT_PATTERN = /^\p{L}[\p{L}\s'.-]*$/u

export function asError(message) {
  return [message]
}

export function hasErrors(errors) {
  return Object.keys(errors).length > 0
}

export function trimValue(value) {
  return typeof value === 'string' ? value.trim() : ''
}

export function isBlank(value) {
  return trimValue(value) === ''
}

export function requireField(errors, name, value, label) {
  if (isBlank(value)) {
    errors[name] = asError(`${label} is required.`)
  }
}

export function validateEmail(errors, name, value, label = 'Email address', required = true) {
  const trimmed = trimValue(value)

  if (!trimmed) {
    if (required) {
      errors[name] = asError(`${label} is required.`)
    }
    return
  }

  if (!EMAIL_PATTERN.test(trimmed)) {
    errors[name] = asError(`Enter a valid ${label.toLowerCase()}.`)
  }
}

export function validatePhone(errors, name, value, label = 'Phone number', required = false) {
  const trimmed = trimValue(value)

  if (!trimmed) {
    if (required) {
      errors[name] = asError(`${label} is required.`)
    }
    return
  }

  if (!PHONE_PATTERN.test(trimmed)) {
    errors[name] = asError(`${label} can only include numbers, spaces, +, -, and brackets.`)
  }
}

export function validateMaxLength(errors, name, value, max, label) {
  if (trimValue(value).length > max) {
    errors[name] = asError(`${label} must be ${max} characters or fewer.`)
  }
}

export function countWords(value) {
  const trimmed = trimValue(value)

  if (!trimmed) {
    return 0
  }

  return trimmed.split(/\s+/u).length
}

export function validateWordLimit(errors, name, value, maxWords, label) {
  if (countWords(value) > maxWords) {
    errors[name] = asError(`${label} must be ${maxWords} words or fewer.`)
  }
}

export function validateNameText(errors, name, value, label, required = false) {
  const trimmed = trimValue(value)

  if (!trimmed) {
    if (required) {
      errors[name] = asError(`${label} is required.`)
    }
    return
  }

  if (trimmed.length < 2) {
    errors[name] = asError(`${label} must be at least 2 characters.`)
    return
  }

  if (!NAME_TEXT_PATTERN.test(trimmed)) {
    errors[name] = asError(`${label} can only include letters, spaces, apostrophes, hyphens, and periods.`)
  }
}

export function validateDateNotFuture(errors, name, value, label) {
  if (!value) {
    return
  }

  const selected = new Date(`${value}T00:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (selected > today) {
    errors[name] = asError(`${label} cannot be in the future.`)
  }
}

export function validateDateNotPast(errors, name, value, label) {
  if (!value) {
    return
  }

  const selected = new Date(`${value}T00:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (selected < today) {
    errors[name] = asError(`${label} cannot be in the past.`)
  }
}

export function validateDateOrder(errors, endName, startValue, endValue, label) {
  if (!startValue || !endValue) {
    return
  }

  if (new Date(`${endValue}T00:00:00`) < new Date(`${startValue}T00:00:00`)) {
    errors[endName] = asError(label)
  }
}

export function validateTimeOrder(errors, endName, startValue, endValue, label) {
  if (startValue && endValue && endValue <= startValue) {
    errors[endName] = asError(label)
  }
}

export function firstError(errors) {
  const first = Object.values(errors)[0]
  return Array.isArray(first) ? first[0] : first
}
