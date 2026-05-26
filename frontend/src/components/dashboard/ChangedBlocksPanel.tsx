interface ChangedBlocksPanelProps {
  blocks: number[];
}

export function ChangedBlocksPanel({ blocks }: ChangedBlocksPanelProps) {
  if (blocks.length === 0) {
    return <p className="text-sm text-slate-600">No changed blocks detected.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {blocks.map((block) => (
        <span key={block} className="rounded-md border border-orange-200 bg-orange-50 px-2.5 py-1 font-mono text-xs font-bold text-orange-800">
          Block {block}
        </span>
      ))}
    </div>
  );
}
