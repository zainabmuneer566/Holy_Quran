const OK: Record<string, string> = {
  prefs: "Preferences saved.", goals: "Goals saved.", reminders: "Reminder preferences saved.", profile: "Profile saved.",
  collection: "Collection created.", "collection-deleted": "Collection deleted. Its bookmarks were kept.", moved: "Bookmark moved.",
  removed: "Removed.", cleared: "History cleared.",
};

export function SavedBanner({ tag }: { tag?: string }) {
  if (!tag) return null;
  if (tag === "error") return <p role="alert" className="mb-4 rounded-md border border-danger/40 p-2 text-sm text-danger">Something went wrong. Please check your input and try again.</p>;
  if (tag === "delete-unavailable") return <p role="alert" className="mb-4 rounded-md border border-line p-2 text-sm">Account deletion is not enabled on this server yet. See SETUP.md.</p>;
  return OK[tag] ? <p role="status" className="mb-4 rounded-md border border-line bg-surface p-2 text-sm">{OK[tag]}</p> : null;
}
