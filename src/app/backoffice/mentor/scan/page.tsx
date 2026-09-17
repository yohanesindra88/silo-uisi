import QrAttendanceScanner from "@/components/scanner/QrAttendanceScanner";

export default function MentorScanPage() {
  return <QrAttendanceScanner expectedRole="mentor" pageTitle="Scanner QR Presensi Mentor" />;
}
