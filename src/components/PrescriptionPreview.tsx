"use client";

/**
 * Live preview of the prescription letterhead — mirrors pdf_generator.py header layout.
 */
interface PrescriptionPreviewProps {
  clinicName: string;
  doctorName: string;
  qualifications: string;
  mciNumber: string;
  stateCouncilReg: string;
  clinicAddress: string;
  clinicAddressLine2?: string;
  clinicCity: string;
  clinicState: string;
  clinicPin?: string;
  clinicPhone: string;
  logoUrl?: string | null;
  signatureUrl?: string | null;
}

export function PrescriptionPreview({
  clinicName,
  doctorName,
  qualifications,
  mciNumber,
  stateCouncilReg,
  clinicAddress,
  clinicAddressLine2 = "",
  clinicCity,
  clinicState,
  clinicPin = "",
  clinicPhone,
  logoUrl,
  signatureUrl,
}: PrescriptionPreviewProps) {
  const addr = [clinicAddress, clinicAddressLine2, clinicCity, clinicState, clinicPin]
    .filter(Boolean)
    .join(", ");
  const regParts = [`MCI Reg: ${mciNumber || "—"}`];
  if (stateCouncilReg) regParts.push(`State Council: ${stateCouncilReg}`);
  if (clinicPhone) regParts.push(`Ph: ${clinicPhone}`);

  return (
    <div className="bg-white border border-ink/20 rounded-lg p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt="Clinic logo"
              className="h-10 w-auto mb-2 object-contain"
            />
          )}
          <p className="text-lg font-bold text-[#0e0f0c] leading-tight truncate">
            {clinicName || "Your Clinic Name"}
          </p>
          <p className="text-sm font-bold text-[#0e0f0c] mt-1">
            {doctorName || "Dr. Your Name"}
            {qualifications ? `, ${qualifications}` : ""}
          </p>
          <p className="text-[10px] text-[#454745] mt-1 leading-snug">
            {regParts.join("  ·  ")}
          </p>
          <p className="text-[10px] text-[#454745] mt-0.5 leading-snug">
            {addr || "Clinic address will appear here"}
          </p>
        </div>
        <div className="text-[#054d28] text-3xl font-bold leading-none shrink-0">
          ℞
        </div>
      </div>
      <div className="border-t-2 border-[#0e0f0c] mt-3 pt-3">
        <div className="grid grid-cols-2 gap-2 text-[9px]">
          <div>
            <p className="font-bold text-[#868685] uppercase tracking-wide">Patient</p>
            <p className="font-bold text-[#0e0f0c]">Sample Patient</p>
          </div>
          <div>
            <p className="font-bold text-[#868685] uppercase tracking-wide">Age / Sex</p>
            <p className="font-bold text-[#0e0f0c]">45Y / M</p>
          </div>
        </div>
        <div className="mt-3 bg-[#f5faf2] rounded px-2 py-1.5">
          <p className="text-[8px] font-bold text-[#868685] uppercase">Diagnosis</p>
          <p className="text-xs font-bold text-[#0e0f0c]">Type 2 Diabetes Mellitus</p>
        </div>
        <div className="mt-3 space-y-2">
          <p className="text-[8px] font-bold text-[#868685] uppercase">Medications</p>
          <div className="flex gap-2">
            <span className="text-[8px] font-bold text-[#868685]">1.</span>
            <div>
              <p className="text-xs font-bold text-[#0e0f0c] uppercase">METFORMIN 500MG</p>
              <p className="text-[9px] text-[#454745]">BD · 30 days · After food</p>
            </div>
          </div>
        </div>
        {signatureUrl && (
          <div className="mt-4 flex justify-end">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={signatureUrl}
              alt="Signature"
              className="h-8 w-auto object-contain opacity-80"
            />
          </div>
        )}
      </div>
      <p className="text-[10px] text-body mt-4 text-center italic">
        This is how your prescription will look to patients.
      </p>
    </div>
  );
}
