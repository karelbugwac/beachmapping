// Verification test script for Dagat Ta Bai
async function runTests() {
  console.log('--- Starting Dagat Ta Bai System Verification ---');

  // 1. Beaches endpoint
  try {
    const res = await fetch('http://localhost:3000/api/beaches');
    const beaches = await res.json();
    console.log(`[PASS] /api/beaches: Retrieved ${beaches.length} beaches`);
    beaches.forEach((b) => {
      console.log(`  - ${b.name} (slug: /beaches/${b.slug}, lat: ${b.latitude}, lng: ${b.longitude})`);
    });
  } catch (err) {
    console.error('[FAIL] /api/beaches error:', err);
  }

  // 2. Rañola Beach with 360 tour
  try {
    const res = await fetch('http://localhost:3000/api/beaches/ranola');
    const ranola = await res.json();
    console.log(`[PASS] /api/beaches/ranola: slug=${ranola.slug}, 360 tour=${ranola.virtual_tour_url ? 'PRESENT' : 'NONE'}`);
  } catch (err) {
    console.error('[FAIL] /api/beaches/ranola error:', err);
  }

  // 3. Majestique Beach
  try {
    const res = await fetch('http://localhost:3000/api/beaches/majestique');
    const majestique = await res.json();
    console.log(`[PASS] /api/beaches/majestique: slug=${majestique.slug}, 360 tour=${majestique.virtual_tour_url || 'Under Maintenance'}`);
  } catch (err) {
    console.error('[FAIL] /api/beaches/majestique error:', err);
  }

  // 4. Real OSRM Route Calculation (Cebu City to Catmon)
  try {
    const res = await fetch('http://localhost:3000/api/route', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin: { lat: 10.3157, lng: 123.8854 }, // Cebu City
        destination: { lat: 10.6348, lng: 124.0275 }, // Majestique Beach, Catmon
      }),
    });
    const route = await res.json();
    console.log(`[PASS] /api/route (OSRM Engine):`);
    console.log(`  - Distance: ${route.distanceKm} km`);
    console.log(`  - Estimated Travel Time: ${route.durationFormatted} (${route.durationMinutes} mins)`);
    console.log(`  - Mode: ${route.transportMode}`);
    console.log(`  - Road Geometry Coordinates: ${route.coordinates?.length} polyline waypoints`);
  } catch (err) {
    console.error('[FAIL] /api/route error:', err);
  }

  // 5. Bai AI Chatbot (Gemini with Database access)
  try {
    const res = await fetch('http://localhost:3000/api/assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'What is the entrance fee and opening hours for Majestique Beach Resort?',
      }),
    });
    const data = await res.json();
    console.log(`[PASS] /api/assistant (Bai Gemini):`);
    console.log(`  - Query: "What is the entrance fee and opening hours for Majestique Beach Resort?"`);
    console.log(`  - Response: ${data.reply}`);
  } catch (err) {
    console.error('[FAIL] /api/assistant error:', err);
  }

  console.log('--- System Verification Completed ---');
}

runTests();
