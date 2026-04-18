import { ViewToggle, type View } from "./ViewToggle";

interface Props {
  view: View;
  onViewChange: (view: View) => void;
  count: number;
  selectedPersonName: string | null;
  timelineFocusName: string;
}

function buildTitle(view: View, selectedPersonName: string | null, timelineFocusName: string): string {
  if (view === "timeline") return `${timelineFocusName}'s timeline`;
  if (selectedPersonName) return `Records involving ${selectedPersonName}`;
  return "All records";
}

export function MainHeader({ view, onViewChange, count, selectedPersonName, timelineFocusName }: Props) {
  return (
    <div className="main__header">
      <h2>{buildTitle(view, selectedPersonName, timelineFocusName)}</h2>
      <span className="main__count">{count}</span>
      <ViewToggle view={view} onChange={onViewChange} />
    </div>
  );
}
