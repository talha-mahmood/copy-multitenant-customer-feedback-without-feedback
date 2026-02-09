
import { DataSource } from 'typeorm';
import { CouponTemplate } from '../../modules/coupons/entities/coupon-template.entity';

export default async function seedCouponTemplates(dataSource: DataSource) {
  const repo = dataSource.getRepository(CouponTemplate);

  const templates = [
    {
      name: 'Sunrise Promo',
      type: 'annual',
      html: `
<button
  type="button"
  class="group relative w-full overflow-hidden rounded-xl p-4 text-left shadow-sm bg-gradient-to-br from-amber-100 via-white to-orange-50 text-amber-900"
>
  <div class="flex gap-4 items-start">
    <img
      src="{{logo}}"
      alt="Brand Logo"
      class="h-14 w-14 rounded-md object-contain bg-white/70 p-1 shadow-sm"
    />

    <div class="flex-1">
      <div class="text-xs font-semibold uppercase tracking-[0.18em] opacity-70">
        {{header}}
      </div>
      <div class="mt-1 text-2xl font-bold leading-tight">{{title}}</div>
      <p class="mt-2 text-sm opacity-80 line-clamp-3">{{description}}</p>
    </div>
  </div>
</button>`
    },

    {
      name: 'Midnight Glow',
      type: 'annual',
      html: `
<button
  type="button"
  class="group relative w-full overflow-hidden rounded-xl p-4 text-left shadow-sm bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white"
>
  <div class="flex gap-4 items-start">
    <img
      src="{{logo}}"
      alt="Brand Logo"
      class="h-14 w-14 rounded-md object-contain bg-white/10 p-1 shadow-sm"
    />

    <div class="flex-1">
      <div class="text-xs font-semibold uppercase tracking-[0.18em] opacity-70">
        {{header}}
      </div>
      <div class="mt-1 text-2xl font-bold leading-tight">{{title}}</div>
      <p class="mt-2 text-sm opacity-80 line-clamp-3">{{description}}</p>
    </div>
  </div>
</button>`
    },

    {
      name: 'Fresh Mint',
      type: 'annual',
      html: `
<button
  type="button"
  class="group relative w-full overflow-hidden rounded-xl p-4 text-left shadow-sm bg-gradient-to-br from-emerald-50 via-white to-emerald-100 text-emerald-900"
>
  <div class="flex gap-4 items-start">
    <img
      src="{{logo}}"
      alt="Brand Logo"
      class="h-14 w-14 rounded-md object-contain bg-white/70 p-1 shadow-sm"
    />

    <div class="flex-1">
      <div class="text-xs font-semibold uppercase tracking-[0.18em] opacity-70">
        {{header}}
      </div>
      <div class="mt-1 text-2xl font-bold leading-tight">{{title}}</div>
      <p class="mt-2 text-sm opacity-80 line-clamp-3">{{description}}</p>
    </div>
  </div>
</button>`
    },

    {
      name: 'Amber Edge',
      type: 'annual',
      html: `
<button
  type="button"
  class="group relative w-full overflow-hidden rounded-xl p-4 text-left shadow-sm bg-gradient-to-br from-yellow-50 via-white to-amber-100 text-amber-900"
>
  <div class="flex gap-4 items-start">
    <img
      src="{{logo}}"
      alt="Brand Logo"
      class="h-14 w-14 rounded-md object-contain bg-white/70 p-1 shadow-sm"
    />

    <div class="flex-1">
      <div class="text-xs font-semibold uppercase tracking-[0.18em] opacity-70">
        {{header}}
      </div>
      <div class="mt-1 text-2xl font-bold leading-tight">{{title}}</div>
      <p class="mt-2 text-sm opacity-80 line-clamp-3">{{description}}</p>
    </div>
  </div>
</button>`
    },

    {
      name: 'Temporary Default',
      type: 'temporary',
      html: `
<button
  type="button"
  class="group relative w-full overflow-hidden rounded-xl p-4 text-left shadow-sm bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900"
>
  <div class="flex gap-4 items-start">
    <img
      src="{{logo}}"
      alt="Brand Logo"
      class="h-14 w-14 rounded-md object-contain bg-white/70 p-1 shadow-sm"
    />

    <div class="flex-1">
      <div class="text-xs font-semibold uppercase tracking-[0.18em] opacity-70">
        {{header}}
      </div>
      <div class="mt-1 text-2xl font-bold leading-tight">{{title}}</div>
      <p class="mt-2 text-sm opacity-80 line-clamp-3">{{description}}</p>
    </div>
  </div>
</button>`
    }
  ];

  for (const t of templates) {
    const exists = await repo.findOne({ where: { name: t.name } });
    if (!exists) {
      await repo.save(repo.create(t));
    }
  }
}
