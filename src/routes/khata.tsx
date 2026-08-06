import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/khata")({
  component: KhataLayout,
});

function KhataLayout() {
  return <Outlet />;
}
