'use client';

import { useId, useState } from 'react';
import Image from 'next/image';
import { ChevronDown, ChevronUp, GripVertical, Star, Upload, X } from 'lucide-react';

export interface PhotoUploadItem {
  id?: string;
  image_url: string;
  localId: string;
  previewUrl?: string;
  progress: number;
  status: 'uploading' | 'saved' | 'error';
  error?: string;
}

interface PhotoUploadGridProps<T extends PhotoUploadItem> {
  photos: T[];
  removeDisabled?: boolean;
  retryDisabled?: boolean;
  addDisabled?: boolean;
  onRemove: (photo: T) => void;
  onReorder: (photos: T[]) => void;
  onRetry: (photo: T) => void;
  onFilesSelected: (files: File[]) => void;
}

export function PhotoUploadGrid<T extends PhotoUploadItem>({
  photos,
  removeDisabled = false,
  retryDisabled = false,
  addDisabled = false,
  onRemove,
  onReorder,
  onRetry,
  onFilesSelected,
}: PhotoUploadGridProps<T>) {
  const inputId = useId();
  const [confirmingPhotoId, setConfirmingPhotoId] = useState<string | null>(null);
  const [draggedPhotoId, setDraggedPhotoId] = useState<string | null>(null);
  const atLimit = photos.length >= 10;

  const movePhoto = (photo: T, offset: -1 | 1) => {
    const from = photos.findIndex((item) => item.localId === photo.localId);
    const to = from + offset;
    if (from < 0 || to < 0 || to >= photos.length) return;
    const reordered = [...photos];
    [reordered[from], reordered[to]] = [reordered[to], reordered[from]];
    onReorder(reordered);
  };

  const reorderPhotos = (sourceId: string, targetId: string) => {
    const from = photos.findIndex((item) => item.localId === sourceId);
    const to = photos.findIndex((item) => item.localId === targetId);
    if (from < 0 || to < 0 || from === to) return;
    const reordered = [...photos];
    const [photo] = reordered.splice(from, 1);
    reordered.splice(to, 0, photo);
    onReorder(reordered);
  };

  const removePhoto = (photo: T) => {
    if (photo.id) {
      setConfirmingPhotoId(photo.localId);
      return;
    }
    onRemove(photo);
  };

  return (
    <section>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-slate-800 dark:text-neutral-200">Photos</span>
        <span className="text-xs text-slate-500 dark:text-neutral-400">
          {photos.length} / 10 - JPG, PNG or WebP
        </span>
      </div>
      {photos.length > 1 && (
        <p className="mt-1 text-[11px] text-slate-500 dark:text-neutral-400">
          Drag photos or use the arrows to reorder. The first photo is the cover.
        </p>
      )}

      {photos.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:[grid-template-columns:repeat(auto-fill,minmax(150px,1fr))]">
          {photos.map((photo, index) => {
            const isCover = index === 0;
            const source = photo.previewUrl || photo.image_url;

            return (
              <div
                key={photo.localId}
                draggable
                onDragStart={(event) => {
                  setDraggedPhotoId(photo.localId);
                  event.dataTransfer.effectAllowed = 'move';
                  event.dataTransfer.setData('text/plain', photo.localId);
                }}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  const sourceId = event.dataTransfer.getData('text/plain') || draggedPhotoId;
                  if (sourceId) reorderPhotos(sourceId, photo.localId);
                  setDraggedPhotoId(null);
                }}
                onDragEnd={() => setDraggedPhotoId(null)}
                className={`min-w-0 space-y-1.5 ${draggedPhotoId === photo.localId ? 'opacity-50' : ''}`}
              >
                <div
                  className={`relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-neutral-800 ${
                    isCover
                      ? 'border-2 border-blue-600'
                      : 'border border-slate-200 dark:border-neutral-700'
                  } ${photo.status === 'uploading' ? 'opacity-80' : ''}`}
                >
                  {source && (
                    <Image
                      src={source}
                      alt={`Photo ${index + 1}`}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  )}

                  {isCover && (
                    <span className="absolute left-2 top-2 z-10 inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-[11px] font-medium text-blue-800">
                      <Star className="h-3 w-3 fill-current" aria-hidden="true" />
                      Cover
                    </span>
                  )}

                  <span
                    className="absolute bottom-2 left-2 z-10 inline-flex items-center gap-1 bg-white/90 px-1.5 py-1 text-[10px] font-medium text-slate-600 shadow-sm dark:bg-neutral-900/90 dark:text-neutral-200"
                    title="Drag photo to change its order"
                  >
                    <GripVertical className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="sr-only">Drag to reorder photos</span>
                  </span>

                  <button
                    type="button"
                    aria-label="Remove photo"
                    title="Remove photo"
                    disabled={removeDisabled}
                    onClick={() => removePhoto(photo)}
                    className="absolute right-2 top-2 z-20 flex h-[26px] w-[26px] items-center justify-center rounded-full bg-white text-slate-600 shadow-sm transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:opacity-50"
                  >
                    <X className="h-[14px] w-[14px]" aria-hidden="true" />
                  </button>

                  {confirmingPhotoId === photo.localId && (
                    <div
                      role="alertdialog"
                      aria-label="Confirm photo removal"
                      className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 bg-white/95 p-2 text-center dark:bg-neutral-900/95"
                    >
                      <span className="text-xs font-medium text-slate-800 dark:text-neutral-100">
                        Remove this photo?
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setConfirmingPhotoId(null)}
                          className="rounded-full border border-slate-300 px-2.5 py-1 text-[11px] font-medium text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:border-neutral-600 dark:text-neutral-200"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmingPhotoId(null);
                            onRemove(photo);
                          }}
                          className="rounded-full bg-red-600 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {photo.status === 'uploading' && (
                  <span className="block text-[11px] text-slate-500 dark:text-neutral-400">
                    Uploading... {photo.progress}%
                  </span>
                )}
                {photo.status === 'saved' && (
                  <span className="block text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                    Saved
                  </span>
                )}
                {photo.status === 'error' && (
                  <div className="space-y-1">
                    <span className="block text-[11px] text-red-600 dark:text-red-400" role="alert">
                      {photo.error || 'Upload failed'}
                    </span>
                    <button
                      type="button"
                      disabled={retryDisabled}
                      onClick={() => onRetry(photo)}
                      className="w-full rounded-full border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
                    >
                      Retry
                    </button>
                  </div>
                )}

                {photos.length > 1 && (
                  <div className="flex gap-1">
                    <button
                      type="button"
                      aria-label={`Move photo ${index + 1} earlier`}
                      title={isCover ? 'Already the cover photo' : 'Move photo earlier'}
                      disabled={index === 0}
                      onClick={() => movePhoto(photo, -1)}
                      className="flex flex-1 items-center justify-center gap-1 rounded-full border border-slate-300 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:opacity-40 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
                    >
                      <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                      Earlier
                    </button>
                    <button
                      type="button"
                      aria-label={`Move photo ${index + 1} later`}
                      disabled={index === photos.length - 1}
                      onClick={() => movePhoto(photo, 1)}
                      className="flex flex-1 items-center justify-center gap-1 rounded-full border border-slate-300 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:opacity-40 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
                    >
                      <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                      Later
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-3">
        <input
          id={inputId}
          type="file"
          accept="image/jpeg, image/png, image/webp"
          multiple
          disabled={addDisabled || atLimit}
          onChange={(event) => {
            onFilesSelected(Array.from(event.currentTarget.files || []));
            event.currentTarget.value = '';
          }}
          className="peer sr-only"
        />
        <label
          htmlFor={inputId}
          className={`flex w-full items-center justify-center gap-2 rounded-full border border-slate-300 px-4 py-2.5 text-xs font-medium text-slate-700 transition-colors focus-within:ring-2 focus-within:ring-blue-600 dark:border-neutral-700 dark:text-neutral-200 ${
            addDisabled || atLimit
              ? 'cursor-not-allowed bg-slate-100 opacity-60 dark:bg-neutral-900'
              : 'cursor-pointer bg-white hover:bg-slate-50 dark:bg-neutral-950 dark:hover:bg-neutral-900'
          }`}
        >
          <Upload className="h-4 w-4" aria-hidden="true" />
          {atLimit ? 'Maximum of 10 photos' : photos.length ? 'Add more photos' : 'Add photos'}
        </label>
      </div>
    </section>
  );
}
