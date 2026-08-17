import GovernanceSidebar from '@/components/governance/GovernanceSidebar';

export default function GovernanceLayout({ children }: { children: React.ReactNode }) {
  return <GovernanceSidebar>{children}</GovernanceSidebar>;
}
