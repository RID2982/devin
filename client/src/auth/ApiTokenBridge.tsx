import { useEffect } from 'react';
import { setApiTokenGetter } from '@/lib/api';
import { setDownloadTokenGetter } from '@/lib/downloadAttachment';
import { useAuth } from './AuthProvider';

/** Keeps the shared apiClient's token getter in sync with the current auth session. */
export function ApiTokenBridge() {
  const { accessToken } = useAuth();

  useEffect(() => {
    setApiTokenGetter(() => accessToken);
    setDownloadTokenGetter(() => accessToken);
  }, [accessToken]);

  return null;
}
