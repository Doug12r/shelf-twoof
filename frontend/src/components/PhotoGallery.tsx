import type { Photo } from "../types";
import * as api from "../api";

interface Props {
  photos: Photo[];
  onDelete?: (id: string) => void;
}

export default function PhotoGallery({ photos, onDelete }: Props) {
  if (photos.length === 0) return null;

  return (
    <div className={`grid gap-2 ${
      photos.length === 1 ? "grid-cols-1" :
      photos.length === 2 ? "grid-cols-2" :
      "grid-cols-2 sm:grid-cols-3"
    }`}>
      {photos.map((p) => (
        <div key={p.id} className="relative group rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-sm">
          <img
            src={api.photoUrl(p.id)}
            alt={p.filename}
            className="w-full h-48 object-cover"
            loading="lazy"
          />
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm("Remove this photo?")) onDelete(p.id);
              }}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity apple-button"
            >
              x
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
