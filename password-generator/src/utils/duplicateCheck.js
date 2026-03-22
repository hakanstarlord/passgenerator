export function findDuplicatePassword(password, vaultPasswords) {
  if (!password || !vaultPasswords?.length) return null
  const match = vaultPasswords.find(entry => entry.password === password)
  return match ? match.name : null
}

export function flagDuplicateEntries(entries, vaultPasswords) {
  if (!entries?.length) return entries?.map(e => ({ ...e, isDuplicate: false })) || []
  if (!vaultPasswords?.length) return entries.map(e => ({ ...e, isDuplicate: false }))

  const vaultPasswordSet = new Set(vaultPasswords.map(vp => vp.password))
  return entries.map(entry => ({
    ...entry,
    isDuplicate: vaultPasswordSet.has(entry.password),
    duplicateName: findDuplicatePassword(entry.password, vaultPasswords),
  }))
}
