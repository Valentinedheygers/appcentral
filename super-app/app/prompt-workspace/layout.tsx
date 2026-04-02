export default function PromptWorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="workspace-theme">
      {children}
    </div>
  );
}
