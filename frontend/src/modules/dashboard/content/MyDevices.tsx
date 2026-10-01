import { ArrowDownToLine } from "lucide-react";
import PageHeader from "../components/PageHeader";
import CommonButton from "../../../components/common/widgets/CommonButton";
import DataTable, { type DataTableColumn } from "../../../components/common/widgets/DataTable";
import type { Status } from "../../../components/common/widgets/StatusBox";
import StatusBox from "../../../components/common/widgets/StatusBox";


interface ComputerRecord {
  id: string;
  computer: string;
  owner: string;
  type: string
  currentRequest: string;
  status: Status;
}


// temp data
// TODO: replace with real data from backend
const yourComputers: ComputerRecord[] = [
  {
    id: "CMP-1001",
    computer: 'MacBook Pro 14"',
    owner: "Mika Santos",
    type: "Laptop",
    currentRequest: "CP-1042",
    status: "Diagnosing",
  },
];

const yourComputersColumns: DataTableColumn<ComputerRecord>[] = [
  {
    key: "computer",
    label: "Computer",
  },
  {
    key: "owner",
    label: "Owner",
  },
  {
    key: "type",
    label: "Type",
  },
  {
    key: "currentRequest",
    label: "Current Request",
  },
  {
    key: "status",
    label: "Status",
    render: (computer) => (
      <StatusBox status={computer.status} />
    ),
  },
];

export default function MyDevices() {
  return (
    <main className="flex-1 dark:bg-[#0f1724]">
      <div className="mx-auto max-w-[1240px] p-5 lg:p-7">

        <PageHeader
          eyebrow="Directory / Devices"
          title="Computer Records"
          description="Keep every computer tied to a service request or customer record."
          action={
            <CommonButton variant="outline"
              className="flex items-center gap-2 self-start border-[#d4ddea] px-4 py-2 xl:self-auto"
            >
              <ArrowDownToLine size={15} />
              Export records
            </CommonButton>
          }
        />


        <section className="mt-6 overflow-hidden rounded-lg border border-[#d8e0eb] bg-white dark:border-slate-700 dark:bg-[#111c2b]">
          <div className="flex items-center justify-between border-b border-[#d8e0eb] px-5 py-4 dark:border-slate-700">
            <div>
              <h2 className="text-[14px] font-bold text-[#102c50] dark:text-white">
                Your appointments
              </h2>

              <p className="mt-1 text-[11px] text-slate-400">
                Your computer repair appointments only.
              </p>
            </div>

            <span className="rounded bg-[#e7f6ef] px-2 py-1 text-[10px] font-bold text-[#159a63]">
            </span>
          </div>

          <DataTable
            columns={yourComputersColumns}
            data={ yourComputers }
            emptyMessage="No appointments scheduled for this day."
          />
        </section>

      </div>
    </main>
  )
}
