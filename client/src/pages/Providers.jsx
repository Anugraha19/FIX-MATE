// Providers listing - filters are sent to GET /api/providers.
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Icon from '../components/Icon';
import ProviderCard from '../components/ProviderCard';
import { Alert, EmptyState, Field, Loading, Pagination } from '../components/ui';
import useDebounce from '../hooks/useDebounce';
import useFetch from '../hooks/useFetch';
import { providersApi } from '../services/api';
import { fetchCategories, selectCategories } from '../redux/slices/serviceSlice';

export default function Providers() {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const categories = useSelector(selectCategories);

  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState('');
  const [rating, setRating] = useState('');
  const [location, setLocation] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 400);
  const debouncedLocation = useDebounce(location, 400);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const params = useMemo(() => {
    const p = { page, limit: 9 };
    if (debouncedSearch.trim()) p.q = debouncedSearch.trim();
    if (category) p.category = category;
    if (rating) p.rating = rating;
    if (debouncedLocation.trim()) p.location = debouncedLocation.trim();
    if (availableOnly) p.available = 'true';
    return p;
  }, [debouncedSearch, category, rating, debouncedLocation, availableOnly, page]);

  const { data, loading, error, reload } = useFetch(() => providersApi.list(params), [params]);

  const reset = (setter) => (event) => {
    setter(event.target.type === 'checkbox' ? event.target.checked : event.target.value);
    setPage(1);
  };

  return (
    <>
      <section className="page-head">
        <div className="container">
          <h1>Our service providers</h1>
          <p>Experienced plumbers, electricians, carpenters, painters and more. Check ratings and availability before you book.</p>
        </div>
      </section>

      <div className="container page-body">
        <div className="filters filters--providers">
          <Field label="Search by name or skill" htmlFor="pv-search" className="field--wide">
            <div className="input-wrap">
              <Icon name="search" size={18} />
              <input id="pv-search" className="input" type="search" placeholder="e.g. Rajesh, wiring" value={search} onChange={reset(setSearch)} />
            </div>
          </Field>
          <Field label="Category" htmlFor="pv-category">
            <select id="pv-category" className="select" value={category} onChange={reset(setCategory)}>
              <option value="">All categories</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Minimum rating" htmlFor="pv-rating">
            <select id="pv-rating" className="select" value={rating} onChange={reset(setRating)}>
              <option value="">Any rating</option>
              <option value="4">4 stars and up</option>
              <option value="4.5">4.5 stars and up</option>
            </select>
          </Field>
          <Field label="Location" htmlFor="pv-location">
            <input id="pv-location" className="input" placeholder="e.g. Aluva" value={location} onChange={reset(setLocation)} />
          </Field>
        </div>
        <div className="toolbar">
          <label className="check">
            <input type="checkbox" checked={availableOnly} onChange={reset(setAvailableOnly)} /> Show available providers only
          </label>
          <span className="small muted" style={{ marginLeft: 'auto' }} aria-live="polite">{loading ? 'Searching...' : `${data?.total ?? 0} provider${data?.total === 1 ? '' : 's'} found`}</span>
        </div>

        {error && <Alert onRetry={reload}>{error}</Alert>}
        {loading && !data && <Loading text="Loading providers..." />}
        {data && data.providers.length === 0 && (
          <EmptyState icon="users" title="No providers found" message="Try removing a filter or searching a nearby location." />
        )}
        <div className="grid grid--cards" style={{ opacity: loading ? 0.6 : 1 }}>
          {data?.providers.map((p) => <ProviderCard key={p.id} provider={p} />)}
        </div>
        <Pagination page={page} pages={data?.pages} onChange={setPage} />
      </div>
    </>
  );
}
