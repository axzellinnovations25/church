import { createElement } from 'react'

export default function Section({ as = 'section', className = '', variant = '', ...props }) {
  const classes = ['section', variant, className].filter(Boolean).join(' ')
  return createElement(as, { className: classes, ...props })
}
