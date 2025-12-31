'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

export async function loginAction(values: { email: string, password: string }) {
    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithPassword(values)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/', 'layout')
    redirect('/account')
}

export async function signupAction(values: { email: string, password: string, fullName: string }) {
    const supabase = await createClient()

    const { error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
            data: {
                full_name: values.fullName,
            },
        },
    })

    if (error) {
        return { error: error.message }
    }

    // If email verification is enabled, user will not be signed in immediately
    // unless we use auto-confirm. For now assume verification required or handled.
    // If session created, redirect. Else show success.

    // Check if session established (sign in successful immediately? happens if email confirmation off)
    const { data: { session } } = await supabase.auth.getSession()

    if (session) {
        revalidatePath('/', 'layout')
        redirect('/account')
    }

    // If no session (email confirmation required), return success message
    // But our UI expects { error: null }. We should specific success logic?
    // Current UI just clears error.
    // Ideally we redirect to a "Check your email" page.
    // redirect('/auth/verify-email') 
    // Wait, I haven't created /auth/verify-email page.
    // For now let's redirect to /login?message=check-email
    // ... existing code ...
    redirect('/login?message=check-email')
}

export async function loginWithOAuth(provider: 'google' | 'apple' | 'facebook') {
    const supabase = await createClient()

    // Get site URL from env or default to generic localhost
    // Note: Vercel sets VERCEL_URL but logic for correct proto needed. 
    // Supabase also allows relative URLs in redirectTo if configured? 
    // Safer to use production URL if set.
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
            redirectTo: `${siteUrl}/auth/callback`,
        },
    })

    if (error) {
        return { error: error.message }
    }

    if (data.url) {
        redirect(data.url)
    }
}
