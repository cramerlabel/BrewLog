import { useQuery } from '@tanstack/react-query';
import { actionsApi } from './api';

export function useActions() {
  return useQuery({
    queryKey: ['actions'],
    queryFn: actionsApi.list,
    staleTime: 5 * 60 * 1000,
  });
}
