import { ArrowDownToLine } from "lucide-react";
import PageHeader from "../components/PageHeader";
import CommonButton from "../../../components/common/widgets/CommonButton";
import DataTable, { type DataTableColumn } from "../../../components/common/widgets/DataTable";
import type { Status } from "../../../components/common/widgets/StatusBox";
import StatusBox from "../../../components/common/widgets/StatusBox";
import DashboardPage from "../components/DashboardPage";
import DashboardPanel from "../components/DashboardPanel";


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
    <DashboardPage>

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


        <DashboardPanel
          className="mt-6"
          title="Your appointments"
          description="Your computer repair appointments only."
          headerAction={<span className="rounded bg-[#e7f6ef] px-2 py-1 text-[10px] font-bold text-[#159a63]" />}
        >
          <DataTable
            columns={yourComputersColumns}
            data={ yourComputers }
            emptyMessage="No appointments scheduled for this day."
          />
        </DashboardPanel>

    </DashboardPage>
  )
}
