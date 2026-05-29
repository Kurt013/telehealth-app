"use client";

export default function PatientDashboard() {
  return (
    <div className="w-full">
      <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
      <p className="text-muted-foreground">Here's what's happening with your health.</p>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-8">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <p className="text-sm font-medium">Upcoming Appointments</p>
          </div>
          <div className="text-2xl font-bold">2</div>
          <p className="text-xs text-muted-foreground">Next appointment in 3 days</p>
        </div>
        
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <p className="text-sm font-medium">Recent Results</p>
          </div>
          <div className="text-2xl font-bold">1</div>
          <p className="text-xs text-muted-foreground">Last updated today</p>
        </div>
      </div>
    </div>
  );
}