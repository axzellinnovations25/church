export function focusAdminEditor(editorRef) {
  const node = editorRef?.current

  if (!node) {
    return
  }

  const rect = node.getBoundingClientRect()
  const viewportHeight = window.innerHeight || 0
  const isVisible = rect.top >= 0 && rect.top < viewportHeight * 0.6

  if (isVisible) {
    return
  }

  window.requestAnimationFrame(() => {
    try {
      node.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } catch {
      node.scrollIntoView()
    }
  })
}

