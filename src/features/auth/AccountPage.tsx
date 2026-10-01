import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { runtime } from '../../app/services/runtime'
import { EmptyState } from '../../shared/components/EmptyState'
import { useAuth } from './auth.context'
import type { UserProfile } from './auth.models'
import { validateProfileInput } from './profile.logic'

export function AccountPage() {
  const { state, error: authError } = useAuth()
  const uid = state.status === 'AUTHENTICATED' ? state.user.uid : null
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [profileOwnerId, setProfileOwnerId] = useState<string | null>(null)
  const loading = uid !== null && profileOwnerId !== uid
  const [pending, setPending] = useState(false)
  const [includeBilling, setIncludeBilling] = useState(true)
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    if (!uid || runtime.mode !== 'firebase') return
    let cancelled = false
    runtime.profile
      .getMine()
      .then((value) => {
        if (!cancelled) {
          setProfile(value)
          setIncludeBilling(value?.billing !== null)
          setFeedback('')
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setProfile(null)
          setIncludeBilling(true)
          setFeedback(error instanceof Error ? error.message : 'No se pudo cargar el perfil.')
        }
      })
      .finally(() => {
        if (!cancelled) setProfileOwnerId(uid)
      })
    return () => {
      cancelled = true
    }
  }, [uid])

  if (runtime.mode !== 'firebase') {
    return <EmptyState title="El perfil requiere Firebase." description="El modo demostración no guarda datos personales." />
  }
  if (authError) return <EmptyState title="No se pudo verificar tu sesión." description={authError} />
  if (state.status === 'LOADING') return <p className="service-status">Verificando sesión…</p>
  if (state.status === 'ANONYMOUS') {
    return (
      <EmptyState
        eyebrow="Mi cuenta"
        title="Inicia sesión para guardar tus datos."
        description="El perfil agiliza pedidos futuros y solo es visible para tu cuenta."
        to="/login"
        action="Iniciar sesión"
      />
    )
  }
  if (loading) return <p className="service-status">Cargando perfil…</p>

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (runtime.mode !== 'firebase') return
    const values = new FormData(event.currentTarget)
    setPending(true)
    setFeedback('')
    try {
      const input = validateProfileInput({
        firstName: String(values.get('firstName') ?? ''),
        lastName: String(values.get('lastName') ?? ''),
        phone: String(values.get('phone') ?? ''),
        billing: includeBilling
          ? {
              name: String(values.get('billingName') ?? ''),
              documentType: values.get('documentType') === 'CI' ? 'CI' : 'NIT',
              documentNumber: String(values.get('documentNumber') ?? ''),
              documentComplement: String(values.get('documentComplement') ?? ''),
            }
          : null,
      })
      const saved = await runtime.profile.saveMine(input, profile?.version ?? null)
      setProfile(saved)
      setFeedback('Perfil guardado.')
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'No se pudo guardar el perfil.')
    } finally {
      setPending(false)
    }
  }

  async function logout() {
    if (runtime.mode !== 'firebase') return
    setPending(true)
    const result = await runtime.auth.signOut()
    if (!result.ok) setFeedback(result.error.message)
    setPending(false)
  }

  return (
    <div className="container page-section account-page">
      <p className="eyebrow">Mi cuenta</p>
      <h1>Datos para tus pedidos.</h1>
      <p className="page-intro">Se usarán para completar el checkout. Podrás revisarlos antes de cada solicitud.</p>
      <form className="admin-form" key={`${uid}:${profile?.version ?? 0}`} onSubmit={save}>
        <fieldset disabled={pending}>
          <div className="admin-fields">
            <label>Nombre<input name="firstName" required maxLength={120} defaultValue={profile?.firstName ?? ''} autoComplete="given-name" /></label>
            <label>Apellidos<input name="lastName" required maxLength={120} defaultValue={profile?.lastName ?? ''} autoComplete="family-name" /></label>
          </div>
          <label>Teléfono<input name="phone" type="tel" required maxLength={30} defaultValue={profile?.phone ?? ''} autoComplete="tel" /></label>
          <label className="checkbox-label">
            <input type="checkbox" checked={includeBilling} onChange={(event) => setIncludeBilling(event.target.checked)} />
            Guardar también datos de facturación
          </label>
          {includeBilling && (
            <>
              <label>Nombre o razón social<input name="billingName" required maxLength={200} defaultValue={profile?.billing?.name ?? ''} /></label>
              <div className="admin-fields">
                <label>
                  Tipo de documento
                  <select name="documentType" defaultValue={profile?.billing?.documentType ?? 'NIT'}>
                    <option value="NIT">NIT</option>
                    <option value="CI">CI</option>
                  </select>
                </label>
                <label>Número<input name="documentNumber" required maxLength={40} defaultValue={profile?.billing?.documentNumber ?? ''} /></label>
              </div>
              <label>Complemento de CI<input name="documentComplement" maxLength={20} defaultValue={profile?.billing?.documentComplement ?? ''} /></label>
            </>
          )}
          <button className="button">{pending ? 'Guardando…' : 'Guardar perfil'}</button>
          <p role="status">{feedback}</p>
        </fieldset>
      </form>
      <div className="account-actions">
        <Link className="text-link" to="/mis-solicitudes">Ver mis solicitudes</Link>
        {state.user.role === 'ADMIN' && <Link className="text-link" to="/admin">Ir a administración</Link>}
        <button className="text-button" disabled={pending} onClick={() => void logout()}>Cerrar sesión</button>
      </div>
    </div>
  )
}
