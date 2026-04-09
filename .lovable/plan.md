

# Plan: Autenticación completa con Supabase Auth

## Resumen

Implementar login, registro, recuperación de contraseña, protección de rutas, cierre de sesión y saludo personalizado usando Supabase Auth, manteniendo el diseño visual actual.

## Cambios en base de datos

**Migración SQL**: Crear tabla `profiles` con trigger para auto-creación al registrarse.

```sql
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## Archivos nuevos

1. **`src/pages/LoginPage.tsx`** — Formulario email/contraseña, links a registro y recuperación, logo Pliq centrado, fondo gris claro, sin sidebar.

2. **`src/pages/RegisterPage.tsx`** — Campos nombre, email, contraseña, confirmar contraseña. Validación min 8 chars. Guarda nombre en `user_metadata.name`. Redirige a `/` post-registro.

3. **`src/pages/ForgotPasswordPage.tsx`** — Campo email, botón enviar, mensaje de confirmación.

4. **`src/pages/ResetPasswordPage.tsx`** — Formulario para nueva contraseña (requerido para que el reset funcione). Detecta `type=recovery` en URL hash.

5. **`src/hooks/useAuth.ts`** — Hook con estado de sesión, `user`, `profile`, `loading`, funciones `signIn`, `signUp`, `signOut`, `resetPassword`. Usa `onAuthStateChange` + `getSession`.

6. **`src/components/auth/ProtectedRoute.tsx`** — Wrapper que redirige a `/login` si no hay sesión. Muestra loading mientras verifica.

## Archivos modificados

7. **`src/App.tsx`** — Envolver rutas en `ProtectedRoute`. Rutas públicas: `/login`, `/register`, `/forgot-password`, `/reset-password`. Rutas protegidas: todas las demás.

8. **`src/components/layout/AppSidebar.tsx`** — Reemplazar el nombre de localStorage por el nombre del perfil del usuario autenticado. Agregar botón "Cerrar sesión" con icono `LogOut` en el footer del sidebar, junto a Configuración.

## Configuración

9. **No habilitar auto-confirm de email** — Los usuarios deben verificar su email antes de poder iniciar sesión.

## Detalles técnicos

- Las páginas de auth (login, registro, forgot) usan layout simple centrado sin sidebar
- `useAuth` consulta la tabla `profiles` para obtener el nombre del usuario
- El `signUp` pasa `options: { data: { name } }` para que el trigger cree el perfil con nombre
- `ProtectedRoute` envuelve las rutas en `App.tsx` y muestra spinner mientras `loading` es true
- Se vinculan todos los datos existentes (payment_plans, payees, etc.) al usuario autenticado mediante RLS en una fase posterior si se desea

