export function capitalizeFirst(value) {
  if (!value) {
    return ''
  }

  return value.replace(/^(\s*)([a-z])/, (_, leadingSpace, firstLetter) => `${leadingSpace}${firstLetter.toUpperCase()}`)
}

export function titleCaseWords(value) {
  if (!value) {
    return ''
  }

  return value.replace(/\b([a-z])([\w'’-]*)/g, (_, firstLetter, rest) => `${firstLetter.toUpperCase()}${rest}`)
}
