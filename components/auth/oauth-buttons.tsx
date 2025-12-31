'use client'

import { Button } from "@/components/ui/button"
import { loginWithOAuth } from "@/lib/auth/actions"

export function OAuthButtons() {
    return (
        <div className="flex flex-col gap-3">
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                        Or continue with
                    </span>
                </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
                <Button variant="outline" onClick={() => loginWithOAuth('google')} aria-label="Sign in with Google">
                    Google
                </Button>
                <Button variant="outline" onClick={() => loginWithOAuth('apple')} aria-label="Sign in with Apple">
                    Apple
                </Button>
                <Button variant="outline" onClick={() => loginWithOAuth('facebook')} aria-label="Sign in with Facebook">
                    Facebook
                </Button>
            </div>
        </div>
    )
}
