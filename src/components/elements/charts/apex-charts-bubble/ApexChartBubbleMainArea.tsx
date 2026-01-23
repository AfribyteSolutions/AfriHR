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

const BubbleChartsBasic = () => {
  const options: ApexOptions = {
    chart: {
      height: 350,
      type: "bubble",
      toolbar: { show: true },
    },
    dataLabels: {
      enabled: false,
    },
    fill: {
      opacity: 0.8,
    },
    title: {
      text: "Simple Bubble Chart",
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
      name: "Bubble 1",
      data: generateData(Date.now(), 20, { min: 10, max: 60 }),
    },
    {
      name: "Bubble 2",
      data: generateData(Date.now(), 20, { min: 10, max: 60 }),
    },
    {
      name: "Bubble 3",
      data: generateData(Date.now(), 20, { min: 10, max: 60 }),
    },
    {
      name: "Bubble 4",
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

export default BubbleChartsBasic;
