"use client";

import React from "react";
import { DynamicDashboard } from '@/components/organisms/dashboard/DynamicDashboard';

export const SampleDashboard: React.FC<{ areaCode: string }> = ({
  areaCode,
}) => {
  return (
    <DynamicDashboard
      subcategoryId="dynamic-sample"
      areaCode={areaCode}
      areaType={areaCode === '00000' ? 'national' : 'prefecture'}
    />
  );
};
