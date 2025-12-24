import { DataSource } from 'typeorm';
import { CouponTemplate } from '../../modules/coupons/entities/coupon-template.entity';

export default async function seedCouponTemplates(dataSource: DataSource) {
  const repo = dataSource.getRepository(CouponTemplate);
  const templates = [
    {
      name: 'Sunrise Promo',
      type: 'annual',
      html: `<button type=\"button\" class=\"group relative w-full overflow-hidden rounded-xl border p-4 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-primary bg-gradient-to-br from-amber-100 via-white to-orange-50 border-amber-200 text-amber-900 ring-2 ring-offset-2 ring-primary\"><div class=\"text-xs font-semibold uppercase tracking-[0.18em] opacity-70\">{{header}}</div><div class=\"mt-2 text-sm font-medium opacity-80\">Limited Time</div><div class=\"mt-1 text-2xl font-bold leading-tight\">{{title}}</div><p class=\"mt-2 text-sm opacity-80 line-clamp-3\">{{description}}</p><div class=\"pointer-events-none absolute inset-0 bg-linear-to-b from-black/0 via-black/0 to-black/0 transition group-hover:from-black/5 group-hover:to-black/20\"></div><div class=\"pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100\"><div class=\"rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white shadow-lg\">Click to Preview</div></div><div class=\"absolute top-3 right-3 rounded-full bg-primary text-primary-foreground px-3 py-1 text-[11px] font-semibold shadow\">Selected</div></button>`
    },
    {
      name: 'Midnight Glow',
      type: 'annual',
      html: `<button type=\"button\" class=\"group relative w-full overflow-hidden rounded-xl border p-4 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-primary bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-slate-700 text-white ring-2 ring-offset-2 ring-primary\"><div class=\"text-xs font-semibold uppercase tracking-[0.18em] opacity-70\">{{header}}</div><div class=\"mt-2 text-sm font-medium opacity-80\">VIP Access</div><div class=\"mt-1 text-2xl font-bold leading-tight\">{{title}}</div><p class=\"mt-2 text-sm opacity-80 line-clamp-3\">{{description}}</p><div class=\"pointer-events-none absolute inset-0 bg-linear-to-b from-black/0 via-black/0 to-black/0 transition group-hover:from-black/5 group-hover:to-black/20\"></div><div class=\"pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100\"><div class=\"rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white shadow-lg\">Click to Preview</div></div><div class=\"absolute top-3 right-3 rounded-full bg-primary text-primary-foreground px-3 py-1 text-[11px] font-semibold shadow\">Selected</div></button>`
    },
    {
      name: 'Fresh Mint',
      type: 'annual',
      html: `<button type=\"button\" class=\"group relative w-full overflow-hidden rounded-xl border p-4 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-primary bg-gradient-to-br from-emerald-50 via-white to-emerald-100 border-emerald-200 text-emerald-900 ring-2 ring-offset-2 ring-primary\"><div class=\"text-xs font-semibold uppercase tracking-[0.18em] opacity-70\">{{header}}</div><div class=\"mt-2 text-sm font-medium opacity-80\">Fresh Drops</div><div class=\"mt-1 text-2xl font-bold leading-tight\">{{title}}</div><p class=\"mt-2 text-sm opacity-80 line-clamp-3\">{{description}}</p><div class=\"pointer-events-none absolute inset-0 bg-linear-to-b from-black/0 via-black/0 to-black/0 transition group-hover:from-black/5 group-hover:to-black/20\"></div><div class=\"pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100\"><div class=\"rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white shadow-lg\">Click to Preview</div></div><div class=\"absolute top-3 right-3 rounded-full bg-primary text-primary-foreground px-3 py-1 text-[11px] font-semibold shadow\">Selected</div></button>`
    },
    {
      name: 'Amber Edge',
      type: 'annual',
      html: `<button type=\"button\" class=\"group relative w-full overflow-hidden rounded-xl border p-4 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-primary bg-gradient-to-br from-yellow-50 via-white to-amber-100 border-amber-200 text-amber-900 ring-2 ring-offset-2 ring-primary\"><div class=\"text-xs font-semibold uppercase tracking-[0.18em] opacity-70\">{{header}}</div><div class=\"mt-2 text-sm font-medium opacity-80\">Top Pick</div><div class=\"mt-1 text-2xl font-bold leading-tight\">{{title}}</div><p class=\"mt-2 text-sm opacity-80 line-clamp-3\">{{description}}</p><div class=\"pointer-events-none absolute inset-0 bg-linear-to-b from-black/0 via-black/0 to-black/0 transition group-hover:from-black/5 group-hover:to-black/20\"></div><div class=\"pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100\"><div class=\"rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white shadow-lg\">Click to Preview</div></div><div class=\"absolute top-3 right-3 rounded-full bg-primary text-primary-foreground px-3 py-1 text-[11px] font-semibold shadow\">Selected</div></button>`
    },
    {
      name: 'Temporary Default',
      type: 'temporary',
      html: `<button type=\"button\" class=\"group relative w-full overflow-hidden rounded-xl border p-4 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-primary bg-gradient-to-br from-slate-50 via-white to-slate-100 border-slate-200 text-slate-900 ring-2 ring-offset-2 ring-primary\"><div class=\"text-xs font-semibold uppercase tracking-[0.18em] opacity-70\">{{header}}</div><div class=\"mt-2 text-sm font-medium opacity-80\">Limited Run</div><div class=\"mt-1 text-2xl font-bold leading-tight\">{{title}}</div><p class=\"mt-2 text-sm opacity-80 line-clamp-3\">{{description}}</p><div class=\"pointer-events-none absolute inset-0 bg-linear-to-b from-black/0 via-black/0 to-black/0 transition group-hover:from-black/5 group-hover:to-black/20\"></div><div class=\"pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100\"><div class=\"rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white shadow-lg\">Click to Preview</div></div><div class=\"absolute top-3 right-3 rounded-full bg-primary text-primary-foreground px-3 py-1 text-[11px] font-semibold shadow\">Selected</div></button>`
    }
  ];
  for (const t of templates) {
    const exists = await repo.findOne({ where: { name: t.name } });
    if (!exists) await repo.save(repo.create(t));
  }
}
