// useDebounce - waits until the user stops typing before the value changes (avoids an API call per keystroke).
import { useEffect, useState } from 'react';

export default function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer); // cleanup if the value changes again
  }, [value, delay]);
  return debounced;
}
