import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  HardHat,
  Hammer,
  Sparkles,
  Trophy,
  Zap,
  CheckCircle2
} from 'lucide-react'

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-slate-100 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <Card className="p-8 md:p-12 border-2 border-orange-200 shadow-2xl bg-white/90 backdrop-blur">
          {/* Animated Hard Hat Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 animate-ping">
                <HardHat className="h-20 w-20 text-orange-500/20" />
              </div>
              <HardHat className="h-20 w-20 text-orange-500 relative" />
            </div>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-4 text-slate-900">
            Hard Hat Status:{' '}
            <span className="text-orange-600">ON</span>
          </h1>

          <p className="text-xl text-center text-slate-600 mb-8">
            Welcome to Alleato! You're officially ready to build something amazing.
          </p>

          {/* Witty Construction-Themed Messages */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
              <div className="flex items-start gap-3">
                <Hammer className="h-6 w-6 text-orange-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Foundation: Solid ✓</h3>
                  <p className="text-sm text-slate-600">
                    Your account is set up and ready to roll. No cracks in this foundation.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <Sparkles className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Plans: Approved ✓</h3>
                  <p className="text-sm text-slate-600">
                    Your projects are about to be managed better than a superintendent's clipboard.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
              <div className="flex items-start gap-3">
                <Trophy className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Safety First ✓</h3>
                  <p className="text-sm text-slate-600">
                    Your data is more secure than a job site with six foremen watching.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Fun Stats */}
          <div className="bg-slate-50 border-2 border-slate-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 text-center">
              What You're About to Experience:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                <span className="text-slate-700">
                  <strong>80%</strong> of Procore's features at <strong>10%</strong> of the cost
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                <span className="text-slate-700">
                  <strong>100%</strong> less paperwork headaches
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                <span className="text-slate-700">
                  AI-powered insights (basically having a project manager who never sleeps)
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                <span className="text-slate-700">
                  Budget tracking so tight, even your CFO will smile
                </span>
              </div>
            </div>
          </div>

          {/* Witty One-Liner */}
          <div className="text-center mb-8">
            <p className="text-slate-500 italic text-sm">
              "We can't build you a building, but we can help you build one without losing your mind."
            </p>
          </div>

          {/* CTA Button */}
          <div className="flex justify-center">
            <Link href="/">
              <Button
                size="lg"
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all duration-200 group"
              >
                <Zap className="mr-2 h-5 w-5 group-hover:animate-pulse" />
                Get Started - Let's Build!
              </Button>
            </Link>
          </div>

          {/* Footer Note */}
          <p className="text-center text-xs text-slate-400 mt-8">
            Reminder: Alleato is not responsible for actual construction. Please consult licensed professionals for that.
          </p>
        </Card>
      </div>
    </div>
  )
}
