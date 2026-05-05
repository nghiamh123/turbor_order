import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Vietnam Address API from provinces.open-api.vn
 * Free, open-source, no API key required.
 * Provides full 63 provinces → districts → wards data.
 */

const API_BASE = 'https://provinces.open-api.vn/api';

export interface AddressUnit {
  code: number;
  name: string;
  division_type: string;
  codename: string;
}

export interface Province extends AddressUnit {
  phone_code: number;
}

export interface District extends AddressUnit {
  province_code: number;
}

export interface Ward extends AddressUnit {
  district_code: number;
}

// Simple in-memory cache to avoid refetching
const cache: Record<string, unknown> = {};

async function fetchWithCache<T>(url: string, cacheKey: string): Promise<T> {
  if (cache[cacheKey] !== undefined) return cache[cacheKey] as T;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);
  const data = await res.json();
  cache[cacheKey] = data;
  return data as T;
}

export function useVietnamAddress() {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  // Track latest request to prevent race conditions
  const districtReqRef = useRef(0);
  const wardReqRef = useRef(0);

  // Load provinces once on mount
  useEffect(() => {
    let cancelled = false;
    setLoadingProvinces(true);

    fetchWithCache<Province[]>(`${API_BASE}/p/`, 'provinces')
      .then((data) => {
        if (!cancelled) setProvinces(data);
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoadingProvinces(false);
      });

    return () => { cancelled = true; };
  }, []);

  // Fetch districts for selected province
  const fetchDistricts = useCallback(async (provinceCode: number) => {
    const reqId = ++districtReqRef.current;
    setLoadingDistricts(true);
    setDistricts([]);
    setWards([]);

    try {
      const data = await fetchWithCache<{ districts: District[] }>(
        `${API_BASE}/p/${provinceCode}?depth=2`,
        `districts_${provinceCode}`,
      );

      if (reqId === districtReqRef.current) {
        setDistricts(data.districts || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (reqId === districtReqRef.current) {
        setLoadingDistricts(false);
      }
    }
  }, []);

  // Fetch wards for selected district
  const fetchWards = useCallback(async (districtCode: number) => {
    const reqId = ++wardReqRef.current;
    setLoadingWards(true);
    setWards([]);

    try {
      const data = await fetchWithCache<{ wards: Ward[] }>(
        `${API_BASE}/d/${districtCode}?depth=2`,
        `wards_${districtCode}`,
      );

      if (reqId === wardReqRef.current) {
        setWards(data.wards || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (reqId === wardReqRef.current) {
        setLoadingWards(false);
      }
    }
  }, []);

  // Reset districts and wards
  const resetDistricts = useCallback(() => {
    setDistricts([]);
    setWards([]);
  }, []);

  const resetWards = useCallback(() => {
    setWards([]);
  }, []);

  return {
    provinces,
    districts,
    wards,
    loadingProvinces,
    loadingDistricts,
    loadingWards,
    fetchDistricts,
    fetchWards,
    resetDistricts,
    resetWards,
  };
}
