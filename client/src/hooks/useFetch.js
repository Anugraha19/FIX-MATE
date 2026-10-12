// useFetch - loads data from an API function and tracks loading / error state.
//   const { data, loading, error, reload } = useFetch(() => adminApi.users({ q }), [q]);
// useCallback keeps `load` stable; useEffect runs it when the dependencies change.
import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '../services/api';

export default function useFetch(apiFunction, deps = [], { skip = false } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState(null);
  const latest = useRef(0); // ignore answers that arrive late (e.g. after typing another search)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const load = useCallback(async () => {
    const requestId = ++latest.current;
    setLoading(true);
    setError(null);
    try {
      const result = await apiFunction();
      if (requestId === latest.current) setData(result);
    } catch (err) {
      if (requestId === latest.current) setError(getErrorMessage(err));
    } finally {
      if (requestId === latest.current) setLoading(false);
    }
  }, deps);

  useEffect(() => {
    if (!skip) load();
  }, [load, skip]);

  return { data, loading, error, reload: load, setData };
}
