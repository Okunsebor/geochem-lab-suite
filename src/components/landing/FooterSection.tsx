import { Link } from "@tanstack/react-router";
import { UniPodLogo } from "@/components/branding/UniPodLogo";

const PRODUCT_LINKS = [
  { label: "Laboratory", href: "#laboratory" },
  { label: "Workflow", href: "#workflow" },
  { label: "Modules", href: "#modules" },
  { label: "Security", href: "#security" },
];

export default function FooterSection() {
  return (
    <footer className="border-t border-border bg-[#0B1F33] text-white/80">
      <div className="mx-auto max-w-7xl px-6 py-10 md:py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <UniPodLogo height={36} linkToHome showTagline />
            <p className="mt-4 text-xs leading-relaxed max-w-xs text-white/60">
              GeoChem Suite — geochemistry laboratory information system at UniPod Nsuk.
            </p>
          </div>
          <div>
            <h3 className="text-xs font-bold font-mono uppercase tracking-widest text-accent mb-4">Explore</h3>
            <ul className="space-y-2 text-sm">
              {PRODUCT_LINKS.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="hover:text-white transition-colors">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-bold font-mono uppercase tracking-widest text-accent mb-4">Access</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/register" className="hover:text-white transition-colors">
                  Register
                </Link>
              </li>
              <li>
                <Link to="/login" search={{}} className="hover:text-white transition-colors">
                  Sign in
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-bold font-mono uppercase tracking-widest text-accent mb-4">Contact</h3>
            <a href="mailto:geochem@unipod.edu.ng" className="text-sm hover:text-white transition-colors">
              geochem@unipod.edu.ng
            </a>
          </div>
        </div>
        <p className="mt-12 pt-8 border-t border-white/10 text-xs text-white/50">
          © 2026 UniPod · GeoChem Suite. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
