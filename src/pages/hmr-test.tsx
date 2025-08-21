import React, { useState } from 'react';

export default function HmrTest() {
  const [count, setCount] = useState(0);
  return (
    <div style={{ padding: 24 }}>
      <h1>HMR Test Page</h1>
      <p data-testid="hmr-text">Edit this text to trigger HMR. Count: {count}</p>
      <button onClick={() => setCount((c) => c + 1)}>Increment</button>
    </div>
  );
}
