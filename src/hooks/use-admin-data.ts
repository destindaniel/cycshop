import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { useRouterState } from '@tanstack/react-router';
import { getAdminData, writeAdminData, uploadAdminImage, removeAdminImages } from '@/lib/admin.functions';

type Snapshot = Awaited<ReturnType<typeof getAdminData>>;
export function useAdminData<K extends keyof Snapshot>(section: K) {
  const fetch = useServerFn(getAdminData);
  const tab = useRouterState({ select: (s) => s.location.searchStr });
  return useQuery({ queryKey: ['admin', 'snapshot', tab], queryFn: () => fetch(), retry: false, select: (snapshot) => snapshot[section] });
}
export function useAdminActions() {
  const write = useServerFn(writeAdminData);
  const upload = useServerFn(uploadAdminImage);
  const remove = useServerFn(removeAdminImages);
  return { write, remove, upload: async (file: File) => {
    const data = new FormData(); data.set('file', file);
    return (await upload({ data })).path;
  } };
}