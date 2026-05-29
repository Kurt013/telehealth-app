import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Stethoscope,
  FileText,
  MessageCircle,
  ChevronRight,
  Beaker,
  CheckCircle,
  Pill,
} from "lucide-react";
import Link from "next/link";
import { PROTECTED_PAGES } from "../../constants";

export default function PatientDashboard() {
  return (
    <div className="w-full space-y-8">
      {/* Header Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Good morning, Alex</h1>
        <p className="text-muted-foreground">
          Here's your health summary for today.
        </p>
      </div>

      {/* Next Appointment Card */}
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Badge variant="outline" className="bg-white">
                NEXT APPOINTMENT
              </Badge>
              <div>
                <h3 className="text-xl font-bold">Dr. Sarah Miller</h3>
                <p className="text-sm text-muted-foreground">
                  Cardiology Check-up
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-blue-600">02</div>
              <p className="text-xs text-muted-foreground">Days Left</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Find Doctors */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <Link
                href={PROTECTED_PAGES.PATIENT.DOCTORS}
                className="space-y-3 block"
              >
                <div className="text-3xl">
                  <Stethoscope className="h-6 w-6 text-teal-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Find Your Doctor</h3>
                  <p className="text-xs text-muted-foreground">
                    Look for suitable doctors
                  </p>
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* Book Appointment */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <Link
                href={PROTECTED_PAGES.PATIENT.APPOINTMENTS}
                className="space-y-3 block"
              >
                <div className="text-3xl">
                  <Calendar className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Manage Appointments</h3>
                  <p className="text-xs text-muted-foreground">
                    Keep track of your appointments
                  </p>
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* Message Team */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <Link href={PROTECTED_PAGES.PATIENT.MESSAGES} className="space-y-3 block">
                <div className="text-3xl">
                  <MessageCircle className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Message Your Doctor</h3>
                  <p className="text-xs text-muted-foreground">
                    Direct chat with your appointed doctor
                  </p>
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* View Records */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <Link href={PROTECTED_PAGES.PATIENT.RECORDS} className="space-y-3 block">
                <div className="text-3xl">
                  <FileText className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-semibold">View Records</h3>
                  <p className="text-xs text-muted-foreground">
                    Access your medical history
                  </p>
                </div>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Activity</h2>
          <Link
            href="/patient/records"
            className="text-sm text-blue-600 hover:underline"
          >
            View All
          </Link>
        </div>
        <div className="space-y-3">
          {/* Activity Item 1 */}
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-blue-100 p-2">
                  <Beaker className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">
                    Lab Results Ready: Metabolic Panel
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Requested by Dr. Miller • 2 hours ago
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-teal-100 text-teal-700">New</Badge>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          {/* Activity Item 2 */}
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-teal-100 p-2">
                  <CheckCircle className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <p className="font-medium">Appointment Confirmed</p>
                  <p className="text-xs text-muted-foreground">
                    Cardiology with Dr. Miller • Yesterday at 4:30 PM
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>

          {/* Activity Item 3 */}
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-purple-100 p-2">
                  <Pill className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium">Prescription Refilled</p>
                  <p className="text-xs text-muted-foreground">
                    Atorvastatin 20mg • Aug 12, 2023
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
