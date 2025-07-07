import { Loader2 } from "lucide-react"

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-orange-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Loading Dashboard</h2>
            <p className="text-slate-400">Please wait while we fetch your simulations...</p>
          </div>
        </div>
      </div>
    </div>
  )
}
