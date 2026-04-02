import {
  Pen,
  TrainFront,
  Layers,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

const APPS = [
  {
    href: "/linkedin-generator",
    title: "LinkedIn Generator",
    description: "Generate viral LinkedIn posts with Claude AI",
    icon: Pen,
    color: "#0077b5",
    tag: "AI",
  },
  {
    href: "/trains",
    title: "Trains de Nuit",
    description: "Interactive map of night train routes worldwide",
    icon: TrainFront,
    color: "#22c55e",
    tag: "Map",
  },
  {
    href: "/tech-comparison",
    title: "US vs India AI Stack",
    description: "Technology stack comparison matrix",
    icon: Layers,
    color: "#a855f7",
    tag: "Research",
  },
];

export default function Dashboard() {
  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            Super App
          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Charles Tools</h1>
        <p className="text-muted-foreground mt-1">
          All your internal tools in one place. Pick one to get started.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {APPS.map((app) => (
          <Link
            key={app.href}
            href={app.href}
            className="group relative flex flex-col gap-4 p-6 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200"
          >
            {/* Tag */}
            <span
              className="absolute top-4 right-4 text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: app.color + "18",
                color: app.color,
              }}
            >
              {app.tag}
            </span>

            {/* Icon */}
            <div
              className="flex items-center justify-center w-11 h-11 rounded-lg"
              style={{ backgroundColor: app.color + "15" }}
            >
              <app.icon className="w-5 h-5" style={{ color: app.color }} />
            </div>

            {/* Text */}
            <div>
              <h2 className="font-semibold text-card-foreground group-hover:text-primary transition-colors">
                {app.title}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {app.description}
              </p>
            </div>

            {/* Arrow */}
            <div className="mt-auto pt-2 text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">
              Open &rarr;
            </div>
          </Link>
        ))}

        {/* Coming soon card */}
        <div className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border border-dashed border-border text-muted-foreground">
          <Sparkles className="w-6 h-6 opacity-40" />
          <span className="text-sm font-medium">More tools coming soon</span>
        </div>
      </div>
    </div>
  );
}
