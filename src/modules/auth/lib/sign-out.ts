// TODO: conectar con la autenticación real (p. ej. signOut de NextAuth) para invalidar la sesión.
export async function signOutUser(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 300))
}
