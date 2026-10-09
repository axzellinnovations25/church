export function isAdminUser(user) {
  return Boolean(user?.is_main_admin || user?.group_id)
}
