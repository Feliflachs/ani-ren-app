import { useEffect, useRef, useState } from 'react';
import countries from 'i18n-iso-countries';
import spanish from 'i18n-iso-countries/langs/es.json';
import { detectCountry } from './country';
countries.registerLocale(spanish);
export const viewingCountries = Object.entries(countries.getNames('es'))
  .map(([code, name]) => ({ code, name }))
  .sort((a, b) => a.name.localeCompare(b.name, 'es'));

export function useViewingCountry() {
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const requestId = useRef(0);
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    let active = true;
    const request = ++requestId.current;
    void detectCountry().then((result) => {
      if (!active || request !== requestId.current) return;
      setCode(result.code);
      setMessage(result.message);
      setLoading(false);
    });
    return () => {
      active = false;
      mounted.current = false;
    };
  }, []);
  async function locate() {
    const request = ++requestId.current;
    setLoading(true);
    setMessage('');
    const result = await detectCountry(true);
    if (!mounted.current || request !== requestId.current) return;
    setCode(result.code);
    setMessage(result.message);
    setLoading(false);
  }
  function choose(next: string) {
    requestId.current++;
    setCode(next);
    setMessage('');
    setLoading(false);
  }
  return {
    code,
    name: viewingCountries.find((country) => country.code === code)?.name,
    loading,
    message,
    locate,
    choose,
  };
}
