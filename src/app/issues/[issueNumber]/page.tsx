export default async function IssuePage({
  params,
}: {
  params: Promise<{ issueNumber: string }>;
}) {
  const { issueNumber } = await params;

  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <p className="text-neutral-500">
        Issue {issueNumber} — the reader arrives in Phase 2.
      </p>
    </main>
  );
}
