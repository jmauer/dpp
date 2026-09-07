/**
 * Legt ein neues Teammitglied an.
 *
 * Muss serverseitig laufen: das Anlegen von Benutzern geht nur ueber die
 * Supabase-Admin-API mit dem service_role-Key. Der umgeht saemtliche
 * RLS-Policies und darf deshalb unter keinen Umstaenden in den Client.
 *
 * Ablauf:
 *   1. Aufrufer authentifizieren und pruefen, dass er Admin ist
 *   2. Benutzer in auth.users anlegen (Trigger legt das Profil an)
 *   3. Profil um Mandant, Rolle und Personalnummer ergaenzen
 */
import { createClient } from '@supabase/supabase-js'
import { serverSupabaseUser } from '#supabase/server'

interface Body {
  personalNummer?: string
  firstName?:      string
  lastName?:       string
  email?:          string
  password?:       string
  role?:           'admin' | 'manager' | 'viewer'
}

export default defineEventHandler(async (event) => {
  const serviceKey  = process.env.SUPABASE_SERVICE_KEY
  const supabaseUrl = process.env.SUPABASE_URL

  if (!serviceKey || !supabaseUrl) {
    throw createError({
      statusCode: 500,
      statusMessage: 'SUPABASE_SERVICE_KEY ist nicht konfiguriert. '
                   + 'Ohne diesen Schlüssel können keine Benutzer angelegt werden.',
    })
  }

  // 1. Aufrufer pruefen
  const caller = await serverSupabaseUser(event)
  if (!caller) {
    throw createError({ statusCode: 401, statusMessage: 'Nicht angemeldet.' })
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: callerProfile } = await admin
    .from('profiles')
    .select('role, company_id')
    .eq('id', caller.id)
    .maybeSingle()

  if (callerProfile?.role !== 'admin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Nur Administratoren dürfen Benutzer anlegen.',
    })
  }
  if (!callerProfile.company_id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Ihr Konto ist keinem Unternehmen zugeordnet.',
    })
  }

  // 2. Eingaben pruefen
  const body = await readBody<Body>(event)
  const email    = body.email?.trim().toLowerCase()
  const password = body.password
  const role     = body.role ?? 'viewer'

  if (!email || !password) {
    throw createError({ statusCode: 400, statusMessage: 'E-Mail und Passwort sind erforderlich.' })
  }
  if (password.length < 8) {
    throw createError({ statusCode: 400, statusMessage: 'Das Passwort muss mindestens 8 Zeichen haben.' })
  }
  if (!['admin', 'manager', 'viewer'].includes(role)) {
    throw createError({ statusCode: 400, statusMessage: 'Ungültige Rolle.' })
  }

  // 3. Benutzer anlegen
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { first_name: body.firstName ?? '', last_name: body.lastName ?? '' },
  })

  if (createErr || !created?.user) {
    const msg = createErr?.message ?? 'Benutzer konnte nicht angelegt werden.'
    throw createError({
      statusCode: msg.toLowerCase().includes('already') ? 409 : 400,
      statusMessage: msg.toLowerCase().includes('already')
        ? 'Diese E-Mail-Adresse wird bereits verwendet.'
        : msg,
    })
  }

  // 4. Profil vervollstaendigen (der Trigger hat es bereits angelegt)
  const { error: profileErr } = await admin
    .from('profiles')
    .update({
      company_id:      callerProfile.company_id,
      role,
      first_name:      body.firstName ?? '',
      last_name:       body.lastName ?? '',
      personal_number: body.personalNummer ?? '',
      email,
    })
    .eq('id', created.user.id)

  if (profileErr) {
    // Verwaisten Auth-User wieder entfernen, sonst existiert ein
    // Login ohne Mandantenzuordnung.
    await admin.auth.admin.deleteUser(created.user.id)
    throw createError({
      statusCode: 500,
      statusMessage: `Profil konnte nicht gespeichert werden: ${profileErr.message}`,
    })
  }

  return {
    id:             created.user.id,
    email,
    firstName:      body.firstName ?? '',
    lastName:       body.lastName ?? '',
    role,
    personalNummer: body.personalNummer ?? '',
  }
})
