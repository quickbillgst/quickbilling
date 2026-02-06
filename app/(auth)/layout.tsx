import React from "react"
import { ShieldCheck } from "lucide-react"

interface AuthLayoutProps {
  children: React.ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4 lg:p-8">
      <div className="w-full max-w-[1200px] overflow-hidden rounded-xl bg-background shadow-xl lg:grid lg:grid-cols-2 lg:min-h-[600px]">
        
        {/* Left Side: Branding/Visuals */}
        <div className="relative hidden lg:flex flex-col justify-between bg-zinc-900 p-10 text-white">
          <div className="absolute inset-0 bg-zinc-900" />
          
          {/* Decorative Pattern/Gradient */}
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/50 to-transparent" />

          {/* Logo Area */}
          <div className="relative z-20 flex items-center text-lg font-medium">
            <ShieldCheck className="mr-2 h-6 w-6" />
            GST Billing Pro
          </div>
          
          {/* Quote/Testimonial */}
          <div className="relative z-20 mt-auto">
            <blockquote className="space-y-4">
              <p className="text-xl font-medium leading-relaxed">
                &ldquo;This improved our billing efficiency by 50%. The comprehensive analytics and easy GST filing are game changers for our business.&rdquo;
              </p>
              <footer className="text-sm opacity-80">
                <cite className="not-italic font-semibold block">Sofia Davis</cite>
                <span className="text-xs">CEO, Technova Inc</span>
              </footer>
            </blockquote>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="flex items-center justify-center p-6 sm:p-12 lg:p-16">
          <div className="mx-auto w-full max-w-[400px] flex flex-col justify-center space-y-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
