import { useEffect, useState } from "react";
import {
  subscribeAdminAds,
  subscribeAdminBanners,
  subscribeAdminCategories,
  subscribeAdminMitraAds,
} from "../services/adminMonitoringService";

export default function AdminAssetsCatalogPage() {
  const [banners, setBanners] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [mitraAds, setMitraAds] = useState<any[]>([]);

  useEffect(() => {
    const unsubs = [
      subscribeAdminBanners(setBanners),
      subscribeAdminCategories(setCategories),
      subscribeAdminAds(setAds),
      subscribeAdminMitraAds(setMitraAds),
    ];

    return () => unsubs.forEach((unsubscribe) => unsubscribe());
  }, []);

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-orange-200/70 bg-gradient-to-br from-orange-50 via-white to-amber-50 p-6 shadow-sm">
        <div className="max-w-3xl">
          <div className="inline-flex rounded-full bg-orange-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-orange-700">
            Assets & Catalog
          </div>
          <h2 className="mt-3 text-2xl font-bold text-slate-900">
            Banners, categories, dan ads untuk pengelolaan aset pertumbuhan
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Ini mengambil cakupan modul super admin lama untuk katalog dan materi promosi,
            lalu menampilkannya dalam workspace growth ERP yang lebih tepat.
          </p>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-3xl bg-white p-5 shadow"><div className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Banners</div><div className="mt-3 text-2xl font-black text-slate-900">{banners.length}</div></div>
        <div className="rounded-3xl bg-white p-5 shadow"><div className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Categories</div><div className="mt-3 text-2xl font-black text-slate-900">{categories.length}</div></div>
        <div className="rounded-3xl bg-white p-5 shadow"><div className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Ads</div><div className="mt-3 text-2xl font-black text-slate-900">{ads.length}</div></div>
        <div className="rounded-3xl bg-white p-5 shadow"><div className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Mitra Ads</div><div className="mt-3 text-2xl font-black text-slate-900">{mitraAds.length}</div></div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-3xl bg-white p-5 shadow">
          <h3 className="text-lg font-bold text-slate-900">Categories</h3>
          <div className="mt-4 space-y-3">
            {categories.map((item: any) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 px-4 py-3">
                <div className="text-sm font-semibold text-slate-900">{item.name || item.id}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-white p-5 shadow">
          <h3 className="text-lg font-bold text-slate-900">Banners</h3>
          <div className="mt-4 space-y-3">
            {banners.map((item: any) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 px-4 py-3">
                <div className="text-sm font-semibold text-slate-900">{item.title || item.id}</div>
                <div className="mt-1 text-xs text-slate-500">{item.link || item.target || "-"}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-white p-5 shadow">
          <h3 className="text-lg font-bold text-slate-900">Ads</h3>
          <div className="mt-4 space-y-3">
            {ads.map((item: any) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 px-4 py-3">
                <div className="text-sm font-semibold text-slate-900">{item.title || item.name || item.id}</div>
                <div className="mt-1 text-xs text-slate-500">Clicks: {item.clicks || 0}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-white p-5 shadow">
          <h3 className="text-lg font-bold text-slate-900">Mitra Ads</h3>
          <div className="mt-4 space-y-3">
            {mitraAds.map((item: any) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 px-4 py-3">
                <div className="text-sm font-semibold text-slate-900">{item.title || item.name || item.id}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
