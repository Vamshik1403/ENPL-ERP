import LayoutContent from "@/components/LayoutContent";
import { SidebarProvider } from "@/components/contexts/SidebarContext";

export default function WithSidebarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <LayoutContent>{children}</LayoutContent>
    </SidebarProvider>
  );
}
