import type { BatchLogEntryInput, UpdateBatchInput } from '@brewlog/shared';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { batchesApi } from '@/features/batches/api';
import { BatchEditForm } from '@/features/batches/BatchEditForm';
import {
  useBatch,
  useCreateLogEntry,
  useDeleteBatch,
  useDeleteLogEntry,
  useDeleteLogPhoto,
  useUpdateBatch,
  useUpdateLogEntry,
  useUploadLogPhoto,
} from '@/features/batches/hooks';
import { LogEntryForm } from '@/features/batches/LogEntryForm';
import { STATUS_LABELS } from '@/features/batches/status';
import { ApiError } from '@/lib/api-client';

export function BatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const batchId = Number(id);
  const navigate = useNavigate();

  const { data, isLoading } = useBatch(batchId);
  const updateBatch = useUpdateBatch(batchId);
  const deleteBatch = useDeleteBatch();
  const createLogEntry = useCreateLogEntry(batchId);
  const updateLogEntry = useUpdateLogEntry(batchId);
  const deleteLogEntry = useDeleteLogEntry(batchId);
  const uploadLogPhoto = useUploadLogPhoto(batchId);
  const deleteLogPhoto = useDeleteLogPhoto(batchId);

  const [isEditingBatch, setIsEditingBatch] = useState(false);
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<number | null>(null);

  if (isLoading) {
    return <Skeleton className="h-96 max-w-3xl rounded-lg" />;
  }
  if (!data) {
    return <p className="text-muted-foreground">Batch not found.</p>;
  }

  const { batch, ingredients, steps, logEntries } = data;

  const handleUpdateBatch = async (values: UpdateBatchInput) => {
    try {
      await updateBatch.mutateAsync(values);
      toast.success('Batch updated');
      setIsEditingBatch(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to update batch');
    }
  };

  const handleDeleteBatch = async () => {
    try {
      await deleteBatch.mutateAsync(batchId);
      toast.success('Batch deleted');
      navigate('/');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to delete batch');
    }
  };

  const handleCreateEntry = async (values: BatchLogEntryInput) => {
    try {
      await createLogEntry.mutateAsync(values);
      toast.success('Log entry added');
      setIsAddingEntry(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to add log entry');
    }
  };

  const handleUpdateEntry = async (entryId: number, values: BatchLogEntryInput) => {
    try {
      await updateLogEntry.mutateAsync({ entryId, input: values });
      toast.success('Log entry updated');
      setEditingEntryId(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to update log entry');
    }
  };

  const handleDeleteEntry = async (entryId: number) => {
    try {
      await deleteLogEntry.mutateAsync(entryId);
      toast.success('Log entry deleted');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to delete log entry');
    }
  };

  const handlePhotoUpload = async (entryId: number, file: File | null) => {
    if (!file) return;
    try {
      await uploadLogPhoto.mutateAsync({ entryId, file });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to upload photo');
    }
  };

  const handlePhotoDelete = async (entryId: number, photoId: number) => {
    try {
      await deleteLogPhoto.mutateAsync({ entryId, photoId });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to remove photo');
    }
  };

  return (
    <div className="max-w-3xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold">{batch.name}</h1>
            <Badge variant="outline">{batch.batchNumber}</Badge>
            <Badge variant="secondary" className="capitalize">
              {batch.type}
            </Badge>
            <Badge>{STATUS_LABELS[batch.status]}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Started {batch.startDate}
            {batch.endDate ? ` · Ended ${batch.endDate}` : ''} · Owner:{' '}
            {batch.owner?.displayName ?? batch.owner?.username}
          </p>
          {batch.recipeNameSnapshot && (
            <p className="text-sm text-muted-foreground">
              From recipe:{' '}
              {batch.recipeId ? (
                <Link to={`/recipes/${batch.recipeId}`} className="underline">
                  {batch.recipeNameSnapshot}
                </Link>
              ) : (
                batch.recipeNameSnapshot
              )}
            </p>
          )}
          {(batch.finalYieldAmount != null || batch.finalAbv != null) && (
            <p className="text-sm text-muted-foreground">
              {batch.finalYieldAmount != null && `Final yield: ${batch.finalYieldAmount} ${batch.finalYieldUnit ?? ''}`}
              {batch.finalYieldAmount != null && batch.finalAbv != null ? ' · ' : ''}
              {batch.finalAbv != null && `Final ABV: ${batch.finalAbv}%`}
            </p>
          )}
          {batch.notes && <p className="mt-2 whitespace-pre-wrap text-sm">{batch.notes}</p>}
        </div>

        {!isEditingBatch && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditingBatch(true)}>
              <Pencil className="size-4" />
              Edit
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline">
                  <Trash2 className="size-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this batch?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This permanently deletes "{batch.name}", its ingredients/steps, and all log entries and
                    photos. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteBatch}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      {isEditingBatch ? (
        <BatchEditForm
          defaultValues={{
            name: batch.name,
            type: batch.type,
            status: batch.status,
            startDate: batch.startDate,
            endDate: batch.endDate ?? undefined,
            finalYieldAmount: batch.finalYieldAmount ?? undefined,
            finalYieldUnit: batch.finalYieldUnit ?? undefined,
            finalAbv: batch.finalAbv ?? undefined,
            notes: batch.notes ?? undefined,
            ingredients: ingredients.map((ing) => ({
              id: ing.id,
              category: ing.category,
              name: ing.name,
              amount: ing.amount ?? undefined,
              unit: ing.unit ?? undefined,
              notes: ing.notes ?? undefined,
            })),
            steps: steps.map((step) => ({ id: step.id, text: step.text, isDone: step.isDone })),
          }}
          onSubmit={handleUpdateBatch}
          onCancel={() => setIsEditingBatch(false)}
          isSubmitting={updateBatch.isPending}
        />
      ) : (
        <>
          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Ingredients</h2>
            {ingredients.length === 0 ? (
              <p className="text-sm text-muted-foreground">No ingredients listed.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ingredients.map((ing) => (
                    <TableRow key={ing.id}>
                      <TableCell className="capitalize">{ing.category}</TableCell>
                      <TableCell>{ing.name}</TableCell>
                      <TableCell>
                        {ing.amount ?? ''} {ing.unit ?? ''}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{ing.notes}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Steps</h2>
            {steps.length === 0 ? (
              <p className="text-sm text-muted-foreground">No steps listed.</p>
            ) : (
              <ul className="space-y-2">
                {steps.map((step) => (
                  <li key={step.id} className="flex items-center gap-2">
                    <Checkbox checked={step.isDone} disabled />
                    <span className={step.isDone ? 'text-muted-foreground line-through' : ''}>{step.text}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Log entries</h2>
          {!isAddingEntry && (
            <Button size="sm" onClick={() => setIsAddingEntry(true)}>
              <Plus className="size-4" />
              Add log entry
            </Button>
          )}
        </div>

        {isAddingEntry && (
          <LogEntryForm
            batchType={batch.type}
            onSubmit={handleCreateEntry}
            onCancel={() => setIsAddingEntry(false)}
            isSubmitting={createLogEntry.isPending}
            submitLabel="Add entry"
          />
        )}

        {logEntries.length === 0 && !isAddingEntry && (
          <p className="text-sm text-muted-foreground">No log entries yet.</p>
        )}

        <div className="space-y-3">
          {logEntries.map((entry) =>
            editingEntryId === entry.id ? (
              <LogEntryForm
                key={entry.id}
                batchType={batch.type}
                defaultValues={{
                  entryDate: entry.entryDate,
                  actionId: entry.actionId ?? undefined,
                  og: entry.og ?? undefined,
                  fg: entry.fg ?? undefined,
                  brix: entry.brix ?? undefined,
                  sg: entry.sg ?? undefined,
                  ph: entry.ph ?? undefined,
                  temperature: entry.temperature ?? undefined,
                  temperatureUnit: entry.temperatureUnit ?? undefined,
                  notes: entry.notes ?? undefined,
                }}
                onSubmit={(values) => handleUpdateEntry(entry.id, values)}
                onCancel={() => setEditingEntryId(null)}
                isSubmitting={updateLogEntry.isPending}
                submitLabel="Save"
              />
            ) : (
              <div key={entry.id} className="space-y-2 rounded-md border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{entry.entryDate}</span>
                    {entry.actionName && <Badge variant="secondary">{entry.actionName}</Badge>}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingEntryId(entry.id)}
                      aria-label="Edit entry"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteEntry(entry.id)}
                      aria-label="Delete entry"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  {entry.og != null && <span>OG: {entry.og}</span>}
                  {entry.fg != null && <span>FG: {entry.fg}</span>}
                  {entry.brix != null && <span>Brix: {entry.brix}</span>}
                  {entry.sg != null && <span>SG: {entry.sg}</span>}
                  {entry.ph != null && <span>pH: {entry.ph}</span>}
                  {entry.temperature != null && (
                    <span>
                      Temp: {entry.temperature}
                      {entry.temperatureUnit ?? ''}
                    </span>
                  )}
                </div>

                {entry.notes && <p className="whitespace-pre-wrap text-sm">{entry.notes}</p>}

                <div className="flex flex-wrap gap-2">
                  {entry.photos.map((photo) => (
                    <div key={photo.id} className="relative">
                      <img
                        src={batchesApi.logPhotoUrl(batchId, entry.id, photo.id)}
                        alt=""
                        className="size-20 rounded object-cover"
                      />
                      <button
                        type="button"
                        className="absolute -right-1 -top-1 rounded-full border bg-background p-0.5"
                        onClick={() => handlePhotoDelete(entry.id, photo.id)}
                        aria-label="Remove photo"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  ))}
                  <label className="flex size-20 cursor-pointer items-center justify-center rounded border border-dashed text-xs text-muted-foreground hover:bg-accent/50">
                    + Photo
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => handlePhotoUpload(entry.id, e.target.files?.[0] ?? null)}
                    />
                  </label>
                </div>
              </div>
            ),
          )}
        </div>
      </section>
    </div>
  );
}
