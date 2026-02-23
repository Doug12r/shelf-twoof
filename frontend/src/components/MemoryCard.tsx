import type { Memory } from "../types";
import * as api from "../api";

interface Props {
  memory: Memory;
  onClick: () => void;
}

export default function MemoryCard({ memory, onClick }: Props) {
  const hasPhotos = memory.photos.length > 0;

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl bg-stone-900/80 border border-stone-800/60 hover:border-stone-700/60 transition-all overflow-hidden group"
    >
      {/* Photo preview */}
      {hasPhotos && (
        <div className="relative h-48 overflow-hidden">
          <img
            src={api.photoUrl(memory.photos[0].id)}
            alt=""
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
            loading="lazy"
          />
          {memory.photos.length > 1 && (
            <span className="absolute bottom-2 right-2 text-xs bg-black/60 text-white px-2 py-0.5 rounded-full">
              +{memory.photos.length - 1}
            </span>
          )}
          {memory.pinned && (
            <span className="absolute top-2 left-2 text-xs bg-rose-600/90 text-white px-2 py-0.5 rounded-full">
              Pinned
            </span>
          )}
        </div>
      )}

      <div className="p-4">
        {!hasPhotos && memory.pinned && (
          <span className="text-xs bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full mb-2 inline-block">
            Pinned
          </span>
        )}

        <div className="flex items-start gap-2">
          {memory.mood && <span className="text-lg shrink-0">{memory.mood}</span>}
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-stone-100 truncate">
              {memory.title}
            </h3>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-xs text-stone-500">{memory.memory_date}</span>
              {memory.location && (
                <>
                  <span className="text-xs text-stone-700">&middot;</span>
                  <span className="text-xs text-stone-500 truncate">{memory.location}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {memory.content && (
          <p className="text-sm text-stone-400 mt-2 line-clamp-2 leading-relaxed">
            {memory.content}
          </p>
        )}

        {memory.tags.length > 0 && (
          <div className="flex gap-1.5 mt-3 flex-wrap">
            {memory.tags.map((t) => (
              <span
                key={t}
                className="text-xs px-2 py-0.5 rounded-full bg-stone-800 text-stone-400"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}
