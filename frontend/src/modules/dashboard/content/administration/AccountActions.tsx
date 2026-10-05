import { Archive } from "lucide-react";
import type { Account } from "./types";

export default function AccountActions({
  account,
  onSuspend,
}: {
  account: Account;
  onSuspend: (account: Account) => void;
}) {
  return (
    <div className="flex items-center gap-5 whitespace-nowrap">
      <button type="button" onClick={() => onSuspend(account)} className="text-[10px] font-semibold text-[#2870e8] hover:underline">
        Suspend
      </button>
      <button type="button" className="text-[10px] font-semibold text-[#2870e8] hover:underline">
        Reset password
      </button>
      <button type="button" className="flex items-center gap-1.5 text-[10px] font-semibold text-[#2870e8] hover:underline">
        <Archive size={13} />
        Archive
      </button>
    </div>
  );
}
