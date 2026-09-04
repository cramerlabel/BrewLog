import type { BatchStatus, BrewType } from '@brewlog/shared';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ErrorState';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { STATUS_LABELS, STATUS_OPTIONS } from '@/features/batches/status';
import { useBatches } from '@/features/batches/hooks';
import { ApiError } from '@/lib/api-client';

const PAGE_SIZE = 20;

export function SummaryPage() {
  const [status, setStatus] = useState<BatchStatus | 'open' | 'all'>('open');
  const [type, setType] = useState<'all' | BrewType>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error, refetch } = useBatches({
    status,
    type: type === 'all' ? undefined : type,
    search: search || undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Summary</h1>
        <Button asChild>
          <Link to="/batches/new">New batch</Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search by name…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-xs"
        />
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v as typeof status);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Open batches</SelectItem>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={type}
          onValueChange={(v) => {
            setType(v as typeof type);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="beer">Beer</SelectItem>
            <SelectItem value="wine">Wine</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      )}

      {isError && (
        <ErrorState
          message={error instanceof ApiError ? error.message : 'Failed to load batches.'}
          onRetry={() => void refetch()}
        />
      )}

      {!isLoading && !isError && data?.batches.length === 0 && (
        <p className="text-muted-foreground">No batches found.</p>
      )}

      {!isLoading && !isError && data && data.batches.length > 0 && (
        <div className="space-y-2">
          {data.batches.map((batch) => (
            <Link
              key={batch.id}
              to={`/batches/${batch.id}`}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{batch.type === 'beer' ? '🍺' : '🍷'}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{batch.name}</span>
                    <Badge variant="outline">{batch.batchNumber}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Started {batch.startDate}
                    {batch.ownerDisplayName ? ` · ${batch.ownerDisplayName}` : ''}
                  </p>
                </div>
              </div>
              <Badge variant="secondary">{STATUS_LABELS[batch.status]}</Badge>
            </Link>
          ))}
        </div>
      )}

      {data && data.total > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {data.page} of {totalPages} ({data.total} batches)
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

