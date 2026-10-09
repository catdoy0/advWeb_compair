import { ArrowRight } from "lucide-react";
import CommonButton from "../../../components/common/widgets/CommonButton";
import { useNavigate } from "react-router";

export default function MessageShop() {
  const navigate = useNavigate();
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
          Message the shop
        </h2>

        <p className="mt-1 text-[10px] text-slate-400">
          Ask about your device or share a concern.
        </p>
      </div>

      <div className="p-4">
        <div className="flex items-start gap-3">
          <div
            className="
              flex
              h-8
              w-8
              shrink-0
              items-center
              justify-center
              rounded-full
              bg-blue-100
              text-[9px]
              font-bold
              text-blue-600
            "
          >
            CT
          </div>

          <div>
            <p className="text-[11px] font-semibold text-[#17385f] dark:text-white">
              Can I pick it up today?
            </p>

            <p className="mt-1 text-[9px] text-slate-400">
              10:42 AM
            </p>
          </div>
        </div>

        <CommonButton
          className="
            mt-4
            flex
            w-full
            items-center
            justify-center
            gap-2
          "
            onClick={() => navigate("/dashboard/messages")}
        >
          Open messages
          <ArrowRight size={13} />
        </CommonButton>
      </div>
    </section>
  );
}
