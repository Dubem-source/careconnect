// This layout intentionally has NO sidebar wrapper.
// Pages inside admin/(auth)/ render standalone (e.g. /admin/login).
export default function AdminAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
