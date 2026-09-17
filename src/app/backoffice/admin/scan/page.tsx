import QrAttendanceScanner from "@/components/scanner/QrAttendanceScanner";

export default function AdminScanPage() {
  return <QrAttendanceScanner expectedRole="admin" pageTitle="Universal QR Scanner (Panitia & Admin)" />;
}
