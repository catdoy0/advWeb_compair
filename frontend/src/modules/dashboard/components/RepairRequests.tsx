export default function RepairRequests() {
  return (
    <section
      className="
        overflow-hidden
        rounded-lg
        border
        border-[#dce4ee]
        bg-white
        dark:border-slate-800
        dark:bg-slate-900
      "
    >
      <div className="border-b border-[#e5ebf3] px-4 py-3 dark:border-slate-800">
        <h2 className="text-sm font-bold text-[#17385f] dark:text-white">
          Your repair requests
        </h2>

        <p className="mt-1 text-[10px] text-slate-400">
          Follow the work without calling the shop.
        </p>
      </div>

      <div className="p-4">
        <div className="rounded-lg bg-[#f6f8fb] p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-lg font-bold text-[#17385f] dark:text-white">
                CP-1042
              </p>

              <p className="mt-1 text-[10px] text-slate-400">
                MacBook Pro 14"
              </p>
            </div>

            <span className="rounded bg-orange-50 px-2 py-1 text-[9px] font-semibold text-orange-600">
              Diagnosing
            </span>
          </div>

          <p className="mt-3 text-[12px] text-slate-600 dark:text-slate-300">
            Battery health check
          </p>

          <p className="mt-2 text-[9px] text-slate-400">
            Updated 12 min ago · Today, 2:30 PM
          </p>
        </div>
      </div>
    </section>
  );
}
