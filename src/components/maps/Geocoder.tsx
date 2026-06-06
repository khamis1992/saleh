import { useLocale } from '@/providers/LocaleContext';
import { useState, useCallback } from 'react';
import { Search, MapPin, Loader2, X, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

export interface GeocodingResult {
  lat: number;
  lng: number;
  displayName: string;
  type?: string;
  raw?: any;
}

interface GeocoderProps {
  onSelect: (result: GeocodingResult) => void;
  defaultQuery?: string;
  countryCodes?: string; // ISO 3166-1 alpha2 codes, comma-separated (e.g. "qa,sa,ae,bh,kw,om")
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  type?: string;
  importance?: number;
}

export function Geocoder({ onSelect, defaultQuery = '', countryCodes = 'qa,sa,ae,bh,kw,om,eg,jo,iq' }: GeocoderProps) {
  const { dir } = useLocale();
  const [query, setQuery] = useState(defaultQuery);
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showDropdown, setShowDropdown] = useState(false);

  const search = useCallback(async (q: string) => {
    if (!q || q.trim().length < 3) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&accept-language=ar&q=${encodeURIComponent(q)}&countrycodes=${countryCodes}`;
      const res = await fetch(url, {
        headers: { 'Accept': 'application/json' },
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data: NominatimResult[] = await res.json();
      setResults(data);
      setShowDropdown(true);
      if (data.length === 0) {
        setError('لا توجد نتائج');
      }
    } catch (e: any) {
      setError('تعذر الاتصال بخدمة البحث. تحقق من الإنترنت.');
      setResults([]);
      toast.error('فشل البحث في الموقع');
    } finally {
      setLoading(false);
    }
  }, [countryCodes]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      search(query);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const handleSelect = (r: NominatimResult) => {
    onSelect({
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
      displayName: r.display_name,
      type: r.type,
      raw: r,
    });
    setQuery(r.display_name);
    setShowDropdown(false);
    toast.success('تم تحديد الموقع');
  };

  const clear = () => {
    setQuery('');
    setResults([]);
    setShowDropdown(false);
    setError('');
  };

  return (
    <div className="relative w-full">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748d] pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => results.length > 0 && setShowDropdown(true)}
            placeholder="ابحث عن موقع (مثال: الدوحة، قطر)"
            className="pr-10 pl-10 h-9 text-sm rounded-lg border-[#e5edf5]"
            dir={dir}
          />
          {loading && (
            <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748d] animate-spin" />
          )}
          {!loading && query && (
            <button
              type="button"
              onClick={clear}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748d] hover:text-[#64748d]"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => search(query)}
          disabled={loading || query.length < 3}
          className="gap-1 h-9"
        >
          <Search className="h-3.5 w-3.5" />
          بحث
        </Button>
      </div>

      {showDropdown && results.length > 0 && (
        <Card className="absolute z-50 mt-1 w-full max-h-80 overflow-y-auto shadow-lg border-[#e5edf5]">
          <ul className="divide-y divide-gray-100">
            {results.map((r, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => handleSelect(r)}
                  className="w-full text-right p-3 hover:bg-[rgba(83,58,253,0.06)] transition-colors flex items-start gap-2"
                >
                  <MapPin className="h-4 w-4 text-[#533afd] mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#273951] truncate" dir={dir}>{r.display_name}</p>
                    <p className="text-xs text-[#64748d] mt-0.5 font-mono" dir="ltr">
                      {parseFloat(r.lat).toFixed(6)}, {parseFloat(r.lon).toFixed(6)}
                    </p>
                    {r.type && (
                      <span className="text-[12px] text-[#64748d] mt-0.5 inline-block">
                        {r.type}
                      </span>
                    )}
                  </div>
                  <ExternalLink className="h-3 w-3 text-[#64748d] mt-1 flex-shrink-0" />
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {showDropdown && results.length === 0 && !loading && !error && query.length >= 3 && (
        <Card className="absolute z-50 mt-1 w-full p-4 text-center text-sm text-[#64748d] shadow-lg">
          لا توجد نتائج
        </Card>
      )}

      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}

      <p className="text-[12px] text-[#64748d] mt-1" dir="ltr">
        © OpenStreetMap contributors — Nominatim
      </p>
    </div>
  );
}
