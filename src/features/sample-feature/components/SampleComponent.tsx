// Reference component pattern for a feature
"use client";

import { useSampleItems } from "../hooks/useSample";

export default function SampleComponent() {
  const { data, isLoading, error } = useSampleItems();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading data.</div>;

  return (
    <ul>
      {data?.map((item) => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}
