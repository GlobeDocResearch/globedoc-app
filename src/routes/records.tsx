import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, Home as HomeIcon, Globe, Plane, Link as LinkIcon, User, FileText } from "lucide-react";
import logo from "@/assets/globedoc-logo.svg";

export const Route = createFileRoute("/records")({
  head: () => ({ meta: [{ title: "Records — GlobeDoc" }] }),
  component: RecordsPage,
});

function RecordsPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-24">
      <header className="flex items-center justify-between bg-white px-5 py-3 shadow-sm">
        <div className="flex items-center gap-2.5">
          <img src={logo} alt="GlobeDoc" className="h-11 w-11" />
          <span className="text-lg font-bold text-[#0D1B2A]">GlobeDoc</span>
        </div>
        <button type="button" aria-label="Notifications" className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600">
          <Bell className="h-5 w-5" />
        </button>
      </header>

      <main className="mx-auto w-full max-w-3xl px-5 py-6">
        <h1 className="text-2xl font-bold text-[#0D1B2A]">Records</h1>
        <p className="mt-1 text-sm text-gray-500">Your medical records and documents</p>

        <div className="mt-6 flex flex-col items-center rounded-2xl bg-white p-10 text-center shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <FileText className="h-7 w-7 text-gray-400" />
          </div>
          <h2 className="mt-4 text-base font-bold text-[#0D1B2A]">No records yet</h2>
          <p className="mt-1 text-sm text-gray-500">Upload clinical documents to keep them with your passport.</p>
        </div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-gray-100 bg-white">
        <ul className="mx-auto flex max-w-3xl items-center justify-around px-2 py-2">
          <NavTab to="/home" icon={<HomeIcon className="h-5 w-5" />} label="Home" />
          <NavTab to="/passport" icon={<Globe className="h-5 w-5" />} label="Passport" />
          <NavTab to="/travel" icon={<Plane className="h-5 w-5" />} label="Travel" />
          <NavTab to="/records" icon={<FileText className="h-5 w-5" />} label="Records" active />
          <NavTab to="/pairing" icon={<LinkIcon className="h-5 w-5" />} label="Pairing" />
          <NavTab to="/profile" icon={<User className="h-5 w-5" />} label="Profile" />
        </ul>
      </nav>
    </div>
  );
}

function NavTab({ icon, label, active, to }: { icon: React.ReactNode; label: string; active?: boolean; to: "/home" | "/passport" | "/travel" | "/records" | "/pairing" | "/profile" }) {
  const className = `flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-medium ${active ? "bg-blue-50 text-[#2563EB]" : "text-gray-500"}`;
  return (
    <li>
      <Link to={to} className={className}>{icon}<span>{label}</span></Link>
    </li>
  );
}
