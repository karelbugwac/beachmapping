import { createAdminClient } from '@/lib/supabase/server';
import { getAllBeaches, type BeachRecord } from '@/lib/db/beaches';
import { getOpeningStatus, formatOpeningHoursGroups } from '@/lib/utils/opening-status';
import { fetchLiveWeather, type WeatherData } from '@/lib/services/weather';
import { fetchOpenWatersTides, type OpenWatersTidesResult } from '@/lib/services/tides';
import { haversineDistanceKm } from '@/lib/utils/distance';
import { getValidBeachCoordinates } from '@/lib/utils/beach-coordinates';
import {
  detectLanguage,
  detectBeachesInText,
  type BeachKey,
} from '@/lib/services/baiknowledge';

export interface ScannedCottage {
  beachid: string;
  name: string;
  description: string;
  price: string | null;
  capacity: string | null;
}

export interface ScannedFacility {
  beachid: string;
  name: string;
  category: string;
  description: string;
  price: string | null;
  ratesText: string;
}

export interface ScannedPost {
  beachid: string;
  caption: string;
  createdat: string;
}

export interface ScannedReview {
  beachid: string;
  rating: number;
  comment: string;
  createdat: string;
}

export interface EnrichedSystemBeach {
  record: BeachRecord;
  key: BeachKey | null;
  openStatusNow: { state: string; label: string; detail: string };
  formattedHours: string;
  cottages: ScannedCottage[];
  facilities: ScannedFacility[];
  posts: ScannedPost[];
  reviews: ScannedReview[];
  reviewCount: number;
}

export interface SystemScanSnapshot {
  beaches: EnrichedSystemBeach[];
  platformReviewsCount: number;
  weather: WeatherData | null;
  tides: OpenWatersTidesResult | null;
  scannedAt: number;
}

const SCAN_CACHE_TTL_MS = 30 * 1000; // 30-second live system & DB cache

const globalForScanner = globalThis as unknown as {
  __dagatSystemScanCache?: { data: SystemScanSnapshot; expiresAt: number };
};

function mapBeachNameToKey(name: string): BeachKey | null {
  const lower = name.toLowerCase();
  if (lower.includes('rañola') || lower.includes('ranola') || lower.includes('raniola')) return 'ranola';
  if (lower.includes('lite bay') || lower.includes('litebay') || lower.includes('light bay')) return 'litebay';
  if (lower.includes('majestique') || lower.includes('majestic')) return 'majestique';
  if (lower.includes('hinagdan')) return 'hinagdan';
  return null;
}

function formatRatesArray(rates: unknown): string {
  if (!Array.isArray(rates) || rates.length === 0) return '';
  return rates
    .map((r: any) => {
      if (!r || typeof r !== 'object') return '';
      const label = r.label || r.key || 'Fee';
      const amt = r.amount == null || r.amount === 0 ? 'Free' : `₱${r.amount}`;
      return `${label}: ${amt}`;
    })
    .filter(Boolean)
    .join(', ');
}

function formatTideTimeManila(isoTime: string): string {
  try {
    const d = new Date(isoTime);
    if (!Number.isFinite(d.getTime())) return isoTime;
    return d.toLocaleTimeString('en-US', {
      timeZone: 'Asia/Manila',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return isoTime;
  }
}

/**
 * Gathers live data from:
 * 1) The System (opening status calculator, platform features, system weather & tide services)
 * 2) The Database (beaches, cottages, facilities, beachposts, beachreviews, platformreviews, weathersnapshots)
 */
export async function scanLiveSystemSnapshot(): Promise<SystemScanSnapshot> {
  const now = Date.now();
  if (globalForScanner.__dagatSystemScanCache && globalForScanner.__dagatSystemScanCache.expiresAt > now) {
    return globalForScanner.__dagatSystemScanCache.data;
  }

  const [beachesResult, weatherResult, tidesResult] = await Promise.allSettled([
    getAllBeaches(),
    Promise.race([
      fetchLiveWeather(10.7286, 124.0152),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500)),
    ]),
    Promise.race([
      fetchOpenWatersTides(10.6341, 124.0279),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500)),
    ]),
  ]);

  const beaches = beachesResult.status === 'fulfilled' ? beachesResult.value : [];
  const weather = weatherResult.status === 'fulfilled' ? weatherResult.value : null;
  let tides = tidesResult.status === 'fulfilled' ? tidesResult.value : null;

  let cottagesRows: any[] = [];
  let facilitiesRows: any[] = [];
  let postsRows: any[] = [];
  let reviewsRows: any[] = [];
  let platformReviewsCount = 0;

  try {
    const admin = createAdminClient();
    const [cRes, fRes, pRes, rRes, prRes, snapRes] = await Promise.allSettled([
      (admin.from('cottages') as any)
        .select('beachid, name, description, price, capacitylabel, capacity, isavailable')
        .eq('isavailable', true),
      (admin.from('facilities') as any)
        .select('beachid, name, category, description, price, pricelabel, rates, isavailable')
        .eq('isavailable', true),
      (admin.from('beachposts') as any)
        .select('beachid, caption, createdat, status')
        .eq('status', 'published')
        .order('createdat', { ascending: false })
        .limit(20),
      (admin.from('beachreviews') as any)
        .select('beachid, rating, comment, createdat')
        .order('createdat', { ascending: false })
        .limit(40),
      (admin.from('platformreviews') as any)
        .select('id', { count: 'exact', head: true }),
      !tides
        ? (admin.from('weathersnapshots') as any)
            .select('tideextremes, syncedat')
            .order('syncedat', { ascending: false })
            .limit(1)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    if (cRes.status === 'fulfilled' && Array.isArray(cRes.value.data)) cottagesRows = cRes.value.data;
    if (fRes.status === 'fulfilled' && Array.isArray(fRes.value.data)) facilitiesRows = fRes.value.data;
    if (pRes.status === 'fulfilled' && Array.isArray(pRes.value.data)) postsRows = pRes.value.data;
    if (rRes.status === 'fulfilled' && Array.isArray(rRes.value.data)) reviewsRows = rRes.value.data;
    if (prRes.status === 'fulfilled' && typeof prRes.value.count === 'number') {
      platformReviewsCount = prRes.value.count;
    }
    if (!tides && snapRes.status === 'fulfilled' && Array.isArray(snapRes.value?.data?.tideextremes)) {
      tides = {
        extremes: snapRes.value.data.tideextremes,
        copyright: 'Database Tide Snapshot',
      };
    }
  } catch {
    // Non-fatal if supplemental tables are unavailable
  }

  const nowDate = new Date();
  const enrichedBeaches: EnrichedSystemBeach[] = beaches.map((beach) => {
    const openStatusNow = getOpeningStatus(beach.openinghours, nowDate);
    const groups = formatOpeningHoursGroups(beach.openinghours);
    const formattedHours = groups.map((g) => `${g.days}: ${g.hours}`).join(' | ');

    const cottages: ScannedCottage[] = cottagesRows
      .filter((c) => c.beachid === beach.id)
      .map((c) => ({
        beachid: c.beachid,
        name: String(c.name || ''),
        description: String(c.description || ''),
        price: c.price != null ? `₱${c.price}` : null,
        capacity: c.capacitylabel || (c.capacity ? `${c.capacity} persons` : null),
      }));

    const facilities: ScannedFacility[] = facilitiesRows
      .filter((f) => f.beachid === beach.id)
      .map((f) => ({
        beachid: f.beachid,
        name: String(f.name || ''),
        category: String(f.category || 'amenity'),
        description: String(f.description || ''),
        price: f.pricelabel || (f.price != null ? `₱${f.price}` : null),
        ratesText: formatRatesArray(f.rates),
      }));

    const posts: ScannedPost[] = postsRows
      .filter((p) => p.beachid === beach.id && p.caption)
      .slice(0, 5)
      .map((p) => ({
        beachid: p.beachid,
        caption: String(p.caption || ''),
        createdat: String(p.createdat || ''),
      }));

    const beachReviews: ScannedReview[] = reviewsRows
      .filter((r) => r.beachid === beach.id)
      .map((r) => ({
        beachid: r.beachid,
        rating: Number(r.rating || 0),
        comment: String(r.comment || ''),
        createdat: String(r.createdat || ''),
      }));

    return {
      record: beach,
      key: mapBeachNameToKey(beach.name),
      openStatusNow,
      formattedHours,
      cottages,
      facilities,
      posts,
      reviews: beachReviews,
      reviewCount: beachReviews.length,
    };
  });

  const snapshot: SystemScanSnapshot = {
    beaches: enrichedBeaches,
    platformReviewsCount,
    weather,
    tides,
    scannedAt: now,
  };

  globalForScanner.__dagatSystemScanCache = {
    data: snapshot,
    expiresAt: now + SCAN_CACHE_TTL_MS,
  };

  return snapshot;
}

/**
 * Formats the live System & Database records into a clean context string so Gemini AI can formulate a clear, easy-to-understand answer.
 */
export function formatSystemScanForAiPrompt(
  snapshot: SystemScanSnapshot,
  userLocation?: { lat: number; lng: number } | null
): string {
  const lines: string[] = ['LIVE SYSTEM & DATABASE RECORDS:'];

  if (snapshot.weather) {
    const w = snapshot.weather;
    const wave = typeof w.waveHeight === 'number' ? `, Wave Height: ${w.waveHeight} m` : '';
    const uv = typeof w.uvIndex === 'number' ? `, UV Index: ${w.uvIndex}` : '';
    const heat = w.heatIndex ? `, Heat Index: ${w.heatIndex.heatIndexCelsius}°C (${w.heatIndex.category})` : '';
    lines.push(
      `• System Weather Status (Catmon): ${Math.round(w.temperature)}°C (${w.conditionLabel}), Humidity: ${w.relativeHumidity}%, Wind: ${Math.round(w.windSpeed)} km/h${wave}${uv}${heat}`
    );
    if (w.dailyForecast?.length) {
      const forecastText = w.dailyForecast
        .map((d) => `${d.date}: ${d.conditionLabel} (${Math.round(d.low)}°C–${Math.round(d.high)}°C, Rain chance: ${d.precipitationProbability ?? 0}%)`)
        .join(' | ');
      lines.push(`• System 5-Day Forecast: ${forecastText}`);
    }
  }

  if (snapshot.tides && snapshot.tides.extremes.length > 0) {
    const upcomingTides = snapshot.tides.extremes
      .slice(0, 6)
      .map((t) => `${t.type === 'high' ? 'High Tide' : 'Low Tide'} at ${formatTideTimeManila(t.time)} (${t.height.toFixed(2)}m)`)
      .join(' | ');
    lines.push(`• System Tide Schedule (Catmon): ${upcomingTides}`);
  }

  for (const item of snapshot.beaches) {
    const b = item.record;
    const coords = getValidBeachCoordinates(b.latitude, b.longitude);
    const dist =
      userLocation && coords
        ? ` | Distance from user: ${haversineDistanceKm(userLocation.lat, userLocation.lng, coords.latitude, coords.longitude)} km`
        : '';
    const statusText = item.openStatusNow.label
      ? `${item.openStatusNow.label}${item.openStatusNow.detail ? ` (${item.openStatusNow.detail})` : ''}`
      : 'See hours';

    lines.push(`\n[DATABASE BEACH RECORD: ${b.name}] (Slug: /beaches/${b.slug}${dist})`);
    lines.push(`  - Real-Time Status Right Now: ${statusText}`);
    lines.push(`  - Operating Hours: ${item.formattedHours}`);
    if (b.description) lines.push(`  - Description: ${b.description}`);
    if (b.entrancefee) lines.push(`  - Entrance Fee (DB): ${b.entrancefee}`);
    if (b.cottagefee) lines.push(`  - Cottage Fee Summary (DB): ${b.cottagefee}`);
    if (b.averagerating > 0 || item.reviewCount > 0) {
      lines.push(`  - Rating & Reviews: ${b.averagerating.toFixed(1)} / 5.0 stars (${item.reviewCount} reviews)`);
    }
    if (b.peakdays || b.peakhours || b.bestvisitingtime) {
      lines.push(
        `  - Crowd / Visiting Info: Peak Days=${b.peakdays || 'N/A'}, Peak Hours=${b.peakhours || 'N/A'}, Best Time=${b.bestvisitingtime || 'N/A'}`
      );
    }
    if (b.rules) lines.push(`  - Beach Rules: ${b.rules}`);
    if (b.contactphone || b.contactemail || b.facebookurl || b.instagramurl) {
      lines.push(
        `  - Contacts & Socials: Phone=${b.contactphone || 'N/A'}, Email=${b.contactemail || 'N/A'}, FB=${b.facebookurl || 'N/A'}, IG=${b.instagramurl || 'N/A'}`
      );
    }
    lines.push(`  - 360 Virtual Tour Available: ${b.virtualtoururl ? 'Yes (available on beach page)' : 'No'}`);
    if (b.activities.length > 0) lines.push(`  - Activities: ${b.activities.join(', ')}`);
    if (b.amenities.length > 0) lines.push(`  - Amenities: ${b.amenities.join(', ')}`);
    if (item.cottages.length > 0) {
      lines.push(
        `  - Listed Cottages: ${item.cottages
          .map((c) => `${c.name}${c.price ? ` (${c.price})` : ''}${c.capacity ? ` [${c.capacity}]` : ''}${c.description ? ` - ${c.description}` : ''}`)
          .join('; ')}`
      );
    }
    if (item.facilities.length > 0) {
      lines.push(
        `  - Listed Facilities/Rentals: ${item.facilities
          .map((f) => `${f.name} (${f.category})${f.price ? `: ${f.price}` : ''}${f.ratesText ? ` [${f.ratesText}]` : ''}${f.description ? ` - ${f.description}` : ''}`)
          .join('; ')}`
      );
    }
    if (item.posts.length > 0) {
      lines.push(`  - Latest Updates/Posts: ${item.posts.map((p) => `"${p.caption}"`).join(' | ')}`);
    }
    if (item.reviews.length > 0) {
      lines.push(
        `  - Recent Visitor Reviews: ${item.reviews
          .slice(0, 3)
          .map((r) => `(${r.rating}★) "${r.comment}"`)
          .join(' | ')}`
      );
    }
  }

  lines.push('\nDAGAT TA BAI SYSTEM WEBSITE PAGES, FEATURES & TEAM:');
  lines.push('  - What Dagat Ta Bai Is: A free coastal beach mapping, navigation, and travel guide web system for Barangay Binongkalan, Catmon, Cebu.');
  lines.push('  - Free Public Platform: Dagat Ta Bai is 100% free for beachgoers with no hidden fees, paywalls, or booking markups.');
  lines.push('  - Direct Contact (No Middleman): Visitors view verified rates, 360° virtual tours, live weather/tides, and GPS routes, then call/text resort caretakers directly.');
  lines.push('  - [Beaches Directory](/beaches): Shows verified entrance fees, cottage & room rates, operating hours, real-time Open/Closed status, amenities, activities, photos, 360° virtual tours, visitor reviews & star ratings, peak hours, beach rules, and resort contact numbers/Facebook.');
  lines.push('  - [Interactive Map](/map): Features GPS-verified beach pins along Barangay Binongkalan, Catmon, plus a route planner for Car, Motorcycle, Commute, and Walking with distance and estimated travel time.');
  lines.push('  - [Weather & Live Tides](/weather): Displays live Catmon temperature, wind speed, wave height, UV index, PAGASA heat index, 5-day weather forecast, and astronomical High Tide (taob) / Low Tide (hunas) schedules.');
  lines.push('  - User Accounts & Reviews ([Login](/login), [Register](/register), [Profile](/profile)): Visitors can sign up or log in (with email or Google) to save AI chat history, post star ratings and reviews on beaches, and manage their profile.');
  lines.push('  - [Beach Owner Registration](/apply) & [Owner Requirements](/owner-requirements): Resort owners/caretakers in Binongkalan can apply by submitting personal & resort details, a valid LGU Catmon Mayor/Business Permit, Proof of Ownership or Notarized Lease Contract, and live selfie KYC verification (reviewed in 1–3 business days). Approved owners get an Owner Portal to manage their beach info, cottages, facilities, posts, and reviews.');
  lines.push('  - Help, Contact & Feedback ([FAQ](/faq), [Contact](/contact), [Feedback](/feedback)): Visitors can read FAQs, report inaccurate rates or closed roads via the Contact page (or email dagattabai@gmail.com), or submit platform feedback.');
  lines.push('  - Policies ([Community Guidelines](/community-guidelines), [Privacy Policy](/privacy), [Terms of Service](/terms)): Covers review community guidelines, data privacy & data deletion requests, and terms of service.');
  lines.push('  - [Development Team](/about): Built by the Dagat Ta Bai team: Karel C. Bugwac, Ana Marie Q. Calo, Charisse V. Garbo, Patrick James D. Leswe, Julie Mae G. Matugas, Kimberly Claire M. Parot, Jessica C. Raganas, Jamaica Sulla, and Nathaniel James P. Tiro.');
  lines.push(`  - Total Platform Reviews in DB: ${snapshot.platformReviewsCount}`);

  return lines.join('\n');
}

/**
 * Checks if the user's question can be answered directly from the live System & Database records
 * when the AI endpoint is offline.
 */
export function scanSystemForDirectAnswer(
  userQuery: string,
  snapshot: SystemScanSnapshot,
  conversationHistory: { role: 'user' | 'assistant'; text: string }[] = []
): string | null {
  const q = userQuery.trim();
  const lower = q.toLowerCase();
  const lang = detectLanguage(q);
  const isCeb = lang === 'ceb';

  // Resolve target beach from query or recent conversation history
  let targetKeys = detectBeachesInText(q);
  if (targetKeys.length === 0 && conversationHistory.length > 0) {
    for (let i = conversationHistory.length - 1; i >= 0; i--) {
      const found = detectBeachesInText(conversationHistory[i].text);
      if (found.length === 1) {
        targetKeys = found;
        break;
      }
      if (conversationHistory[i].role === 'assistant' && found.length > 1) {
        const firstPara = detectBeachesInText(conversationHistory[i].text.split(/\n\s*\n/)[0] || '');
        if (firstPara.length === 1) {
          targetKeys = firstPara;
          break;
        }
      }
    }
  }

  const targetBeaches =
    targetKeys.length > 0
      ? snapshot.beaches.filter((b) => b.key && targetKeys.includes(b.key))
      : snapshot.beaches;

  // 1. LIVE "OPEN RIGHT NOW" / "ABLI BA KARON"
  if (
    /\b(open\s+right\s+now|open\s+now|open\s+today|still\s+open|currently\s+open|is\s+it\s+open\s+now|which\s+beaches?\s+are\s+open\s+now|abli\s+(ba\s+)?karon|abre\s+(ba\s+)?karon|sirado\s+(ba\s+)?karon|abli\s+pa\s+ba)\b/i.test(
      lower
    )
  ) {
    if (targetBeaches.length > 0) {
      const lines = targetBeaches.map((b) => {
        const st = b.openStatusNow.label || 'Check schedule';
        const detail = b.openStatusNow.detail ? ` (${b.openStatusNow.detail})` : '';
        return `• **${b.record.name}:** **${st}**${detail} — Schedule: ${b.formattedHours}`;
      });
      return isCeb
        ? `Mao kini ang real-time status sa pag-abli karon:\n\n${lines.join('\n')}`
        : `Here is the current operating status right now:\n\n${lines.join('\n')}`;
    }
  }

  // 2. LIVE TIDE SCHEDULE
  if (
    /\b(taob|hunas|tide|tides|high\s*tide|low\s*tide|water\s*level)\b/i.test(lower) &&
    snapshot.tides &&
    snapshot.tides.extremes.length > 0
  ) {
    const tideLines = snapshot.tides.extremes.slice(0, 4).map((t) => {
      const label =
        t.type === 'high'
          ? isCeb
            ? '**Taob (High Tide)**'
            : '**High Tide**'
          : isCeb
          ? '**Hunas (Low Tide)**'
          : '**Low Tide**';
      return `• ${label}: **${formatTideTimeManila(t.time)}** (${t.height.toFixed(2)} m)`;
    });
    return isCeb
      ? `Mao kini ang schedule sa **taob ug hunas** karon sa **Barangay Binongkalan, Catmon**:\n\n${tideLines.join('\n')}\n\n💡 **Timan-i:** Ang **Lite Bay Resort** ug **Majestique View Resort** dili mohunas ug pamaayo bisan low tide, samtang ang **Rañola Beach** ug **Hinagdan Beach** klaro ang paghunas.`
      : `Here is today's **high tide and low tide schedule** in **Barangay Binongkalan, Catmon**:\n\n${tideLines.join('\n')}\n\n💡 **Note:** **Lite Bay Resort** and **Majestique View Resort** stay relatively deep even during low tide, whereas **Rañola Beach** and **Hinagdan Beach** have noticeably exposed shorelines at low tide.`;
  }

  // 3. RATINGS & VISITOR REVIEWS
  if (
    /\b(rating|ratings|rated|highest\s+rated|top\s+rated|stars|star\s+rating|review|reviews|feedback|unsay\s+review|pila\s+ang\s+rating|unsay\s+rating|komento)\b/i.test(
      lower
    )
  ) {
    if (snapshot.beaches.length > 0) {
      const sorted = [...targetBeaches].sort((a, b) => b.record.averagerating - a.record.averagerating);
      const lines = sorted.map((b) => {
        const ratingStr =
          b.record.averagerating > 0
            ? `**${b.record.averagerating.toFixed(1)} / 5.0 ★** (${b.reviewCount} ${b.reviewCount === 1 ? 'review' : 'reviews'})`
            : isCeb
            ? 'Wala pay rating'
            : 'No ratings yet';
        const sampleReview =
          b.reviews.length > 0 && b.reviews[0].comment
            ? `\n  - Latest review: *"${b.reviews[0].comment}"* (${b.reviews[0].rating}★)`
            : '';
        return `• **${b.record.name}:** ${ratingStr}${sampleReview}`;
      });
      return isCeb
        ? `Mao kini ang **live ratings ug visitor reviews** gikan sa atong database:\n\n${lines.join('\n')}\n\nMakabasa ug makabutang sab ka og review sa matag beach page!`
        : `Here are the **live ratings and visitor reviews** from our database:\n\n${lines.join('\n')}\n\nYou can also read and post reviews directly on each beach's page!`;
    }
  }

  // 4. 360° VIRTUAL TOUR
  if (/\b(virtual\s+tour|360|360\s*view|360\s*degree|panorama|street\s*view)\b/i.test(lower)) {
    const withTour = snapshot.beaches.filter((b) => Boolean(b.record.virtualtoururl));
    if (withTour.length > 0) {
      const names = withTour.map((b) => `**${b.record.name}**`).join(', ');
      return isCeb
        ? `Oo! Sa atong sistema ug database, naay **360° Interactive Virtual Tour** nga makita para sa: ${names}. Pwede nimo kini ablihan sa ilang beach profile page o sa Interactive Map aron makita ang palibot sa beach sa dili pa ka moadto!`
        : `Yes! In our system and database, **360° Interactive Virtual Tours** are available for: ${names}. You can view the 360° tour directly on each beach's profile page or through the Interactive Map to explore the resort before visiting!`;
    }
  }

  // 5. PEAK HOURS / CROWD / BEST TIME TO VISIT
  if (
    /\b(peak\s+hour|peak\s+hours|peak\s+day|peak\s+days|best\s+time\s+to\s+(visit|go|swim)|crowded|busy\s+hours|daghan\s+tawo|daghang\s+tawo|kanus-a\s+nindot\s+iadto|kanus-a\s+mingaw)\b/i.test(
      lower
    )
  ) {
    const lines = targetBeaches
      .map((b) => {
        const parts: string[] = [];
        if (b.record.peakdays) parts.push(`Peak Days: **${b.record.peakdays}**`);
        if (b.record.peakhours) parts.push(`Peak Hours: **${b.record.peakhours}**`);
        if (b.record.bestvisitingtime) parts.push(`Best Time to Visit: **${b.record.bestvisitingtime}**`);
        if (parts.length === 0) return null;
        return `• **${b.record.name}:** ${parts.join(' · ')}`;
      })
      .filter(Boolean);

    if (lines.length > 0) {
      return isCeb
        ? `Mao kini ang **peak days/hours ug pinakanindot nga oras sa pagbisita**:\n\n${lines.join('\n')}`
        : `Here are the **peak days/hours and best visiting times**:\n\n${lines.join('\n')}`;
    }
    return isCeb
      ? `Sa Barangay Binongkalan, kasagaran daghan og bisita matag **Sabado ug Dominggo (weekends) ug holidays** gikan sa **9:00 AM hangtod 3:00 PM**. Kung gusto ka og mas mingaw ug bugnaw nga panahon, pinakanindot moadto sa **weekdays** o sayo sa buntag (**6:00 AM – 8:00 AM**).`
      : `In Barangay Binongkalan, the beaches are typically busiest on **weekends (Saturdays and Sundays) and holidays** between **9:00 AM and 3:00 PM**. For a quieter experience and cooler sun, the best time to visit is on **weekdays** or early in the morning (**6:00 AM – 8:00 AM**).`;
  }

  // 6. BEACH RULES & POLICIES
  if (/\b(rule|rules|policy|policies|regulations|bawal|gidili|balaod|guidelines\s+at)\b/i.test(lower)) {
    const lines = targetBeaches
      .map((b) => (b.record.rules ? `• **${b.record.name}:** ${b.record.rules}` : null))
      .filter(Boolean);
    if (lines.length > 0) {
      return isCeb
        ? `Mao kini ang **beach rules ug guidelines** sa atong database:\n\n${lines.join('\n')}`
        : `Here are the **beach rules and guidelines** in our database:\n\n${lines.join('\n')}`;
    }
  }

  // 7. RECENT POSTS / ANNOUNCEMENTS
  if (/\b(post|posts|announcement|announcements|latest\s+update|updates\s+from|news\s+from|bag-ong\s+post)\b/i.test(lower)) {
    const allPosts = targetBeaches.flatMap((b) =>
      b.posts.map((p) => `• **${b.record.name}:** "${p.caption}"`)
    );
    if (allPosts.length > 0) {
      return isCeb
        ? `Mao kini ang pinakabag-ong **posts ug updates** gikan sa mga beach:\n\n${allPosts.slice(0, 6).join('\n')}`
        : `Here are the latest **published posts and updates** from the beaches:\n\n${allPosts.slice(0, 6).join('\n')}`;
    }
  }

  // 8. LIVE WEATHER & 5-DAY FORECAST
  if (
    /\b(weather\s+now|current\s+weather|weather\s+today|weather|temperature|forecast|rain\s+today|wind\s+speed|uv\s+index|heat\s+index|panahon\s+karon|panahon|ulan\s+ba\s+karon|init\s+ba\s+karon)\b/i.test(
      lower
    ) &&
    snapshot.weather
  ) {
    const w = snapshot.weather;
    const wave = typeof w.waveHeight === 'number' ? `\n• **Wave Height:** **${w.waveHeight} m**` : '';
    const uv = typeof w.uvIndex === 'number' ? `\n• **UV Index:** **${w.uvIndex}**` : '';
    const heat = w.heatIndex ? `\n• **Heat Index:** **${w.heatIndex.heatIndexCelsius}°C (${w.heatIndex.category})**` : '';
    const forecastLines =
      w.dailyForecast && w.dailyForecast.length > 0
        ? `\n\n**Upcoming Forecast:**\n` +
          w.dailyForecast
            .slice(0, 3)
            .map(
              (d) =>
                `• **${d.date}:** ${d.conditionLabel} (${Math.round(d.low)}°C–${Math.round(d.high)}°C, Rain chance: ${d.precipitationProbability ?? 0}%)`
            )
            .join('\n')
        : '';
    if (isCeb) {
      return `Mao kini ang **Live Weather Status sa Barangay Binongkalan, Catmon** karon:\n• **Temperatura:** **${Math.round(w.temperature)}°C (${w.conditionLabel})**\n• **Hangin (Wind Speed):** **${Math.round(w.windSpeed)} km/h**\n• **Humidity:** **${w.relativeHumidity}%**${wave}${uv}${heat}${forecastLines}`;
    }
    return `Here is the **Live Weather Status in Barangay Binongkalan, Catmon** right now:\n• **Temperature:** **${Math.round(w.temperature)}°C (${w.conditionLabel})**\n• **Wind Speed:** **${Math.round(w.windSpeed)} km/h**\n• **Humidity:** **${w.relativeHumidity}%**${wave}${uv}${heat}${forecastLines}`;
  }

  // 9. SYSTEM WEBSITE PAGES, FEATURES, ACCOUNT, MAP, CONTACT, TEAM & OWNER APPLICATION
  if (
    /\b(apply\s+as\s+(an?\s+)?owner|register\s+(a\s+|my\s+)?(beach|resort)|beach\s+owner\s+application|kyc|business\s+permit|owner\s+requirements|is\s+dagat\s+ta\s+bai\s+free|unsaon\s+pag\s*apply\s+sa\s+owner|unsaon\s+pag\s*rehistro\s+og\s+beach)\b/i.test(
      lower
    )
  ) {
    if (isCeb) {
      return `Sa atong sistema (**Dagat Ta Bai**):\n• **Libre para sa tanan:** 100% libre gamiton ang Dagat Ta Bai para sa mga beachgoers.\n• **Pag-apply isip Beach Owner:** Ang mga tag-iya o caretaker sa beach sa Binongkalan pwede mo-apply sa [Apply page](/apply) pinaagi sa pag-submit sa ilang detalye, **Mayor's / Business Permit (LGU Catmon)**, **Proof of Ownership o Lease Contract**, ug **live selfie KYC verification** (i-review sulod sa 1–3 ka adlaw).`;
    }
    return `In our **Dagat Ta Bai** system:\n• **100% Free for Visitors:** Dagat Ta Bai is completely free to use with no hidden fees or booking markups.\n• **Beach Owner Registration:** Resort owners and caretakers in Barangay Binongkalan can register via the [Apply page](/apply) by submitting establishment details, a valid **LGU Catmon Business Permit**, **Proof of Ownership or Lease Contract**, and completing the **live selfie KYC verification** (reviewed within 1–3 business days).`;
  }

  if (
    /\b(website|system|dagat\s*ta\s*bai|platform|app|feature|features|map\s+page|interactive\s+map|how\s+to\s+use|about\s+this|who\s+(made|built|created)\s+this|team|developers|contact\s+(support|us|admin)|email|feedback|privacy|terms|community\s+guidelines|login|sign\s+in|register|create\s+account|account|profile|book\s+online|online\s+booking|pay\s+online)\b/i.test(
      lower
    )
  ) {
    if (/\b(who\s+(made|built|created)|team|developers|about)\b/i.test(lower)) {
      return isCeb
        ? `Ang **Dagat Ta Bai** usa ka libre nga beach mapping ug travel guide website para sa **Barangay Binongkalan, Catmon, Cebu**. Gihimo kini sa team nila ni **Karel C. Bugwac, Ana Marie Q. Calo, Charisse V. Garbo, Patrick James D. Leswe, Julie Mae G. Matugas, Kimberly Claire M. Parot, Jessica C. Raganas, Jamaica Sulla, ug Nathaniel James P. Tiro**. Makita sab nimo ang dugang detalye sa [About page](/about).`
        : `**Dagat Ta Bai** is a free coastal beach mapping and travel guide website for **Barangay Binongkalan, Catmon, Cebu**. It was developed by **Karel C. Bugwac, Ana Marie Q. Calo, Charisse V. Garbo, Patrick James D. Leswe, Julie Mae G. Matugas, Kimberly Claire M. Parot, Jessica C. Raganas, Jamaica Sulla, and Nathaniel James P. Tiro**. You can learn more on our [About page](/about).`;
    }
    if (/\b(book\s+online|online\s+booking|pay\s+online)\b/i.test(lower)) {
      return isCeb
        ? `Ang **Dagat Ta Bai** usa ka informational ug navigational guide website—walay online booking o online payment sa website. Among gipakita ang verified rates ug contact numbers sa matag beach aron makatawag o maka-text ka diretso sa resort caretaker.`
        : `**Dagat Ta Bai** operates as a free informational and navigational guide rather than an online booking middleman, so payments and reservations are not processed on the website. Instead, we provide verified rates and contact numbers so you can contact the resort caretakers directly.`;
    }
    if (/\b(contact\s+(support|us|admin)|email|feedback|report)\b/i.test(lower)) {
      return isCeb
        ? `Pwede ka mokontak sa among team pinaagi sa [Contact page](/contact) o mag-email sa **dagattabai@gmail.com** aron mo-report og sayop nga presyo, sirado nga dalan, o laing concern. Pwede sab ka mohatag og platform feedback sa [Feedback page](/feedback).`
        : `You can reach our team anytime through the [Contact page](/contact) or by emailing **dagattabai@gmail.com** to report inaccurate rates, closed roads, or other concerns. You can also share suggestions on our [Feedback page](/feedback).`;
    }
    if (/\b(login|sign\s+in|register|create\s+account|account|profile)\b/i.test(lower)) {
      return isCeb
        ? `Pwede ka mag-create og account sa [Register page](/register) o mo-sign in sa [Login page](/login) gamit ang email o Google. Kung naka-login ka, ma-save ang imong **AI chat history** ug makabutang ka og **star ratings ug reviews** sa mga beach!`
        : `You can create an account on the [Register page](/register) or sign in on the [Login page](/login) using your email or Google. Signing in lets you save your **AI chat history** and post **star ratings and reviews** for the beaches!`;
    }
    return isCeb
      ? `Ang **Dagat Ta Bai** usa ka libre nga website para sa pagsuroy sa **4 ka verified beaches sa Barangay Binongkalan, Catmon, Cebu**. Mao kini ang mga feature sa sistema:\n• **[Beaches Directory](/beaches):** Presyo sa entrance, cottages, kwarto, oras sa pag-abli, 360° virtual tours, ug reviews.\n• **[Interactive Map](/map):** GPS beach pins ug route planner (car, motor, commute, o walking).\n• **[Weather & Tides](/weather):** Live weather, 5-day forecast, ug schedule sa taob/hunas.\n• **[Beach Owner Application](/apply):** Pagparehistro sa mga tag-iya og beach resort.\n• **Bai AI Guide:** Chat assistant para sa beaches, commute, ug sistema.`
      : `**Dagat Ta Bai** is a 100% free coastal beach mapping and travel guide website for **Barangay Binongkalan, Catmon, Cebu**. Here is what you can do on the system:\n• **[Beaches Directory](/beaches):** Browse verified entrance fees, cottage & room rates, real-time open/closed status, 360° virtual tours, and visitor reviews.\n• **[Interactive Map](/map):** View GPS-verified beach pins and plan routes by car, motorcycle, commute, or walking.\n• **[Weather & Tides](/weather):** Check live weather, wave height, 5-day forecasts, and high/low tide schedules.\n• **User Accounts ([Login](/login) & [Register](/register)):** Sign in to save AI chat history and post beach reviews.\n• **[Beach Owner Application](/apply):** Resort owners can apply to list and manage their beach.`;
  }

  // 10. DYNAMIC FULL-TEXT MATCH ACROSS DATABASE DESCRIPTIONS, COTTAGES, FACILITIES & AMENITIES
  const stopWords = new Set([
    'what', 'which', 'where', 'when', 'who', 'whom', 'whose', 'why', 'how',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
    'do', 'does', 'did', 'can', 'could', 'will', 'would', 'shall', 'should',
    'may', 'might', 'must', 'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'about', 'into', 'through', 'during', 'before',
    'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then',
    'once', 'here', 'there', 'all', 'any', 'both', 'each', 'few', 'more',
    'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same',
    'so', 'than', 'too', 'very', 'tell', 'me', 'you', 'your', 'please', 'bai',
    'beach', 'beaches', 'resort', 'resorts', 'binongkalan', 'catmon', 'cebu',
    'ranola', 'rañola', 'raniola', 'lite', 'bay', 'litebay', 'majestique', 'majestic', 'hinagdan',
    'unsa', 'unsay', 'asa', 'asay', 'naa', 'naay', 'wala', 'walay', 'ang', 'sa', 'mga', 'ba', 'ni', 'na', 'nga', 'ug', 'og', 'ka', 'ko',
  ]);

  const queryKeywords = lower
    .replace(/[^\w\sñ]/gi, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !stopWords.has(w));

  if (queryKeywords.length > 0) {
    const matchedSnippets: string[] = [];

    for (const b of targetBeaches) {
      const beachSnippets: string[] = [];

      // Check cottages in DB
      for (const c of b.cottages) {
        const hay = `${c.name} ${c.description} ${c.capacity || ''}`.toLowerCase();
        if (queryKeywords.some((kw) => hay.includes(kw))) {
          beachSnippets.push(
            `Cottage: **${c.name}**${c.price ? ` (${c.price})` : ''}${c.capacity ? ` — Capacity: ${c.capacity}` : ''}${c.description ? ` — ${c.description}` : ''}`
          );
        }
      }

      // Check facilities in DB
      for (const f of b.facilities) {
        const hay = `${f.name} ${f.category} ${f.description} ${f.ratesText}`.toLowerCase();
        if (queryKeywords.some((kw) => hay.includes(kw))) {
          beachSnippets.push(
            `Facility/Amenity: **${f.name}**${f.price ? ` (${f.price})` : ''}${f.ratesText ? ` [${f.ratesText}]` : ''}${f.description ? ` — ${f.description}` : ''}`
          );
        }
      }

      // Check activities & amenities arrays
      const matchedActs = b.record.activities.filter((act) =>
        queryKeywords.some((kw) => act.toLowerCase().includes(kw))
      );
      if (matchedActs.length > 0) {
        beachSnippets.push(`Activities: **${matchedActs.join(', ')}**`);
      }

      const matchedAmens = b.record.amenities.filter((am) =>
        queryKeywords.some((kw) => am.toLowerCase().includes(kw))
      );
      if (matchedAmens.length > 0) {
        beachSnippets.push(`Amenities: **${matchedAmens.join(', ')}**`);
      }

      if (beachSnippets.length > 0) {
        matchedSnippets.push(`• **${b.record.name}:**\n  - ${beachSnippets.slice(0, 4).join('\n  - ')}`);
      }
    }

    if (matchedSnippets.length > 0) {
      return isCeb
        ? `Mao kini ang mga detalye para sa imong gipangutana:\n\n${matchedSnippets.join('\n\n')}`
        : `Here are the details for what you asked about:\n\n${matchedSnippets.join('\n\n')}`;
    }
  }

  return null;
}
