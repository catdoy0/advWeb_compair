import { Archive, Pencil } from "lucide-react";
import type { Account } from "./types";

export default function AccountActions({
  account,
  canEdit,
  canArchive,
  onEdit,
  onSuspend,
  onArchive,
}: {
  account: Account;
  canEdit: boolean;
  canArchive: boolean;
  onEdit: (account: Account) => void;
  onSuspend: (account: Account) => void;
  onArchive: (account: Account) => void;
}) {
  const suspended = account.raw.is_active === false;

  return (
    <div className="flex items-center gap-5 whitespace-nowrap">
      {canEdit && (
        <button
          type="button"
          onClick={() => onEdit(account)}
          className="flex items-center gap-1.5 text-[10px] font-semibold text-[#2870e8] hover:underline cursor-pointer"
        >
          <Pencil size={12} />
          Edit
        </button>
      )}

      <button
        type="button"
        onClick={() => onSuspend(account)}
        className={`text-[10px] font-semibold hover:underline cursor-pointer ${
          suspended ? "text-[#15946a]" : "text-[#2870e8]"
        }`}
      >
        {suspended ? "Unsuspend" : "Suspend"}
      </button>
      {canArchive && (
        <button
          type="button"
          onClick={() => onArchive(account)}
          disabled={!suspended}
          title={suspended ? "Archive account" : "Suspend this account before archiving"}
          className={`flex items-center gap-1.5 text-[10px] font-semibold dark:text-slate-400 ${
            suspended
              ? "text-slate-500 hover:text-amber-600 hover:underline cursor-pointer"
              : "text-slate-300 cursor-not-allowed dark:text-slate-600"
          }`}
        >
          <Archive size={12} />
          Archive
        </button>
      )}
    </div>
  );
}
