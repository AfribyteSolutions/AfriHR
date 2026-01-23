"use client";

import React from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";

const Chart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

const generateData = (
  baseTime: number,
  count: number,
  range: { min: number; max: number }
) => {
  const series: [number, number, number][] = [];

  for (let i = 0; i < count; i++) {
    const x = baseTime + i * 86400000;
    const y =
      Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
    const z =
      Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;

    series.push([x, y, z]);
  }

  return series;
};

const BubbleChart3D = () => {
  const options: ApexOptions = {
    chart: {
      height: 350,
      type: "bubble",
      toolbar: { show: true },
    },
    plotOptions: {
      bubble: {
        zScaling: true,
      },
    },
    dataLabels: {
      enabled: false,
    },
    fill: {
      opacity: 0.9,
    },
    title: {
      text: "3D Bubble Chart",
    },
    xaxis: {
      tickAmount: 12,
      type: "category",
    },
    yaxis: {
      max: 70,
    },
    legend: {
      show: true,
    },
  };

  const series = [
    {
      name: "3D Bubble 1",
      data: generateData(Date.now(), 20, { min: 10, max: 60 }),
    },
    {
      name: "3D Bubble 2",
      data: generateData(Date.now(), 20, { min: 10, max: 60 }),
    },
    {
      name: "3D Bubble 3",
      data: generateData(Date.now(), 20, { min: 10, max: 60 }),
    },
  ];

  return (
    <Chart
      options={options}
      series={series}
      type="bubble"
      height={350}
    />
  );
};

export default BubbleChart3D;
