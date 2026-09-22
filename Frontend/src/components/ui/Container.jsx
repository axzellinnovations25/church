import { createElement } from 'react'

export default function Container({ as = 'div', className = '', ...props }) {
  const classes = ['container', className].filter(Boolean).join(' ')
  return createElement(as, { className: classes, ...props })
}
