// Services page - search + filters are sent to GET /api/services and the DATABASE does the filtering.
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Icon from '../components/Icon';
import ServiceCard from '../components/ServiceCard';
import { Alert, EmptyState, Field, Loading, Pagination } from '../components/ui';
import useDebounce from '../hooks/useDebounce';
import { fetchCategories, fetchServices, selectCategories, selectServiceError, selectServices, selectServiceStatus } from '../redux/slices/serviceSlice';
import { setDraft } from '../redux/slices/bookingSlice';

const emptyFilters = { category: '', minPrice: '', maxPrice: '', rating: '', location: '', available: false, sort: 'name' };

export default function Services() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const services = useSelector(selectServices);
  const categories = useSelector(selectCategories);
  const status = useSelector(selectServiceStatus);
  const error = useSelector(selectServiceError);
  const { total, pages } = useSelector((state) => state.services);

  // start from the URL, e.g. /services?q=tap or /services?category=Plumbing
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [filters, setFilters] = useState({ ...emptyFilters, category: searchParams.get('category') || '' });
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 400); // wait until the user stops typing

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  // useMemo: build the query object only when something changes
  const params = useMemo(() => {
    const p = { page, limit: 9, sort: filters.sort };
    if (debouncedSearch.trim()) p.q = debouncedSearch.trim();
    if (filters.category) p.category = filters.category;
    if (filters.minPrice) p.minPrice = filters.minPrice;
    if (filters.maxPrice) p.maxPrice = filters.maxPrice;
    if (filters.rating) p.rating = filters.rating;
    if (filters.location.trim()) p.location = filters.location.trim();
    if (filters.available) p.available = 'true';
    return p;
  }, [debouncedSearch, filters, page]);

  useEffect(() => {
    dispatch(fetchServices(params));
  }, [dispatch, params]);

  const updateFilter = (name, value) => {
    setFilters((current) => ({ ...current, [name]: value }));
    setPage(1);
  };
  const clearAll = () => {
    setSearch('');
    setFilters(emptyFilters);
    setPage(1);
  };
  const hasFilters = search || filters.category || filters.minPrice || filters.maxPrice || filters.rating || filters.location || filters.available;

  const handleBook = (service) => {
    dispatch(setDraft({ service_id: service.id, provider_id: '' }));
    navigate('/booking');
  };

  return (
    <>
      <section className="page-head">
        <div className="container">
          <h1>Home repair services</h1>
          <p>Choose a service, compare prices and book a trusted professional.</p>
        </div>
      </section>

      <div className="container page-body">
        <div className="filters">
          <Field label="Search by name, category" htmlFor="svc-search" className="field--wide">
            <div className="input-wrap">
              <Icon name="search" size={18} />
              <input id="svc-search" className="input" type="search" placeholder="e.g. tap, wiring, AC" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
            </div>
          </Field>
          <Field label="Category" htmlFor="svc-category">
            <select id="svc-category" className="select" value={filters.category} onChange={(e) => updateFilter('category', e.target.value)}>
              <option value="">All categories</option>
              {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Minimum rating" htmlFor="svc-rating">
            <select id="svc-rating" className="select" value={filters.rating} onChange={(e) => updateFilter('rating', e.target.value)}>
              <option value="">Any rating</option>
              <option value="4">4 stars and up</option>
              <option value="3">3 stars and up</option>
              <option value="5">5 stars only</option>
            </select>
          </Field>
          <Field label="Provider location" htmlFor="svc-location">
            <input id="svc-location" className="input" placeholder="e.g. Kochi" value={filters.location} onChange={(e) => updateFilter('location', e.target.value)} />
          </Field>
          <Field label="Sort by" htmlFor="svc-sort">
            <select id="svc-sort" className="select" value={filters.sort} onChange={(e) => updateFilter('sort', e.target.value)}>
              <option value="name">Name</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
              <option value="newest">Newest</option>
            </select>
          </Field>
        </div>

        <div className="toolbar">
          <label className="row" style={{ gap: 8 }}>
            <span className="small muted">Price</span>
            <input className="input" style={{ width: 110 }} type="number" min="0" placeholder="Min" aria-label="Minimum price" value={filters.minPrice} onChange={(e) => updateFilter('minPrice', e.target.value)} />
            <span className="muted">to</span>
            <input className="input" style={{ width: 110 }} type="number" min="0" placeholder="Max" aria-label="Maximum price" value={filters.maxPrice} onChange={(e) => updateFilter('maxPrice', e.target.value)} />
          </label>
          <label className="check">
            <input type="checkbox" checked={filters.available} onChange={(e) => updateFilter('available', e.target.checked)} />
            Providers available now
          </label>
          {hasFilters && <button type="button" className="btn btn--light btn--sm" onClick={clearAll}>Clear filters</button>}
          <span className="small muted" style={{ marginLeft: 'auto' }} aria-live="polite">{status === 'loading' ? 'Searching...' : `${total} service${total === 1 ? '' : 's'} found`}</span>
        </div>

        {status === 'failed' && <Alert onRetry={() => dispatch(fetchServices(params))}>{error}</Alert>}
        {status === 'loading' && services.length === 0 && <Loading text="Loading services..." />}

        {status !== 'failed' && status !== 'loading' && services.length === 0 && (
          <EmptyState
            icon="search"
            title="No services match your search"
            message="Try a different word, remove a filter or choose another category."
            action={<button type="button" className="btn btn--primary btn--sm" onClick={clearAll}>Clear filters</button>}
          />
        )}

        <div className="grid grid--cards" style={{ opacity: status === 'loading' ? 0.6 : 1 }}>
          {services.map((service) => <ServiceCard key={service.id} service={service} onBook={handleBook} />)}
        </div>
        <Pagination page={page} pages={pages} onChange={setPage} />
      </div>
    </>
  );
}
