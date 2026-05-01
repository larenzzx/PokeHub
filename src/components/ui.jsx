import { Loader2 } from "lucide-react";

export function Button({ className = "", variant = "primary", ...props }) {
  const variants = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    outline: "btn-outline",
    ghost: "btn-ghost",
    danger: "btn-error text-white",
  };
  return <button className={`btn min-h-11 whitespace-normal text-wrap ${variants[variant] || variants.primary} ${className}`} {...props} />;
}

export function Card({ className = "", children }) {
  return <section className={`game-panel ${className}`}>{children}</section>;
}

export function Badge({ className = "", children }) {
  return <span className={`badge border-2 border-slate-900/30 font-black uppercase ${className}`}>{children}</span>;
}

export function Input({ className = "", ...props }) {
  return <input className={`input input-bordered border-2 border-blue-900 bg-white ${className}`} {...props} />;
}

export function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 font-black text-slate-800">
      <input type="checkbox" className="toggle toggle-primary" checked={checked} onChange={onChange} />
      {label && <span>{label}</span>}
    </label>
  );
}

export function StatBar({ label, value, max = 180 }) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="grid grid-cols-[86px_1fr_38px] items-center gap-3 text-sm">
      <span className="truncate font-bold capitalize text-slate-700">{label}</span>
      <div className="h-3 overflow-hidden rounded-full border border-slate-300 bg-slate-100">
        <div className="h-full bg-gradient-to-r from-blue-500 to-yellow-400" style={{ width: `${percent}%` }} />
      </div>
      <span className="text-right font-bold">{value}</span>
    </div>
  );
}

export function Modal({ children, className = "" }) {
  return <div className={`modal-box rounded-lg border-4 border-slate-900 bg-white text-slate-950 ${className}`}>{children}</div>;
}

export function EmptyState({ icon, title, action, children }) {
  return (
    <div className="game-panel mx-auto max-w-lg p-8 text-center">
      {icon}
      <h2 className="text-2xl font-black text-blue-950">{title}</h2>
      <p className="mt-2 font-semibold text-slate-700">{children}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function LoadingState({ label = "Loading" }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-blue-950">
      <Loader2 className="size-10 animate-spin" />
      <p className="font-black">{label}</p>
    </div>
  );
}
