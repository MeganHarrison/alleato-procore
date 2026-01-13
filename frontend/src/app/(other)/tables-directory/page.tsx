"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Database,
  FileText,
  Calendar,
  Brain,
  AlertCircle,
  Target,
  Users,
  Building2,
  Mail,
  ClipboardList,
  MessageSquare,
  DollarSign,
  Briefcase,
  UserCheck,
  CalendarDays,
  FileCheck,
  ListTodo,
  Lightbulb,
  TrendingUp,
} from "lucide-react";

interface TableInfo {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  category:
    | "Core Data"
    | "Project Management"
    | "Financial"
    | "Directory"
    | "AI Insights";
  recordType: string;
}

const tables: TableInfo[] = [
  // Core Data Tables
  {
    title: "Daily Logs",
    description:
      "Track daily activities, weather conditions, and workforce on site",
    href: "/daily-logs",
    icon: CalendarDays,
    category: "Core Data",
    recordType: "Log Entries",
  },
  {
    title: "Daily Reports",
    description:
      "Comprehensive daily construction reports with photos and notes",
    href: "/daily-reports",
    icon: FileText,
    category: "Core Data",
    recordType: "Reports",
  },
  {
    title: "Meeting Segments",
    description: "Parsed and searchable meeting transcripts with timestamps",
    href: "/meeting-segments",
    icon: MessageSquare,
    category: "Core Data",
    recordType: "Segments",
  },
  {
    title: "Notes",
    description: "Project notes, observations, and important reminders",
    href: "/notes",
    icon: FileText,
    category: "Core Data",
    recordType: "Notes",
  },

  // Project Management Tables
  {
    title: "Tasks",
    description: "Project tasks, assignments, and completion tracking",
    href: "/tasks",
    icon: ListTodo,
    category: "Project Management",
    recordType: "Tasks",
  },
  {
    title: "RFIs",
    description: "Requests for Information and their responses",
    href: "/rfis",
    icon: ClipboardList,
    category: "Project Management",
    recordType: "RFIs",
  },
  {
    title: "Punch List",
    description: "Track punch list items and completion status",
    href: "/punch-list",
    icon: FileCheck,
    category: "Project Management",
    recordType: "Items",
  },
  {
    title: "Meetings",
    description: "Meeting records, attendees, and action items",
    href: "/meetings",
    icon: Calendar,
    category: "Project Management",
    recordType: "Meetings",
  },
  {
    title: "Risks",
    description: "Identified project risks and mitigation strategies",
    href: "/risks",
    icon: AlertCircle,
    category: "Project Management",
    recordType: "Risks",
  },

  // Financial Tables
  {
    title: "Commitments",
    description: "Purchase orders and subcontracts commitments",
    href: "/commitments",
    icon: DollarSign,
    category: "Financial",
    recordType: "Commitments",
  },

  // Directory Tables
  {
    title: "Clients",
    description: "Client information and contact details",
    href: "/clients",
    icon: Briefcase,
    category: "Directory",
    recordType: "Clients",
  },
  {
    title: "Companies",
    description: "Vendor, subcontractor, and partner companies",
    href: "/directory/companies",
    icon: Building2,
    category: "Directory",
    recordType: "Companies",
  },
  {
    title: "Contacts",
    description: "Individual contacts across all companies",
    href: "/directory/contacts",
    icon: Users,
    category: "Directory",
    recordType: "Contacts",
  },
  {
    title: "Employees",
    description: "Company employees and team members",
    href: "/employees",
    icon: UserCheck,
    category: "Directory",
    recordType: "Employees",
  },
  {
    title: "Users",
    description: "System users and their permissions",
    href: "/directory/users",
    icon: Users,
    category: "Directory",
    recordType: "Users",
  },

  // AI Insights Tables
  {
    title: "Decisions",
    description: "AI-extracted decisions from meetings and documents",
    href: "/decisions",
    icon: Brain,
    category: "AI Insights",
    recordType: "Decisions",
  },
  {
    title: "Insights",
    description: "AI-generated insights and recommendations",
    href: "/insights",
    icon: Lightbulb,
    category: "AI Insights",
    recordType: "Insights",
  },
  {
    title: "Opportunities",
    description: "Identified business opportunities and growth areas",
    href: "/opportunities",
    icon: TrendingUp,
    category: "AI Insights",
    recordType: "Opportunities",
  },
  {
    title: "Issues",
    description: "Tracked issues and their resolution status",
    href: "/issues",
    icon: AlertCircle,
    category: "AI Insights",
    recordType: "Issues",
  },
];

const categoryColors = {
  "Core Data": "bg-blue-100 text-blue-800",
  "Project Management": "bg-green-100 text-green-800",
  Financial: "bg-purple-100 text-purple-800",
  Directory: "bg-orange-100 text-orange-800",
  "AI Insights": "bg-pink-100 text-pink-800",
};

export default function TablesDirectoryPage() {
  const categories = [
    "Core Data",
    "Project Management",
    "Financial",
    "Directory",
    "AI Insights",
  ] as const;

  return (
    <div>
      <div>
        <div>
          <h1>
            Data Tables Directory
          </h1>
          <p>
            Browse and access all data tables in the system. Click on any card
            to view the table.
          </p>
        </div>

        {/* Tables by Category */}
        {categories.map((category) => {
          const categoryTables = tables.filter((t) => t.category === category);
          if (categoryTables.length === 0) return null;

          return (
            <div key={category} className="space-y-4">
              <div className="flex items-center gap-2">
                <h4>{category}</h4>
                <Badge className={categoryColors[category]}>
                  {categoryTables.length} tables
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {categoryTables.map((table) => {
                  const Icon = table.icon;
                  return (
                    <Link key={table.href} href={table.href}>
                      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <Icon className="h-6 w-6 text-foreground" />
                          </div>
                          <CardTitle className="mt-2">
                            {table.title}
                          </CardTitle>
                          <CardDescription className="text-sm">
                            {table.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-blue-600 hover:underline">
                              View Table →
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}


      </div>
    </div>
  );
}
