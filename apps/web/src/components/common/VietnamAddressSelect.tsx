import { useEffect, useCallback } from 'react';
import { Select, Space } from 'antd';
import { useTranslation } from 'react-i18next';
import { useVietnamAddress } from '@/hooks/useVietnamAddress';

export interface AddressValue {
  city?: string;
  district?: string;
  ward?: string;
  cityCode?: number;
  districtCode?: number;
  wardCode?: number;
}

interface VietnamAddressSelectProps {
  value?: AddressValue;
  onChange?: (value: AddressValue) => void;
  /** Direction of the 3 selects: horizontal or vertical */
  direction?: 'horizontal' | 'vertical';
}

/**
 * 3 cascading Select dropdowns for Vietnamese address:
 * Tỉnh/TP → Quận/Huyện → Phường/Xã
 *
 * Integrates with Ant Design Form via value/onChange pattern.
 */
export default function VietnamAddressSelect({
  value = {},
  onChange,
  direction = 'horizontal',
}: VietnamAddressSelectProps) {
  const { t } = useTranslation();
  const {
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
  } = useVietnamAddress();

  // If value has cityCode on mount (edit mode), load dependent data
  useEffect(() => {
    const code = Number(value?.cityCode);
    if (code) {
      fetchDistricts(code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const code = Number(value?.districtCode);
    if (code && districts.length > 0) {
      fetchWards(code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [districts]);

  const triggerChange = useCallback(
    (changedValue: Partial<AddressValue>) => {
      onChange?.({ ...value, ...changedValue });
    },
    [value, onChange],
  );

  const handleProvinceChange = useCallback(
    (code: number, option: { label?: string } | { label?: string }[]) => {
      const opt = Array.isArray(option) ? option[0] : option;
      resetDistricts();
      resetWards();

      triggerChange({
        city: opt?.label || '',
        cityCode: code,
        district: undefined,
        districtCode: undefined,
        ward: undefined,
        wardCode: undefined,
      });

      fetchDistricts(code);
    },
    [triggerChange, fetchDistricts, resetDistricts, resetWards],
  );

  const handleDistrictChange = useCallback(
    (code: number, option: { label?: string } | { label?: string }[]) => {
      const opt = Array.isArray(option) ? option[0] : option;
      resetWards();

      triggerChange({
        district: opt?.label || '',
        districtCode: code,
        ward: undefined,
        wardCode: undefined,
      });

      fetchWards(code);
    },
    [triggerChange, fetchWards, resetWards],
  );

  const handleWardChange = useCallback(
    (code: number, option: { label?: string } | { label?: string }[]) => {
      const opt = Array.isArray(option) ? option[0] : option;
      triggerChange({
        ward: opt?.label || '',
        wardCode: code,
      });
    },
    [triggerChange],
  );

  const provinceOptions = provinces.map((p) => ({
    value: p.code,
    label: p.name,
  }));

  const districtOptions = districts.map((d) => ({
    value: d.code,
    label: d.name,
  }));

  const wardOptions = wards.map((w) => ({
    value: w.code,
    label: w.name,
  }));

  const selectStyle = direction === 'vertical' ? { width: '100%' } : { minWidth: 180, flex: 1 };

  return (
    <Space
      direction={direction}
      style={{ width: '100%' }}
      size={direction === 'vertical' ? 8 : 12}
    >
      <Select
        showSearch
        value={value?.cityCode ? Number(value.cityCode) : undefined}
        placeholder={t('address.province_placeholder', 'Tỉnh / Thành phố')}
        options={provinceOptions}
        onChange={handleProvinceChange}
        loading={loadingProvinces}
        filterOption={(input, option) =>
          (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
        }
        style={selectStyle}
        allowClear
        onClear={() => {
          resetDistricts();
          resetWards();
          triggerChange({
            city: undefined,
            cityCode: undefined,
            district: undefined,
            districtCode: undefined,
            ward: undefined,
            wardCode: undefined,
          });
        }}
      />
      <Select
        showSearch
        value={value?.districtCode ? Number(value.districtCode) : undefined}
        placeholder={t('address.district_placeholder', 'Quận / Huyện')}
        options={districtOptions}
        onChange={handleDistrictChange}
        loading={loadingDistricts}
        disabled={!value?.cityCode}
        filterOption={(input, option) =>
          (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
        }
        style={selectStyle}
        allowClear
        onClear={() => {
          resetWards();
          triggerChange({
            district: undefined,
            districtCode: undefined,
            ward: undefined,
            wardCode: undefined,
          });
        }}
      />
      <Select
        showSearch
        value={value?.wardCode ? Number(value.wardCode) : undefined}
        placeholder={t('address.ward_placeholder', 'Phường / Xã')}
        options={wardOptions}
        onChange={handleWardChange}
        loading={loadingWards}
        disabled={!value?.districtCode}
        filterOption={(input, option) =>
          (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
        }
        style={selectStyle}
        allowClear
        onClear={() => {
          triggerChange({
            ward: undefined,
            wardCode: undefined,
          });
        }}
      />
    </Space>
  );
}
