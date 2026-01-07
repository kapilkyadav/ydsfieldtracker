import { BottomNav } from "./bottom-nav";
import { TopBar } from "./top-bar";
import { GPSBanner } from "./gps-banner";

interface AppLayoutProps {
  children: React.ReactNode;
  title: string;
  isOnDuty?: boolean;
  showGPSBanner?: boolean;
}

export function AppLayout({ 
  children, 
  title, 
  isOnDuty = false,
  showGPSBanner = false 
}: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopBar title={title} />
      {showGPSBanner && <GPSBanner isOnDuty={isOnDuty} />}
      <main className="flex-1 overflow-auto pb-20">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
