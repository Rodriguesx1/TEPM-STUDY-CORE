import { PremiumCard } from "@/components/ui/premium";

export function StatCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <PremiumCard className="p-5">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#b79a6b]">{label}</p>
      <p className="mt-4 font-serif text-5xl font-semibold leading-none text-[#f3eee8]">{value}</p>
      <p className="mt-3 text-sm leading-6 text-[#cbbfb1]">{detail}</p>
    </PremiumCard>
  );
}

