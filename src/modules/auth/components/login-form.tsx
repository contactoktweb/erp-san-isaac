'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { CircleAlert, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { submitLogin } from '../lib/submit-login'
import { loginSchema, type LoginValues } from '../schemas/login-schema'

export function LoginForm() {
  const router = useRouter()
  const [authError, setAuthError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const isSubmitting = form.formState.isSubmitting

  async function onSubmit(values: LoginValues) {
    setAuthError(null)
    const result = await submitLogin(values)
    if (result.ok) {
      router.replace('/dashboard')
      return
    }
    setAuthError(result.error)
    form.setFocus('password')
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[0.9375rem]">Correo electrónico</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="nombre@velassanisaac.com"
                  className="h-11 bg-card text-base md:text-base"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[0.9375rem]">Contraseña</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className="h-11 bg-card pr-12 text-base md:text-base"
                    {...field}
                  />
                </FormControl>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  aria-pressed={showPassword}
                  className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div aria-live="assertive">
          {authError ? (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-md border border-danger/30 bg-danger-soft px-3 py-2.5 text-[0.9375rem] text-danger"
            >
              <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {authError}
            </p>
          ) : null}
        </div>

        <Button type="submit" size="lg" disabled={isSubmitting} className="h-11 text-base">
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" aria-hidden="true" />
              Ingresando…
            </>
          ) : (
            'Ingresar'
          )}
        </Button>
      </form>
    </Form>
  )
}
