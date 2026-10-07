import { KeyRound, Save, ShieldCheck, ShieldOff } from "lucide-react";

import Modal from "../../../../components/common/modals/Modal";
import CommonButton from "../../../../components/common/widgets/CommonButton";
import type { GetUser } from "../../../../types/administration";
import MessageModal from "../../../../components/common/modals/MessageModal";
import { useEnterKey } from "../../../../hooks/useModalKeys";
import { useEditAccountForm } from "../../../../hooks/administration";

const inputClass =
  "h-10 w-full rounded-md border border-[#cfd9e8] bg-white px-3 text-[12px] text-[#102c50] outline-none placeholder:text-slate-400 focus:border-[#2870e8] dark:border-slate-600 dark:bg-[#182536] dark:text-white";

const labelClass =
  "text-xs font-bold uppercase tracking-wider text-slate-400";

const ROLE_OPTIONS = [
  { value: "CUSTOMER", label: "Customer" },
  { value: "TECHNICIAN", label: "Technician" },
  { value: "STAFF", label: "Staff" },
  { value: "ADMIN", label: "Administrator" },
  { value: "SUPER_ADMIN", label: "Super admin" },
] as const;

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface EditAccountModalProps {
  open: boolean;
  onClose: () => void;
  user: GetUser | null;
  onUpdated: () => void;
}

export default function EditAccountModal(props: EditAccountModalProps) {
  if (!props.user) return null;
  return <EditAccountForm {...props} user={props.user} />;
}

function EditAccountForm({
  open,
  onClose,
  user,
  onUpdated,
}: EditAccountModalProps & { user: GetUser }) {
  const form = useEditAccountForm(user, onUpdated);

  const fullName =
    [form.firstName, form.lastName].filter(Boolean).join(" ") || form.email;

  useEnterKey({
    open,
    onEnter: form.handleSave,
    enabled: form.dirty,
  });

  return (
    <Modal open={open} onClose={onClose} large>
      <MessageModal
        open={form.messageModalOpen}
        onClose={() => form.setMessageModalOpen(false)}
        title={form.messageModalMessage}
      />

      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2870e8]">
        Account / edit
      </p>

      <div className="flex flex-col mt-2">
        <div className="flex gap-3 items-center">
          <h2 className="text-lg font-bold text-[#102c50] dark:text-white">
            {fullName}
          </h2>

          <span
            className={`rounded px-2 py-0.5 text-[10px] font-bold ${
              form.isActive
                ? "bg-[#e6f5ef] text-[#15946a]"
                : "bg-[#fdecec] text-[#c0392b]"
            }`}
          >
            {form.isActive ? "Active" : "Suspended"}
          </span>
        </div>

        <p className="mt-0.5 text-[11px] text-slate-400">
          USR-{String(user.id).padStart(3, "0")}
        </p>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-4 border-t border-[#e6ebf2] pt-5 dark:border-slate-700">
        <div>
          <label className={labelClass}>First name</label>
          <input
            value={form.firstName}
            onChange={(e) => form.setFirstName(e.target.value)}
            className={`${inputClass} mt-1.5`}
          />
        </div>

        <div>
          <label className={labelClass}>Last name</label>
          <input
            value={form.lastName}
            onChange={(e) => form.setLastName(e.target.value)}
            className={`${inputClass} mt-1.5`}
          />
        </div>

        <div>
          <label className={labelClass}>Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => form.setEmail(e.target.value)}
            className={`${inputClass} mt-1.5`}
          />
        </div>

        <div>
          <label className={labelClass}>Role</label>
          <select
            value={form.role}
            onChange={(e) => form.setRole(e.target.value)}
            className={`${inputClass} mt-1.5`}
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex mt-5 justify-center w-full">
        <div className="text-center">
          <label className={labelClass}>Last sign in</label>
          <p className="text-sm font-semibold text-[#102c50] dark:text-white">
            {formatDateTime(user.last_sign_in)}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-[#e6ebf2] pt-4 dark:border-slate-700">
        <CommonButton
          variant="outline"
          className="flex items-center gap-2 border-[#d4ddea] px-4 py-2"
          onClick={form.handleResetPassword}
        >
          <KeyRound size={13} />
          Reset password
        </CommonButton>

        {form.isActive ? (
          <CommonButton
            onClick={form.handleToggleActive}
            className="flex items-center gap-2 bg-[#c0392b] px-4 py-2 hover:bg-[#a83226]"
          >
            <ShieldOff size={13} />
            Suspend
          </CommonButton>
        ) : (
          <CommonButton
            onClick={form.handleToggleActive}
            className="flex items-center gap-2 bg-[#15946a] px-4 py-2 hover:bg-[#0f7a55]"
          >
            <ShieldCheck size={13} />
            Unsuspend
          </CommonButton>
        )}

        <CommonButton
          onClick={form.handleSave}
          disabled={!form.dirty}
          className="flex items-center gap-2 px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save size={13} />
          Save changes
        </CommonButton>
      </div>
    </Modal>
  );
}
