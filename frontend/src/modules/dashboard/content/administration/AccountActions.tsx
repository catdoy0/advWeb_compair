import { Pencil } from "lucide-react";
import type { Account } from "./types";

export default function AccountActions({
  account,
  onEdit,
  onSuspend,
}: {
  account: Account;
  onEdit: (account: Account) => void;
  onSuspend: (account: Account) => void;
}) {
  const suspended = account.raw.is_active === false;

  return (
    <div className="flex items-center gap-5 whitespace-nowrap">
      <button
        type="button"
        onClick={() => onEdit(account)}
        className="flex items-center gap-1.5 text-[10px] font-semibold text-[#2870e8] hover:underline cursor-pointer"
      >
        <Pencil size={12} />
        Edit
      </button>

      <button
        type="button"
        onClick={() => onSuspend(account)}
        className={`text-[10px] font-semibold hover:underline cursor-pointer ${
          suspended ? "text-[#15946a]" : "text-[#2870e8]"
        }`}
      >
        {suspended ? "Unsuspend" : "Suspend"}
      </button>

      {/* <button */}
      {/*   type="button" */}
      {/*   className="flex items-center gap-1.5 text-[10px] font-semibold text-[#2870e8] hover:underline cursor-pointer" */}
      {/* > */}
      {/*   <Archive size={13} /> */}
      {/*   Archive */}
      {/* </button> */}
    </div>
  );
}
