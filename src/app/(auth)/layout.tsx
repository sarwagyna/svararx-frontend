import { BrandLogo } from "@/components/BrandLogo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas-soft flex flex-col items-center justify-center px-4 py-12">
      <div className="mb-8">
        <BrandLogo variant="auth" href="/" />
      </div>
      {children}
    </div>
  );
}
