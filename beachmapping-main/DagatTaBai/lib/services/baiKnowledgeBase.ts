/**
 * Verified Barangay Binongkalan, Catmon, Cebu Beach Resort Knowledge Base
 * 4 Official Verified Beaches:
 * 1. Rañola Beach (Raniola)
 * 2. Lite Bay Resort (Litebay)
 * 3. Majestique Beach
 * 4. Hinagdan Beach (Hinagdan)
 *
 * Fully supports Bisaya and English questions (both specific per-beach and broad questions).
 */

export const VERIFIED_BINONGKALAN_KNOWLEDGE_CONTEXT = `
OFFICIAL VERIFIED BEACH RESORTS IN BARANGAY BINONGKALAN, CATMON, CEBU:
(Only 4 verified beaches: Rañola Beach, Lite Bay Resort, Majestique Beach, and Hinagdan Beach)

GENERAL RULES & SPECIFIC ANSWERS FOR BARANGAY BINONGKALAN BEACHES:

1. PINAKADUOL NA BEACH / NEAREST BEACH:
   - Kung gikan sa SOUTH (Cebu City, Talamban, Mandaue, Lapu-Lapu, Consolacion, Liloan, Compostela, Danao, Carmen, Talisay, Minglanilla, Naga, Carcar, Toledo, etc.):
     • Pinakaduol nga beach: Rañola Beach (Raniola) ang unang maagian.
     • Pagkasunod-sunod: Rañola Beach ➔ Lite Bay Resort ➔ Majestique Beach ➔ Hinagdan Beach.
   - Kung gikan sa NORTH (Sogod, Borbon, Tabogon, Bogo City, San Remigio, Medellin, Daanbantayan, Maya, Tabuelan, Tuburan, etc.):
     • Pinakaduol nga beach: Hinagdan Beach ang unang maagian.
     • Pagkasunod-sunod: Hinagdan Beach ➔ Majestique Beach ➔ Lite Bay Resort ➔ Rañola Beach.
   - Broad ("Unsay pinakaduol na beach?"):
     • If sa South gikan: Rañola Beach ang pinakaduol.
     • If sa North gikan: Hinagdan Beach ang pinakaduol.

2. BATOON BA O DILI / ROCKY SHORELINE:
   - Rañola Beach (Raniola): Batoon gamay (slightly rocky with small pebbles/stones).
   - Lite Bay Resort: Batoon gamay (slightly rocky).
   - Majestique Beach: Dili ra batoon (not rocky).
   - Hinagdan Beach: Dili batoon (sand/balas — natural sandy shoreline).
   - Broad ("Asay batoon na beach?"): Rañola ug Lite Bay kay batoon gamay, samtang ang Majestique dili ra batoon, ug ang Hinagdan kay dili batoon (balas).

3. SUGBAANAN / GRILLING AREA:
   - Rañola Beach: Naay sugbaanan.
   - Lite Bay Resort: Naay sugbaanan.
   - Majestique Beach: Naay sugbaanan.
   - Hinagdan Beach: Naay sugbaanan.
   - Broad ("Asa na beach ang naay sugbaanan?"): Naay sugbaanan ang tanang 4 ka beach (Rañola, Lite Bay, Majestique, Hinagdan).

4. PINAKA-SAFE NA BEACH / SAFE BA NI:
   - Asay pinaka-safe: Rañola Beach (Raniola) kay pinaka-safe labi na para sa mga bata (children) ug senior citizens tungod kay accessible ug dili dali molawm.
   - Safe ba ang matag beach: Oo, safe maligo ang tanang 4 ka beach. Palihug tan-awa sab ang Live Weather / Tide update sa website sa dili pa maligo.

5. LIFEGUARD:
   - Specific ("Naa bay lifeguard ang kani na beach?"): Walay lifeguard sa kani nga beach (walay lifeguard ang mga beach diri sa Binongkalan, apan naay maabangan nga life jackets ug salbabida).
   - Broad ("Naa bay lifeguard ang mga beach?"): Walay lifeguard ang mga beach (walay lifeguard sa tanang 4 ka beach).

6. STORE / FOODS / KARNE:
   - Specific ("Naa bay store or foods sa kani na beach?"): Yes naa ray store and foods ug naa rasad nearby stores daplin sa highway, pero walay mga baligya nga karne/meat (palit daan og karne sa merkado kung magplano magsugba).
   - Broad ("Naa bay store or foods ang mga beach?"): Yes, naay stores and foods sa tanang beach ug nearby stores sa highway, apan walay baligya nga karne/meat.

7. SHOWER / KALIGOAN:
   - Specific ("Naa bay shower ang kani na beach?"): Yes naa ray shower / kaligoan para banlaw ug himasa.
   - Broad ("Naa bay shower ang mga beach?"): Yes, naay shower ang tanang 4 ka beach (Rañola, Lite Bay, Majestique, Hinagdan).

8. COMMUTE / UNSON PAG-ADTO:
   - Step-by-step commute guide gikan sa nagkalain-laing lugar sa Cebu padulong sa specific nga beach subay sa Cebu North National Highway sa Brgy. Binongkalan, Catmon.

9. ACCESSIBLE SA MGA SENIOR CITIZEN:
   - Rañola Beach (Raniola): Yes, accessible sa senior citizens (patag ug dali rang lakton gikan sa highway).
   - Lite Bay Resort, Majestique Beach, Hinagdan Beach: Dili accessible sa senior citizens tungod kay daghan ug hagdanan, maglisod ang mga senior.
   - Broad ("Accessible ba sa mga senior citizen?"): Rañola ra ang yes accessible sa seniors; the rest of the beaches (Lite Bay, Majestique, Hinagdan) are not accessible since daghan ug hagdanan, maglisod ang mga senior.

10. SINKHOLE:
    - Rañola Beach: Naay sinkhole pero layo ra sa swimming area (safe ra maligo sa duol).
    - Lite Bay Resort: Naa pero layo ra sad.
    - Majestique Beach: Wala.
    - Hinagdan Beach: Wala.
    - Broad ("Are there any sinkholes in any of the beaches?"): Rañola naay sinkhole pero layo ra, Lite Bay naa pero layo ra sad, Majestique wala, Hinagdan wala.

11. DALI MOLAWM / DEPTH:
    - Lite Bay Resort: Dali molawm kay dili siya mohunas ug pamaayo.
    - Majestique Beach: Dali molawm kay dili siya mohunas ug pamaayo.
    - Rañola Beach: Dili ra dali molawm (gradual slope).
    - Hinagdan Beach: Dili ra dali molawm (gradual slope ug balas).
    - Broad ("Asa na beaches ang dali molawm?"): Lite Bay ug Majestique dali ra molawm tungod kay dili sila mohunas ug pamaayo; samtang ang Rañola ug Hinagdan dili ra dali molawm.

12. PETS / MAGDALA OG HAYOP:
    - Specific ("Pwede magda ug pets sa ari na beach?"): Yes, pwede ra magdala og pets.
    - Broad ("Pwede magda ug pets?"): Yes, pwede magdala og pets sa tanang 4 ka beach (Rañola, Lite Bay, Majestique, Hinagdan).

13. TAOB OR HUNAS / TIDE STATUS:
    - Specific ug Broad: Refer sa Live Tide Status sa Weather section diri sa among website (nga nagpakita sa real-time high tide ug low tide). Timan-i nga ang Lite Bay ug Majestique kay dili mohunas ug pamaayo bisan low tide.

DETAILED BEACH PROFILES:

1. RAÑOLA BEACH (RANIOLA)
- Location: Barangay Binongkalan, Catmon, Cebu (Along Cebu North National Highway)
- Contact Numbers: 0935-724-1824 / 0960-326-7698
- Facebook: Yes (official Facebook page exists)
- Operating Hours: 6:00 AM – 7:00 PM, open every day (Monday to Sunday). Overnight tent camping is allowed.
- Entrance Fee: ₱20 per person (with cottage) | ₱30 per person (without cottage). Overnight is same rate.
- Cottage Rates: Small Cottage: ₱500 | Middle Cottage: ₱2,000 | Side Big Cottage (30 persons): ₱2,500
- Rooms & Overnight: No rooms; overnight tent camping is allowed at regular rate.
- Batoon ba o dili: Batoon gamay.
- Sugbaanan: Naay sugbaanan.
- Pinaka-safe: Yes, Rañola is the safest beach (safe for children and seniors).
- Lifeguard: Walay lifeguard (salbabida available for rent ₱30).
- Store & Foods: Naay store and foods ug nearby stores, pero walay baligya nga meat.
- Shower: Naay shower (₱10 ligo/shower, ₱5 ihi).
- Senior Citizen: Yes, accessible sa senior citizens (patag ug walay daghang hagdanan).
- Sinkhole: Naay sinkhole pero layo ra sa swimming area.
- Dali molawm: Dili ra dali molawm.
- Pets: Pwede magdala og pets.
- Parking: ₱50 Car | ₱20 Motorcycle.

2. LITE BAY RESORT
- Location: Barangay Binongkalan, Catmon, Cebu (Along Cebu North National Highway)
- Contact Number: 0953-411-7454
- Operating Hours: Sunday–Thursday: 6:00 AM – 8:00 PM | Friday: 6:00 AM – 5:00 PM | CLOSED every Saturday.
- Entrance Fee: ₱50 per person.
- Cottage & Table Rates: Table: ₱300 | Cottage: ₱800 | Large Space: ₱1,000.
- Rooms & Overnight: No rooms, no overnight (Day use only).
- Batoon ba o dili: Batoon gamay.
- Sugbaanan: Naay sugbaanan.
- Safe: Safe maligo (mag-amping lang kay dali molawm).
- Lifeguard: Walay lifeguard (kayak ₱200/2hrs, life jacket ₱50 for rent).
- Store & Foods: Naay snacks/foods ug nearby stores daplin sa highway, pero walay baligya nga meat.
- Shower: Naay shower (FREE Restroom & Shower).
- Senior Citizen: Dili accessible sa senior citizens kay daghan ug hagdanan.
- Sinkhole: Naay sinkhole pero layo ra sad.
- Dali molawm: Dali molawm kay dili mohunas ug pamaayo.
- Pets: Pwede magdala og pets.
- Parking: FREE (Walay bayad).

3. MAJESTIQUE BEACH
- Location: Barangay Binongkalan, Catmon, Cebu (Along Cebu North National Highway)
- Contact Number: 0943-622-7972
- Operating Hours: Day Use: 7:00 AM – 5:00 PM | Overnight: 6:00 PM – 6:00 AM (Open every day).
- Entrance Fee: ₱30 per person (with or without cottage).
- Cottage Rates: Day Cottages: ₱500–₱1,000 | Overnight Cottages: ₱800–₱1,200.
- Rooms & Overnight: Regular Room: ₱2,000 | Aircon Room: ₱3,500.
- Batoon ba o dili: Dili ra batoon.
- Sugbaanan: Naay sugbaanan.
- Safe: Safe maligo (mag-amping kay dali molawm).
- Lifeguard: Walay lifeguard (life jacket rental ₱50).
- Store & Foods: Naay store and foods ug nearby stores, pero walay baligya nga meat.
- Shower: Naay shower (₱10 rinse/himasa).
- Senior Citizen: Dili accessible sa senior citizens kay daghan ug hagdanan.
- Sinkhole: Wala (Walay sinkhole).
- Dali molawm: Dali molawm kay dili mohunas ug pamaayo.
- Pets: Pwede magdala og pets.
- Parking: FREE (Walay bayad).

4. HINAGDAN BEACH
- Location: Barangay Binongkalan, Catmon, Cebu (Along Cebu North National Highway)
- Contact Numbers: 0975-086-2570 / 0963-654-0904 / 0926-234-5373
- Operating Hours: Day Use: 6:00 AM – 7:00 PM | Overnight: Open whole night (Open every day).
- Entrance Fee: Day with cottage: ₱30 | Day without cottage: ₱50 | Overnight: ₱50.
- Cottage Rates: Day Cottage: ₱600 | Overnight Cottage: ₱700.
- Rooms & Overnight: Short-Time Room (3 hrs): ₱250 | Ordinary Room: ₱1,000 | Aircon Room: ₱2,500.
- Batoon ba o dili: Dili batoon (Sand / Balas — sandy shoreline).
- Sugbaanan: Naay sugbaanan.
- Safe: Safe kaayo maligo (sandy ug gradual).
- Lifeguard: Walay lifeguard (salbabida ₱50, standard life jacket ₱50, premium life jacket ₱100).
- Store & Foods: Naay store and foods ug nearby stores, pero walay baligya nga meat.
- Shower: Naay shower / kaligoan.
- Senior Citizen: Dili accessible sa senior citizens kay daghan ug hagdanan.
- Sinkhole: Wala (Walay sinkhole).
- Dali molawm: Dili ra dali molawm.
- Pets: Pwede magdala og pets.
- Parking: Not listed in database.
- Senior Citizen: Dili accessible sa senior citizens kay daghan ug hagdanan.
- Sinkhole: Wala (Walay sinkhole).
- Dali molawm: Dili ra dali molawm.
- Pets: Pwede magdala og pets.
- Parking: Not listed in database.
`.trim();

export interface QuickPromptQuestion {
  label: string;
  question: string;
}

export const BAI_SUGGESTED_QUESTIONS: QuickPromptQuestion[] = [
  { label: 'Nearest beach?', question: 'Which beach is the nearest?' },
  { label: 'Entrance & cottage fees?', question: 'What are the entrance and cottage fees?' },
  { label: 'Safest beach?', question: 'Which beach is the safest?' },
  { label: 'Rocky or sandy?', question: 'Are the beaches rocky or sandy?' },
];

export type BeachKey = 'ranola' | 'litebay' | 'majestique' | 'hinagdan';

interface StructuredBeachData {
  key: BeachKey;
  name: string;
  aliases: string[];
  contact: string;
  hoursEn: string;
  hoursCeb: string;
  entranceEn: string;
  entranceCeb: string;
  cottagesEn: string;
  cottagesCeb: string;
  roomsEn: string;
  roomsCeb: string;
  // Specific requested topics
  batoonCeb: string;
  batoonEn: string;
  sugbaCeb: string;
  sugbaEn: string;
  safeCeb: string;
  safeEn: string;
  lifeguardCeb: string;
  lifeguardEn: string;
  storeCeb: string;
  storeEn: string;
  showerCeb: string;
  showerEn: string;
  seniorCeb: string;
  seniorEn: string;
  sinkholeCeb: string;
  sinkholeEn: string;
  molawmCeb: string;
  molawmEn: string;
  petsCeb: string;
  petsEn: string;
  tideCeb: string;
  tideEn: string;
  parkingCeb: string;
  parkingEn: string;
  restroomCeb: string;
  restroomEn: string;
}

const BEACH_DATA: Record<BeachKey, StructuredBeachData> = {
  ranola: {
    key: 'ranola',
    name: 'Rañola Beach (Raniola)',
    aliases: ['rañola', 'ranola', 'raniola'],
    contact: '0935-724-1824 or 0960-326-7698',
    hoursEn: '**6:00 AM to 7:00 PM**, open every day (Monday to Sunday). Overnight tent camping is allowed.',
    hoursCeb: '**6:00 AM hangtod 7:00 PM**, abli kada adlaw (Lunes hangtod Dominggo). Pwede sab mag-overnight tent camping.',
    entranceEn: '**₱20 per person** (with cottage) or **₱30 per person** (without cottage). Overnight is the same price.',
    entranceCeb: '**₱20 kada tawo** (kung naay cottage) o **₱30 kada tawo** (kung walay cottage). Mao ra gihapon ang presyo sa overnight.',
    cottagesEn: '**₱500** for small cottage, **₱2,000** for middle cottage, and **₱2,500** for the big 30-person side cottage.',
    cottagesCeb: '**₱500** sa small cottage, **₱2,000** sa middle cottage, ug **₱2,500** sa dako nga side cottage (good for 30 persons).',
    roomsEn: 'No rooms, but overnight **tent camping** is allowed at the regular rate.',
    roomsCeb: 'Walay kwarto (rooms), pero pwede mag-overnight ug magdala og kaugalingong **tent** sa regular nga presyo.',
    batoonCeb: 'Ang **Rañola Beach (Raniola)** kay **batoon gamay** (natural coastal beach nga naay ginagmay nga bato/pebbles).',
    batoonEn: '**Rañola Beach (Raniola)** is **slightly rocky** with small natural pebbles and stones.',
    sugbaCeb: 'Oo, **naay sugbaanan** sa **Rañola Beach (Raniola)**.',
    sugbaEn: 'Yes, **Rañola Beach (Raniola)** has a designated **grilling area**.',
    safeCeb: 'Oo, **safe kaayo maligo sa Rañola Beach (Raniola)**, ug kini sab ang **pinaka-safe nga beach labi na para sa mga bata (children) ug senior citizens** tungod kay accessible ug dili dali molawm. Palihug tan-awa sab ang Live Weather update sa among website sa dili pa maligo.',
    safeEn: 'Yes, **Rañola Beach (Raniola) is safe for swimming**, and it is considered the **safest beach especially for children and seniors** because it is flat, accessible, and does not get deep quickly. Please check our website Live Weather update before swimming.',
    lifeguardCeb: '**Walay lifeguard** sa **Rañola Beach (Raniola)** (walay lifeguard ang mga beach diri sa Binongkalan), pero naay maabangan nga salbabida gikan sa magsuroy-suroy tag **₱30**.',
    lifeguardEn: 'There is **no lifeguard** at **Rañola Beach (Raniola)** (none of the beaches in Binongkalan have on-duty lifeguards), but **floaters** are available for rent from roving vendors for **₱30**.',
    storeCeb: 'Oo, **naay store ug foods** sa **Rañola Beach (Raniola)** ug naa rasad mga tindahan sa duol daplin sa highway, pero **walay mga baligya nga karne (meat)**. Palit daan og karne sa merkado kung magplano mong magsugba.',
    storeEn: 'Yes, there are **stores and food** at **Rañola Beach (Raniola)** and nearby stores along the highway, but **they do not sell raw meat**. Please buy meat from the market in advance if you plan to grill.',
    showerCeb: 'Oo, **naay shower / kaligoan** sa **Rañola Beach (Raniola)** (₱10 ang shower/kaligo, ₱5 ang ihi).',
    showerEn: 'Yes, **Rañola Beach (Raniola) has showers** and rinse facilities (₱10 for shower/bath, ₱5 for restroom).',
    seniorCeb: 'Oo, **accessible sa mga senior citizen ang Rañola Beach (Raniola)** kay patag kini ug dali rang sudlon gikan sa highway nga walay lisod nga mga hagdanan.',
    seniorEn: 'Yes, **Rañola Beach (Raniola) is accessible for senior citizens** because the ground is flat and easy to enter from the highway without steep stairs.',
    sinkholeCeb: 'Oo, **naay sinkhole sa Rañola Beach pero layo ra** kaayo sa swimming area, busa luwas ug safe ra maligo sa duol.',
    sinkholeEn: 'Yes, there is a **sinkhole at Rañola Beach, but it is located far out** from the swimming area, so swimming near the shore is safe.',
    molawmCeb: '**Dili ra dali molawm ang Rañola Beach (Raniola)**; hinay-hinay ra ang paglawm (gradual depth), busa mas safe sa mga bata.',
    molawmEn: '**Rañola Beach (Raniola) does not get deep quickly**; the shoreline depth is gradual and safer for kids.',
    petsCeb: 'Oo, **pwede kaayo magdala og pets** sa **Rañola Beach (Raniola)**! Palihug lang og bantay sa inyong binuhi ug tipigi ang kalimpyo sa palibot.',
    petsEn: 'Yes, **pets are allowed** at **Rañola Beach (Raniola)**! Please supervise your pets and keep the surroundings clean.',
    tideCeb: 'Para sa kahimtang sa taob (high tide) o hunas (low tide) sa **Rañola Beach (Raniola)**, palihug **i-refer ang Live Tide Status sa Weather section** diri sa among website para sa eksaktong oras sa taob ug hunas karong adlawa. Klaro sab kaayo ang paghunas sa Rañola.',
    tideEn: 'To check if it is high tide or low tide at **Rañola Beach (Raniola)**, please **refer to the Live Tide Status in the Weather section** on our website for today’s exact schedule. Rañola has a noticeably exposed shoreline during low tide.',
    parkingCeb: '**₱50** sa sakyanan (car) ug **₱20** sa motor.',
    parkingEn: '**₱50** for cars and **₱20** for motorcycles.',
    restroomCeb: '**₱5** sa ihi ug **₱10** sa kaligo / shower.',
    restroomEn: '**₱5** for restroom use and **₱10** for shower / bath.',
  },

  litebay: {
    key: 'litebay',
    name: 'Lite Bay Resort',
    aliases: ['lite bay', 'litebay', 'light bay'],
    contact: '0953-411-7454',
    hoursEn: '**6:00 AM to 8:00 PM** (Sunday–Thursday), **6:00 AM to 5:00 PM** (Friday), and **CLOSED every Saturday**.',
    hoursCeb: '**6:00 AM hangtod 8:00 PM** (Dominggo–Huwebes), **6:00 AM hangtod 5:00 PM** (Biyernes), ug **SIRADO kada Sabado**.',
    entranceEn: '**₱50 per person**.',
    entranceCeb: '**₱50 kada tawo**.',
    cottagesEn: '**₱300** for a table, **₱800** for a cottage, and **₱1,000** for a large space.',
    cottagesCeb: '**₱300** sa table, **₱800** sa cottage, ug **₱1,000** sa dako nga space.',
    roomsEn: 'No rooms and no overnight stays (Day use only).',
    roomsCeb: 'Walay kwarto ug walay overnight (day use ra sila).',
    batoonCeb: 'Ang **Lite Bay Resort** kay **batoon gamay** (natural coastal beach nga naay ginagmay nga bato).',
    batoonEn: '**Lite Bay Resort** is **slightly rocky** with small natural pebbles and stones.',
    sugbaCeb: 'Oo, **naay sugbaanan** sa **Lite Bay Resort**.',
    sugbaEn: 'Yes, **Lite Bay Resort** has a designated **grilling area**.',
    safeCeb: 'Oo, **safe maligo sa Lite Bay Resort**, mag-amping lang gamay tungod kay medyo dali kini molawm. Naay maabangan nga life jackets tag **₱50**. Palihug tan-awa sab ang Live Weather update sa website sa dili pa maligo.',
    safeEn: 'Yes, **Lite Bay Resort is safe for swimming**, just take extra care as it gets deep quickly. Life jackets are available for rent for **₱50**. Please check the website Live Weather update before swimming.',
    lifeguardCeb: '**Walay lifeguard** sa **Lite Bay Resort** (walay lifeguard ang mga beach sa Binongkalan), pero naay abangan nga **life jackets (₱50)** ug **kayak (₱200 sa 2 ka oras)**.',
    lifeguardEn: 'There is **no lifeguard** at **Lite Bay Resort** (no lifeguards at any Binongkalan beach), but **life jackets (₱50)** and **kayaks (₱200 for 2 hrs)** are available for rent.',
    storeCeb: 'Oo, **naay snacks ug foods** sa **Lite Bay Resort** ug naa ray mga tindahan sa duol daplin sa highway, pero **walay mga baligya nga karne (meat)**. Palit daan og karne sa merkado kung magplano mong magsugba.',
    storeEn: 'Yes, there are **snacks and food** at **Lite Bay Resort** and nearby stores along the highway, but **they do not sell raw meat**. Please buy meat in advance from the market if you plan to grill.',
    showerCeb: 'Oo, **naay shower / kaligoan** sa **Lite Bay Resort** (ug **LIBRE / walay bayad** ang ilang CR ug shower).',
    showerEn: 'Yes, **Lite Bay Resort has showers** and restrooms (and both are **FREE of charge**).',
    seniorCeb: '**Dili accessible sa mga senior citizen ang Lite Bay Resort** kay **daghan kini ug hagdanan** paubos sa dagat, busa maglisod ang mga senior.',
    seniorEn: '**Lite Bay Resort is not accessible for senior citizens** because there are **many steep stairs** leading down to the beach, making it difficult for seniors.',
    sinkholeCeb: 'Oo, **naay sinkhole sa Lite Bay Resort pero layo ra sad** sa swimming area, busa luwas ug safe ra maligo duol sa baybayon.',
    sinkholeEn: 'Yes, there is a **sinkhole at Lite Bay Resort, but it is also far out** from the swimming area, so swimming near the shore is safe.',
    molawmCeb: 'Oo, **dali molawm ang Lite Bay Resort** tungod kay **dili kini mohunas ug pamaayo** bisan kung low tide.',
    molawmEn: 'Yes, **Lite Bay Resort gets deep quickly** because the water does not recede deeply even during low tide.',
    petsCeb: 'Oo, **pwede kaayo magdala og pets** sa **Lite Bay Resort**! Palihug lang og bantay sa inyong binuhi ug tabangi ang pagmintinar sa kalimpyo.',
    petsEn: 'Yes, **pets are allowed** at **Lite Bay Resort**! Please supervise your pets and help maintain cleanliness.',
    tideCeb: 'Para sa kahimtang sa taob o hunas sa **Lite Bay Resort**, palihug **i-refer ang Live Tide Status sa Weather section** diri sa among website. Timan-i sab nga ang Lite Bay kay **dili mohunas ug pamaayo** bisan kung low tide.',
    tideEn: 'To check if it is high tide or low tide at **Lite Bay Resort**, please **refer to the Live Tide Status in the Weather section** on our website. Note that Lite Bay stays relatively deep even during low tide.',
    parkingCeb: '**LIBRE** (walay bayad ang parking).',
    parkingEn: '**FREE** (no parking fee).',
    restroomCeb: '**LIBRE** (walay bayad ang CR ug shower).',
    restroomEn: '**FREE** (no restroom or shower fee).',
  },

  majestique: {
    key: 'majestique',
    name: 'Majestique Beach',
    aliases: ['majestique', 'majestic'],
    contact: '0943-622-7972',
    hoursEn: '**7:00 AM to 5:00 PM** (Day use) and **6:00 PM to 6:00 AM** (Overnight), open every day.',
    hoursCeb: '**7:00 AM hangtod 5:00 PM** (Day use) ug **6:00 PM hangtod 6:00 AM** (Overnight), abli kada adlaw.',
    entranceEn: '**₱30 per person** (same price with or without cottage).',
    entranceCeb: '**₱30 kada tawo** (pareho ra ang presyo naay cottage o wala).',
    cottagesEn: '**₱500 to ₱1,000** for day cottages, and **₱800 to ₱1,200** for overnight cottages.',
    cottagesCeb: '**₱500 hangtod ₱1,000** sa day cottage, ug **₱800 hangtod ₱1,200** sa overnight cottage.',
    roomsEn: '**₱2,000** for regular room and **₱3,500** for air-conditioned (AC) room.',
    roomsCeb: '**₱2,000** sa regular room ug **₱3,500** sa aircon (AC) room.',
    batoonCeb: 'Ang **Majestique Beach** kay **dili ra batoon** (dili ra kaayo batoon ang baybayon).',
    batoonEn: '**Majestique Beach** is **not rocky**.',
    sugbaCeb: 'Oo, **naay sugbaanan** sa **Majestique Beach**.',
    sugbaEn: 'Yes, **Majestique Beach** has a designated **grilling area**.',
    safeCeb: 'Oo, **safe maligo sa Majestique Beach**, mag-amping lang gamay tungod kay medyo dali kini molawm. Naay abangan nga life jackets tag **₱50**. Palihug tan-awa sab ang Live Weather update sa among website sa dili pa maligo.',
    safeEn: 'Yes, **Majestique Beach is safe for swimming**, just take extra care as it gets deep quickly. Life jackets are available for rent for **₱50**. Please check our website Live Weather update before swimming.',
    lifeguardCeb: '**Walay lifeguard** sa **Majestique Beach** (walay lifeguard ang mga beach sa Binongkalan), pero naay maabangan nga **life jackets tag ₱50**.',
    lifeguardEn: 'There is **no lifeguard** at **Majestique Beach** (no lifeguards at any Binongkalan beach), but **life jackets are available for rent for ₱50**.',
    storeCeb: 'Oo, **naay store ug foods** sa **Majestique Beach** ug naa rasad mga tindahan sa duol daplin sa highway, pero **walay mga baligya nga karne (meat)**. Palit daan og karne sa merkado kung magplano mong magsugba.',
    storeEn: 'Yes, there are **stores and food** at **Majestique Beach** and nearby stores along the highway, but **they do not sell raw meat**. Please buy meat from the market in advance if you plan to grill.',
    showerCeb: 'Oo, **naay shower / kaligoan** sa **Majestique Beach** (₱10 ang himasa / rinse).',
    showerEn: 'Yes, **Majestique Beach has showers** and rinse facilities (₱10 for shower / rinse).',
    seniorCeb: '**Dili accessible sa mga senior citizen ang Majestique Beach** kay **daghan kini ug hagdanan** paubos sa dagat, busa maglisod ang mga senior.',
    seniorEn: '**Majestique Beach is not accessible for senior citizens** because there are **many steep stairs** leading down to the shore, making it difficult for seniors.',
    sinkholeCeb: '**Walay sinkhole** sa **Majestique Beach**.',
    sinkholeEn: 'There is **no sinkhole** at **Majestique Beach**.',
    molawmCeb: 'Oo, **dali molawm ang Majestique Beach** tungod kay **dili kini mohunas ug pamaayo** bisan kung low tide.',
    molawmEn: 'Yes, **Majestique Beach gets deep quickly** because the water does not recede deeply even during low tide.',
    petsCeb: 'Oo, **pwede kaayo magdala og pets** sa **Majestique Beach**! Palihug lang og bantay sa inyong binuhi ug tipigi ang kalimpyo sa palibot.',
    petsEn: 'Yes, **pets are allowed** at **Majestique Beach**! Please supervise your pets and help maintain cleanliness.',
    tideCeb: 'Para sa kahimtang sa taob o hunas sa **Majestique Beach**, palihug **i-refer ang Live Tide Status sa Weather section** diri sa among website. Timan-i sab nga ang Majestique kay **dili mohunas ug pamaayo** bisan kung low tide.',
    tideEn: 'To check if it is high tide or low tide at **Majestique Beach**, please **refer to the Live Tide Status in the Weather section** on our website. Note that Majestique stays relatively deep even during low tide.',
    parkingCeb: '**LIBRE** (walay bayad ang parking).',
    parkingEn: '**FREE** (no parking fee).',
    restroomCeb: '**₱10** sa himasa / shower.',
    restroomEn: '**₱10** for rinse / shower.',
  },

  hinagdan: {
    key: 'hinagdan',
    name: 'Hinagdan Beach',
    aliases: ['hinagdan', 'hinagdan beach'],
    contact: '0975-086-2570, 0963-654-0904, or 0926-234-5373',
    hoursEn: '**6:00 AM to 7:00 PM** (Day use) and **open whole night** for overnight stays (open every day).',
    hoursCeb: '**6:00 AM hangtod 7:00 PM** (Day use) ug **abli tibuok gabii** para sa overnight (abli kada adlaw).',
    entranceEn: '**₱30 per person** (day use with cottage), **₱50 per person** (without cottage / overnight).',
    entranceCeb: '**₱30 kada tawo** (day use nga naay cottage), **₱50 kada tawo** (walay cottage / overnight).',
    cottagesEn: '**₱600** for day cottage and **₱700** for overnight cottage.',
    cottagesCeb: '**₱600** sa day cottage ug **₱700** sa overnight cottage.',
    roomsEn: '**₱250** for short-time room (3 hrs), **₱1,000** for ordinary room, and **₱2,500** for air-conditioned (AC) room.',
    roomsCeb: '**₱250** sa short-time room (3 ka oras), **₱1,000** sa ordinary room, ug **₱2,500** sa aircon (AC) room.',
    batoonCeb: 'Ang **Hinagdan Beach** kay **dili batoon** — **balas (sand/sandy shoreline)** kini!',
    batoonEn: '**Hinagdan Beach** is **not rocky** — it has a **natural sandy shoreline**!',
    sugbaCeb: 'Oo, **naay sugbaanan** sa **Hinagdan Beach**.',
    sugbaEn: 'Yes, **Hinagdan Beach** has a designated **grilling area**.',
    safeCeb: 'Oo, **safe kaayo maligo sa Hinagdan Beach** tungod kay balas ang baybayon ug hinay-hinay ra ang paglawm. Naay abangan nga salbabida (₱50) ug life jackets (₱50–₱100). Palihug tan-awa sab ang Live Weather update sa website sa dili pa maligo.',
    safeEn: 'Yes, **Hinagdan Beach is safe for swimming** with its sandy shoreline and gradual depth. Floaters (₱50) and life jackets (₱50–₱100) are available for rent. Please check our website Live Weather update before swimming.',
    lifeguardCeb: '**Walay lifeguard** sa **Hinagdan Beach** (walay lifeguard ang mga beach sa Binongkalan), pero naay maabangan nga **salbabida (₱50)** ug **life jackets (₱50–₱100)**.',
    lifeguardEn: 'There is **no lifeguard** at **Hinagdan Beach** (no lifeguards at any Binongkalan beach), but **floaters (₱50)** and **life jackets (₱50–₱100)** are available for rent.',
    storeCeb: 'Oo, **naay store ug foods** sa **Hinagdan Beach** ug naa rasad mga tindahan sa duol daplin sa highway, pero **walay mga baligya nga karne (meat)**. Palit daan og karne sa merkado kung magplano mong magsugba.',
    storeEn: 'Yes, there are **stores and food** at **Hinagdan Beach** and nearby stores along the highway, but **they do not sell raw meat**. Please buy meat from the market in advance if you plan to grill.',
    showerCeb: 'Oo, **naay shower / kaligoan** sa **Hinagdan Beach** para sa pag-banlaw o himasa.',
    showerEn: 'Yes, **Hinagdan Beach has showers** and rinse facilities for washing off after swimming.',
    seniorCeb: '**Dili accessible sa mga senior citizen ang Hinagdan Beach** kay **daghan kini ug hagdanan** paubos sa baybayon, busa maglisod ang mga senior.',
    seniorEn: '**Hinagdan Beach is not accessible for senior citizens** because there are **many steep stairs** going down to the beach, making it difficult for seniors.',
    sinkholeCeb: '**Walay sinkhole** sa **Hinagdan Beach**.',
    sinkholeEn: 'There is **no sinkhole** at **Hinagdan Beach**.',
    molawmCeb: '**Dili ra dali molawm ang Hinagdan Beach**; balas ang baybayon ug hinay-hinay ra ang paglawm (gradual depth).',
    molawmEn: '**Hinagdan Beach does not get deep quickly**; it has a sandy shoreline and gradual depth.',
    petsCeb: 'Oo, **pwede kaayo magdala og pets** sa **Hinagdan Beach**! Palihug lang og bantay sa inyong binuhi ug tabangi ang pagmintinar sa kalimpyo sa baybayon.',
    petsEn: 'Yes, **pets are allowed** at **Hinagdan Beach**! Please supervise your pets and help keep the beach clean.',
    tideCeb: 'Para sa kahimtang sa taob o hunas sa **Hinagdan Beach**, palihug **i-refer ang Live Tide Status sa Weather section** diri sa among website. Klaro sab kaayo ang paghunas sa Hinagdan.',
    tideEn: 'To check if it is high tide or low tide at **Hinagdan Beach**, please **refer to the Live Tide Status in the Weather section** on our website. Hinagdan has a noticeably exposed shoreline during low tide.',
    parkingCeb: 'Pasensya na, **kini nga impormasyon kay wala sa among beripikadong database** (wala pa ma-lista ang bayad sa parking sa **Hinagdan Beach**).',
    parkingEn: 'Sorry, **this information is not available** in our verified database (the parking fee for **Hinagdan Beach** is not listed).',
    restroomCeb: 'Pasensya na, **kini nga impormasyon kay wala sa among beripikadong database** (wala pa ma-lista ang bayad sa CR sa **Hinagdan Beach**, apan naa silay shower ug kaligoan).',
    restroomEn: 'Sorry, **this information is not available** in our verified database (the restroom fee for **Hinagdan Beach** is not listed, though shower facilities are available).',
  },
};

export function detectLanguage(q: string): 'ceb' | 'tl' | 'en' {
  const lower = ` ${q.toLowerCase()} `;
  if (
    /\b(tagpila|pila|pilay|unsa|unsay|unsang|asa|asay|hain|abli|sirado|sabado|dominggo|walay|wala|bayad|kwarto|sakyanan|taob|hunas|unsaon|giunsa|padulong|paingon|gikan|naay|naa|pwede|maayong|mayng|kumusta|musta|pinakabarato|barato|pinakaduol|duol|kaligoan|ligoan|makabangag|kinsa|kinsay|ngano|nganong|kanus-a|ila|ilang|imong|imo|nimo|pangalan|pangan|didto|diri|dinhi|diha|ari|ara|kini|kana|kani|ni|ani|byahe|biyahe|sakay|naog|manaog|atang|oras|kung|tinda|tindahan|merkado|maligo|kaligo|langoy|ambak|lukso|suroy|adto|balas|ba|mga|dili|di|ayaw|batoon|bato-on|bato|sugba|sugbaanan|sugba-anan|ihaw|luwas|bantay|karne|hagdanan|hagdan|molawm|lawm|lawom|pamaayo|iro|ayam|binuhi|kuting|ganahan|gusto|mahilig|nako|namo|nato|ko|ka|mi|mo|sila|siya|gyud|jud|ra|man|sab|sad|pud|pod|kaayo|gamay|dako|daghan|layo|nindot|maayo|lisod|sayon|dali|dugay|hinay|limpyo|bata|tiguwang|barkada|pamilya|uyab|amigo|amiga|ug|og|nga|kay|tungod|busa|mao|apan|bisan|maski|tanan|tanang|salamat|palihug|palihog|pasensya|tabang|tabangi|ingna|hatagi|irekomendar|lipay|nalipay|kapoy|gikapoy|laay|gilaay|init|uwan|ulan|gabii|buntag|hapon|udto|ugma|karon|puhon)\b/.test(
      lower
    )
  ) {
    return 'ceb';
  }
  if (
    /\b(magkano|saan|paano|anong|anu-ano|bukas|sarado|bayad|kwarto|sasakyan|mula|papuntang|pinakamura|mura|pinakamalapit|malapit|bakit|kailan|sino|nila|doon|biyahe|sakay|ilang|meron|tindahan|ligtas|bato|mabato|ihaw|karne|malalim|aso|pusa|gusto\s+ko|pwede\s+ba|masaya|pagod|malungkot)\b/.test(
      lower
    )
  ) {
    return 'tl';
  }
  return 'en';
}

export function detectBeachesInText(text: string): BeachKey[] {
  const lower = text.toLowerCase();
  const candidates: { key: BeachKey; index: number }[] = [];

  const ranolaMatch = lower.match(/\b(rañola|ranola|raniola)\b/i);
  if (ranolaMatch && typeof ranolaMatch.index === 'number') {
    candidates.push({ key: 'ranola', index: ranolaMatch.index });
  }
  const litebayMatch = lower.match(/\b(lite\s*bay|litebay|light\s*bay)\b/i);
  if (litebayMatch && typeof litebayMatch.index === 'number') {
    candidates.push({ key: 'litebay', index: litebayMatch.index });
  }
  const majestiqueMatch = lower.match(/\b(majestique|majestic)\b/i);
  if (majestiqueMatch && typeof majestiqueMatch.index === 'number') {
    candidates.push({ key: 'majestique', index: majestiqueMatch.index });
  }
  const hinagdanMatch = lower.match(/\b(hinagdan)\b/i);
  if (hinagdanMatch && typeof hinagdanMatch.index === 'number') {
    candidates.push({ key: 'hinagdan', index: hinagdanMatch.index });
  }

  candidates.sort((a, b) => a.index - b.index);
  return candidates.map((c) => c.key);
}

export interface TopicFlags {
  asksMostRocky: boolean;
  asksBatoon: boolean;
  asksSugba: boolean;
  asksSafest: boolean;
  asksSafety: boolean;
  asksLifeguard: boolean;
  asksStore: boolean;
  asksShower: boolean;
  asksSenior: boolean;
  asksSinkhole: boolean;
  asksMolawm: boolean;
  asksPets: boolean;
  asksTide: boolean;
  asksEntrance: boolean;
  asksCottage: boolean;
  asksRoom: boolean;
  asksHours: boolean;
  asksContact: boolean;
  asksParking: boolean;
  asksRestroom: boolean;
  asksActivities: boolean;
  asksRentals: boolean;
  asksPrivateBooking: boolean;
  asksDiscount: boolean;
  asksLocation: boolean;
}

export function detectTopicsInText(text: string): TopicFlags {
  const lower = text.toLowerCase();
  return {
    asksMostRocky: /\b(most\s*rocky|pinaka\s*batoon|pinakabatoon|asay\s*pinaka\s*batoon|unsay\s*pinaka\s*batoon|pinaka\s*mabato|pinakamabato|pinaka\s*daghan\s*og\s*bato)\b/i.test(lower),
    asksBatoon: /\b(batoon|bato-on|bato|batoa|mabato|rocky|rocks|pebble|pebbles|stone|stones|balas|sand|sandy|white\s*sand|whitesand)\b/i.test(lower),
    asksSugba: /\b(sugba|sugbaanan|sugba-anan|ihaw|ihawan|grill|grilling|barbecue|bbq|barbeque)\b/i.test(lower),
    asksSafest: /\b(pinaka\s*safe|pinakasafe|asay\s*pinaka\s*safe|safest|safest\s*beach|safe\s*for\s*(children|kids|seniors|families)|safe\s*sa\s*(mga\s*)?(bata|senior|tiguwang))\b/i.test(lower),
    asksSafety: /\b(safe|safety|luwas|delikado|dangerous|wave|waves|bawod|current|ligtas|bata|kids|children)\b/i.test(lower),
    asksLifeguard: /\b(lifeguard|life\s*guard|lifeguards|bantay\s*dagat|guard)\b/i.test(lower),
    asksStore: /\b(store|stores|food|foods|tinda|tindahan|sari-sari|sari\s*sari|pagkaon|snack|snacks|canteen|karne|meat|shop|palitanan)\b/i.test(lower),
    asksShower: /\b(shower|showers|kaligoan|himasa|rinse|banlaw|ligoan)\b/i.test(lower),
    asksSenior: /\b(senior|seniors|senior\s*citizen|senior\s*citizens|tiguwang|elderly|accessible|accessibility|wheelchair|pwd|hagdan|hagdanan|stairs)\b/i.test(lower),
    asksSinkhole: /\b(sinkhole|sink\s*hole|sinkholes|sink\s*holes|bangag|lungag)\b/i.test(lower),
    asksMolawm: /\b(molawm|mo\s*lawm|dali\s*molawm|dali\s*mo\s*lawm|lawm|lawom|malalim|deep|depth|deeply|drop\s*off|drop-off|dropoff|shallow|mababaw|pamaayo|hunas\s*ug\s*pamaayo)\b/i.test(lower),
    asksPets: /\b(pet|pets|iro|ayam|dog|dogs|cat|cats|kuting|aso|pusa|hayop|binuhi|animal|animals)\b/i.test(lower),
    asksTide: /\b(taob|hunas|tide|tides|high\s*tide|low\s*tide|water\s*level|weather|panahon|ulan|forecast)\b/i.test(lower),
    asksEntrance:
      /\b(entrance|entran|entrance\s*fee|bayad\s*sa\s*pagsulod|pagsulod|per\s*head|per\s*person|cheapest|pinakabarato|pinaka\s*barato|barato|affordable|budget|pinakamura)\b/i.test(
        lower
      ) ||
      (/\b(tagpila|pila\s*ang\s*bayad|how\s*much|magkano|price|prices|rate|rates|fees)\b/i.test(lower) &&
        !/\b(cottage|cottages|table|tables|room|rooms|kwarto|parking|park|car|motor|cr|restroom|toilet|shower|kaligo|himasa|salbabida|floater|kayak|jacket|vest|goggles|fins)\b/i.test(
          lower
        )),
    asksCottage: /\b(cottage|cottages|table|tables|shed|payag|space)\b/i.test(lower),
    asksRoom: /\b(room|rooms|kwarto|overnight|aircon|ac|short-time|shortime|short\s*time|balay|tent|camp|camping|tulog|katulog|stay)\b/i.test(lower),
    asksHours: /\b(open|opening|close|closing|operating|schedule|abli|sirado|mangabre|manirado|saturday|sabado|sunday|dominggo|everyday|kada\s*adlaw|hours|oras\s*sa\s*pag-abli)\b/i.test(lower),
    asksContact: /\b(contact|contacts|number|numbers|phone|cellphone|call|text|tawag|reach|facebook|fb)\b/i.test(lower),
    asksParking: /\b(parking|park\s*fee|car\s*park|motor\s*park|motorcycle\s*park|parada|paradahan|sakyanan)\b/i.test(lower),
    asksRestroom: /\b(restroom|restrooms|cr|comfort\s*room|toilet|ihi|libang)\b/i.test(lower),
    asksActivities: /\b(activity|activities|snorkel|snorkeling|kayak|kayaking|fishing|lingaw)\b/i.test(lower),
    asksRentals: /\b(rent|rental|rentals|equipment|salbabida|floater|floaters|life\s*jacket|lifejacket|life\s*jackets|vest|goggles|fins|mouthpiece|abang)\b/i.test(lower),
    asksPrivateBooking: /\b(book|booking|mabookingan|ma-bookingan|bookingan|reserve|reservation|private|exclusive|walk-in|walk\s*in)\b/i.test(lower),
    asksDiscount: /\b(discount|discounts|promo|promos|event|events|birthday|birthdays|reunion|team\s*building|group\s*rate|less|hangyo)\b/i.test(lower),
    asksLocation: /\b(where\s+is|where\s+are|located|location\s+of|address|asa\s+dapit|asa\s+makit-an|asa\s+ang\s+lugar|saan\s+matatagpuan)\b/i.test(lower),
  };
}

export function hasAnyTopic(t: TopicFlags): boolean {
  return (
    t.asksMostRocky ||
    t.asksBatoon ||
    t.asksSugba ||
    t.asksSafest ||
    t.asksSafety ||
    t.asksLifeguard ||
    t.asksStore ||
    t.asksShower ||
    t.asksSenior ||
    t.asksSinkhole ||
    t.asksMolawm ||
    t.asksPets ||
    t.asksTide ||
    t.asksEntrance ||
    t.asksCottage ||
    t.asksRoom ||
    t.asksHours ||
    t.asksContact ||
    t.asksParking ||
    t.asksRestroom ||
    t.asksActivities ||
    t.asksRentals ||
    t.asksPrivateBooking ||
    t.asksDiscount ||
    t.asksLocation
  );
}

interface SpecificOriginRoute {
  pattern: RegExp;
  label: string;
  direction: 'south' | 'north' | 'mountain';
  timeEn: string;
  stepsEn: string;
  timeCeb: string;
  stepsCeb: string;
}

const SPECIFIC_CEBU_ORIGINS: SpecificOriginRoute[] = [
  // --- CATMON BARANGAYS ---
  {
    pattern: /\b(duyan|macaas)\b/i,
    label: 'Barangay Duyan / Macaas, Catmon',
    direction: 'south',
    timeEn: '2 to 5 minutes',
    stepsEn: 'Ride a tricycle, multicab, or northbound bus heading north along the national highway directly to **Rañola Beach, Lite Bay Resort, Majestique Beach, or Hinagdan Beach** in Barangay Binongkalan.',
    timeCeb: '2 hangtod 5 minutos',
    stepsCeb: 'Sakay lang og tricycle, multicab, o bus pa-Norte subay sa highway diretso sa **Rañola Beach, Lite Bay Resort, Majestique Beach, o Hinagdan Beach** sa Barangay Binongkalan.',
  },
  {
    pattern: /\b(catmondaan|flores|corazon|san jose|catmon proper|poblacion catmon)\b/i,
    label: 'Catmon Town Proper (Brgy. San Jose Poblacion / Corazon / Flores / Catmondaan)',
    direction: 'south',
    timeEn: '5 to 8 minutes',
    stepsEn: 'Ride a tricycle, multicab, or any northbound bus heading north along the highway to **Barangay Binongkalan** (Rañola Beach is the first beach you reach).',
    timeCeb: '5 hangtod 8 minutos',
    stepsCeb: 'Sakay og tricycle, multicab, o bus pa-Norte subay sa highway padulong sa **Barangay Binongkalan** (Rañola Beach ang unang maagian).',
  },
  {
    pattern: /\b(panalipan)\b/i,
    label: 'Barangay Panalipan, Catmon',
    direction: 'south',
    timeEn: '8 to 12 minutes',
    stepsEn: 'Ride a northbound bus, multicab, or tricycle along the national highway to **Barangay Binongkalan** (Rañola Beach is reached first).',
    timeCeb: '8 hangtod 12 minutos',
    stepsCeb: 'Sakay og bus pa-Norte, multicab, o tricycle subay sa highway padulong sa **Barangay Binongkalan** (Rañola Beach ang unang maabot).',
  },
  {
    pattern: /\b(agsuwao|amancion|anapog|bactas|bongyas|cabungaan|cambangkaya|can-ibuang|ginabucan|tabili|tinabyonan)\b/i,
    label: 'Catmon Mountain Barangay',
    direction: 'mountain',
    timeEn: '10 to 25 minutes',
    stepsEn: 'Ride a motorcycle (habal-habal) down to the Catmon National Highway, then take a tricycle or northbound bus to **Barangay Binongkalan**.',
    timeCeb: '10 hangtod 25 minutos',
    stepsCeb: 'Sakay og habal-habal paingon sa highway sa Catmon, dayon sakay og tricycle o bus pa-Norte padulong sa **Barangay Binongkalan**.',
  },

  // --- NORTH CEBU TOWNS & BARANGAYS ---
  {
    pattern: /\b(sogod|bawo|damolog|bagatayam|mohon sogod|liki|takay)\b/i,
    label: 'Sogod, Cebu (Brgy. Bawo / Damolog / Poblacion)',
    direction: 'north',
    timeEn: '5 to 15 minutes',
    stepsEn: 'Wait along the national highway and ride any southbound (Cebu City-bound) bus, mini-bus, or tricycle heading south to **Barangay Binongkalan, Catmon** (Hinagdan Beach is the first beach reached).',
    timeCeb: '5 hangtod 15 minutos',
    stepsCeb: 'Atang lang sa highway ug sakay og bus, mini-bus, o tricycle pa-Cebu City (pa-South) ug manaog sa **Barangay Binongkalan, Catmon** (Hinagdan Beach ang unang maabot).',
  },
  {
    pattern: /\b(carmen|dawis|luyang|baring|puente|cantumog|cogon carmen)\b/i,
    label: 'Carmen, Cebu',
    direction: 'south',
    timeEn: '15 to 20 minutes',
    stepsEn: 'Wait along the Cebu North National Highway and ride any northbound bus or mini-bus past Catmon Town Proper to **Barangay Binongkalan, Catmon** (Rañola Beach is the first beach reached).',
    timeCeb: '15 hangtod 20 minutos',
    stepsCeb: 'Atang sa highway sa Carmen ug sakay og bisan unsang bus o mini-bus pa-Norte padulong sa **Barangay Binongkalan, Catmon** (Rañola Beach ang unang maagian).',
  },
  {
    pattern: /\b(danao|sabang|guinsay|dunggoan|maslog|taytay danao|looc danao|suba danao|cambanay)\b/i,
    label: 'Danao City',
    direction: 'south',
    timeEn: '30 to 40 minutes',
    stepsEn: 'Wait along the national highway in Danao City and ride any northbound bus or mini-bus passing through Carmen to **Barangay Binongkalan, Catmon** (Rañola Beach is the first beach reached).',
    timeCeb: '30 hangtod 40 minutos',
    stepsCeb: 'Atang sa highway sa Danao City ug sakay og bus o mini-bus pa-Norte (agi sa Carmen) ug manaog sa **Barangay Binongkalan, Catmon** (Rañola Beach ang unang maagian).',
  },
  {
    pattern: /\b(compostela|magay|canamucan|estaca|buluang)\b/i,
    label: 'Compostela, Cebu',
    direction: 'south',
    timeEn: '45 minutes to 1 hour',
    stepsEn: 'Ride any northbound Ceres bus or mini-bus along the national highway heading past Danao and Carmen to **Barangay Binongkalan, Catmon** (Rañola Beach is the first beach reached).',
    timeCeb: '45 minutos hangtod 1 ka oras',
    stepsCeb: 'Sakay og bus o mini-bus pa-Norte subay sa highway agi sa Danao ug Carmen padulong sa **Barangay Binongkalan, Catmon** (Rañola Beach ang unang maagian).',
  },
  {
    pattern: /\b(liloan|yati|jubay|cotcot|catarman liloan|calero|cabadiangan)\b/i,
    label: 'Liloan, Cebu',
    direction: 'south',
    timeEn: '50 minutes to 1 hour 10 minutes',
    stepsEn: '1. **Where to wait in Liloan:** Wait along the Cebu North National Highway anywhere in Liloan (such as Yati, Jubay, Cotcot, or in front of Gaisano Grand Mall Liloan).\n2. **What to ride:** Board any northbound Ceres bus (aircon or non-aircon) or mini-bus with a signboard for **Sogod, Bogo, San Remigio, Medellin, or Maya**.\n3. **Drop-off instruction:** Tell the conductor to drop you off at **Barangay Binongkalan, Catmon** (or specify: **Rañola Beach, Lite Bay Resort, Majestique Beach, or Hinagdan Beach**).\n4. **Travel route:** The bus travels along Compostela, Danao City, Carmen, and Catmon Town Proper, then immediately enters Barangay Binongkalan.\n5. **First beach reached:** Coming from Liloan (South), the first beach on your right along the highway is **Rañola Beach (Raniola)**, followed by **Lite Bay Resort**, **Majestique Beach**, and **Hinagdan Beach**.',
    timeCeb: '50 minutos hangtod 1 ka oras ug 10 minutos',
    stepsCeb: '1. **Hain Moatang sa Liloan:** Atang daplin sa Cebu North National Highway sa Liloan (sama sa Yati, Jubay, Cotcot, o atbang sa Gaisano Grand Mall Liloan).\n2. **Unsay Sakyan:** Sakay og Ceres bus (aircon o ordinary) o mini-bus pa-Norte nga may karatula nga **Sogod, Bogo, San Remigio, Medellin, o Maya**.\n3. **Pahibalo sa Konduktor:** Ingna ang konduktor nga manaog ka sa **Barangay Binongkalan, Catmon** (o isulti ang specific nga beach: **Rañola Beach, Lite Bay Resort, Majestique Beach, o Hinagdan Beach**).\n4. **Agianan sa Byahe:** Moagi ang bus subay sa Compostela, Danao City, Carmen, ug Catmon Town Proper sa dili pa mosulod sa Barangay Binongkalan.\n5. **Unang Maagian:** Gikan sa Liloan (South), ang pinakaunang maagian sa daplin sa highway kay ang **Rañola Beach (Raniola)**, gisundan dayon sa **Lite Bay Resort**, **Majestique Beach**, ug **Hinagdan Beach**.',
  },
  {
    pattern: /\b(consolacion|cansaga|pitogo|lamac|tugbungan|nangka|tayud|casili)\b/i,
    label: 'Consolacion, Cebu',
    direction: 'south',
    timeEn: '1 hour to 1 hour 15 minutes',
    stepsEn: 'Wait along the Cebu North National Highway in Consolacion and ride any northbound bus or mini-bus to **Barangay Binongkalan, Catmon** (Rañola Beach is reached first).',
    timeCeb: '1 ka oras hangtod 1 ka oras ug 15 minutos',
    stepsCeb: 'Atang sa highway sa Consolacion ug sakay og bus o mini-bus pa-Norte diretso sa **Barangay Binongkalan, Catmon** (Rañola Beach ang unang maagian).',
  },
  {
    pattern: /\b(borbon|tabogon|cadaruhan|ilihan|muabog)\b/i,
    label: 'Borbon / Tabogon, Cebu',
    direction: 'north',
    timeEn: '25 to 45 minutes',
    stepsEn: 'Ride any southbound (Cebu City-bound) bus passing through Sogod and drop off at **Barangay Binongkalan, Catmon** (Hinagdan Beach is reached first).',
    timeCeb: '25 hangtod 45 minutos',
    stepsCeb: 'Sakay og bus pa-Cebu City (pa-South) agi sa Sogod ug manaog sa **Barangay Binongkalan, Catmon** (Hinagdan Beach ang unang maabot).',
  },
  {
    pattern: /\b(bogo|san remigio|gairan|dakit|taytayan|polambato|hagnaya|tambongon)\b/i,
    label: 'Bogo City / San Remigio',
    direction: 'north',
    timeEn: '1 hour to 1 hour 20 minutes',
    stepsEn: 'Ride any southbound (Cebu City-bound) Ceres bus along the national highway and ask the conductor to drop you off at **Barangay Binongkalan, Catmon** (just after Sogod; Hinagdan Beach is the first beach reached).',
    timeCeb: '1 ka oras hangtod 1 ka oras ug 20 minutos',
    stepsCeb: 'Sakay og Ceres bus pa-Cebu City (pa-South) ug ingna ang konduktor nga manaog ka sa **Barangay Binongkalan, Catmon** (human sa Sogod; Hinagdan Beach ang unang maabot).',
  },
  {
    pattern: /\b(medellin|daanbantayan|maya|kawit|tindog|dayhagon|agujo|paypay|tapilon|malbago)\b/i,
    label: 'Medellin / Daanbantayan (Maya)',
    direction: 'north',
    timeEn: '1.5 to 2.5 hours',
    stepsEn: 'Ride a southbound (Cebu City-bound) Ceres bus passing through Bogo and Sogod, and drop off right along the highway at **Barangay Binongkalan, Catmon** (Hinagdan Beach is reached first).',
    timeCeb: '1.5 hangtod 2.5 ka oras',
    stepsCeb: 'Sakay og Ceres bus pa-Cebu City (pa-South) agi sa Bogo ug Sogod, ug manaog mismo sa highway sa **Barangay Binongkalan, Catmon** (Hinagdan Beach ang unang maabot).',
  },

  // --- MANDAUE CITY & BARANGAYS ---
  {
    pattern: /\b(subangdaku|tipolo|guizo|mantuyong|ibabao-estancia|maguikay|jagobiao|canduman|paknaan|tabok|tingub|labogon|opao|umapad|cabancalan|casuntingan|bakilid|alang-alang|cambaro|pagsabungan|cubacub|tawason|mandaue)\b/i,
    label: 'Mandaue City',
    direction: 'south',
    timeEn: '1 hour 15 minutes to 1 hour 45 minutes',
    stepsEn: 'Go to the **Mandaue National Highway (MC Briones St. / Pacific Mall / Jagobiao)** or **Cebu North Bus Terminal (SM City Cebu)**, then ride any northbound bus (bound for Sogod, Bogo, or Maya) and drop off at **Barangay Binongkalan, Catmon** (Rañola Beach is reached first).',
    timeCeb: '1 ka oras ug 15 minutos hangtod 1 ka oras ug 45 minutos',
    stepsCeb: 'Adto sa **Mandaue Highway (MC Briones St. / Pacific Mall / Jagobiao)** o sa **Cebu North Bus Terminal (SM City Cebu)**, dayon sakay og bus pa-Norte (padulong Sogod, Bogo, o Maya) ug manaog sa **Barangay Binongkalan, Catmon** (Rañola Beach ang unang maagian).',
  },

  // --- LAPU-LAPU CITY (MACTAN) & CORDOVA ---
  {
    pattern: /\b(lapu-lapu|lapulapu|lapu lapu|mactan|cordova|airport|mcia|pusok|pajo|ibo|maribago|marigondon|agus|gun-ob|pajac|bankal|buaya|babag|canjulao|punta engaño|punta engano|subabasbas|pilipog|gabi)\b/i,
    label: 'Lapu-Lapu City (Mactan) / Cordova',
    direction: 'south',
    timeEn: '2 to 2.5 hours',
    stepsEn: '1. Ride a **MyBus** (from Mactan Airport), modern jeepney, or v-hire across the bridge to **SM City Cebu (Cebu North Bus Terminal)** or **Parkmall / Mandaue Highway** (30–45 mins).\n2. Board any northbound bus passing through Catmon and drop off at **Barangay Binongkalan, Catmon** (1.5–2 hours). Rañola Beach is reached first.',
    timeCeb: '2 hangtod 2.5 ka oras',
    stepsCeb: '1. Sakay og **MyBus**, modern jeep, o v-hire tabok sa tulay padulong sa **SM City Cebu (Cebu North Bus Terminal)** o **Parkmall / Mandaue Highway** (30–45 minutos).\n2. Sakay og bus pa-Norte (padulong Sogod, Bogo, o Maya) ug manaog sa **Barangay Binongkalan, Catmon** (1.5–2 ka oras). Rañola Beach ang unang maagian.',
  },

  // --- CEBU CITY SPECIFIC BARANGAYS ---
  {
    pattern: /\b(mabolo|kasambagan|carreta|hipodromo|north bus|sm city cebu|sm cebu)\b/i,
    label: 'Barangay Mabolo / SM City Cebu (Cebu North Bus Terminal)',
    direction: 'south',
    timeEn: '1.5 to 2 hours',
    stepsEn: 'Go directly to the **Cebu North Bus Terminal (at SM City Cebu, Brgy. Mabolo)**, board any northbound Ceres bus or mini-bus (bound for Sogod, Bogo, Medellin, or Maya), and tell the conductor to drop you off at **Barangay Binongkalan, Catmon** (Rañola Beach is the first beach reached).',
    timeCeb: '1.5 hangtod 2 ka oras',
    stepsCeb: 'Adto diretso sa **Cebu North Bus Terminal (sa SM City Cebu, Brgy. Mabolo)**, sakay og Ceres bus o mini-bus pa-Norte (padulong Sogod, Bogo, o Maya), ug ingna ang konduktor nga manaog ka sa **Barangay Binongkalan, Catmon** (Rañola Beach ang unang maagian).',
  },
  {
    pattern: /\b(talamban|pit-os|bacayan|banilad)\b/i,
    label: 'Barangay Talamban / Banilad / Pit-os, Cebu City',
    direction: 'south',
    timeEn: '1.5 to 2 hours',
    stepsEn: '1. Ride a jeepney (such as 13C or 62B) or taxi to **SM City Cebu (Cebu North Bus Terminal)**, or pass via Pit-os/Consolacion to the North Highway.\n2. Board any northbound bus passing through Catmon and drop off at **Barangay Binongkalan, Catmon** (Rañola Beach is reached first).',
    timeCeb: '1.5 hangtod 2 ka oras',
    stepsCeb: '1. Sakay og jeep (sama sa 13C o 62B) padulong sa **SM City Cebu (Cebu North Bus Terminal)**, o agi sa Pit-os/Consolacion paingon sa highway.\n2. Sakay og bus pa-Norte ug manaog mismo sa **Barangay Binongkalan, Catmon** (Rañola Beach ang unang maagian).',
  },
  {
    pattern: /\b(lahug|it park|apas|busay|kamputhaw)\b/i,
    label: 'Barangay Lahug (IT Park) / Apas / Busay, Cebu City',
    direction: 'south',
    timeEn: '1 hour 45 minutes to 2 hours',
    stepsEn: '1. From IT Park or Lahug, ride a **04L jeepney**, modern bus, or taxi to **SM City Cebu (Cebu North Bus Terminal)** (15–25 mins).\n2. Board any northbound bus (bound for Sogod, Bogo, or Maya) and drop off at **Barangay Binongkalan, Catmon** (1.5–2 hours). Rañola Beach is reached first.',
    timeCeb: '1 ka oras ug 45 minutos hangtod 2 ka oras',
    stepsCeb: '1. Gikan sa IT Park o Lahug, sakay og **04L nga jeep**, modern bus, o taxi padulong sa **SM City Cebu (Cebu North Bus Terminal)** (15–25 minutos).\n2. Sakay og bus pa-Norte (padulong Sogod, Bogo, o Maya) ug manaog sa **Barangay Binongkalan, Catmon** (1.5–2 ka oras). Rañola Beach ang unang maagian.',
  },
  {
    pattern: /\b(colon|sto niño|sto. niño|ermita|parian|tinago|pier|capitol|fuente|sambag|guadalupe|zapatera|downtown)\b/i,
    label: 'Downtown / Fuente / Capitol / Guadalupe, Cebu City',
    direction: 'south',
    timeEn: '1 hour 45 minutes to 2 hours 15 minutes',
    stepsEn: '1. Ride a **01K, 10M, 12I, or 06B jeepney** or taxi to **SM City Cebu (Cebu North Bus Terminal)** (15–30 mins).\n2. Board any northbound bus passing through Catmon and drop off at **Barangay Binongkalan, Catmon** (1.5–2 hours). Rañola Beach is reached first.',
    timeCeb: '1 ka oras ug 45 minutos hangtod 2 ka oras ug 15 minutos',
    stepsCeb: '1. Sakay og **01K, 10M, 12I, o 06B nga jeep** o taxi padulong sa **SM City Cebu (Cebu North Bus Terminal)** (15–30 minutos).\n2. Sakay og bus pa-Norte ug manaog sa **Barangay Binongkalan, Catmon** (1.5–2 ka oras). Rañola Beach ang unang maagian.',
  },
  {
    pattern: /\b(labangon|tisa|punta princesa|mambaling|basak san nicolas|basak pardo|pardo|inayawan|bulacao)\b/i,
    label: 'South Cebu City (Labangon / Tisa / Pardo / Mambaling / Bulacao / Inayawan)',
    direction: 'south',
    timeEn: '2 to 2.5 hours',
    stepsEn: '1. Ride a **10M / 10H jeepney** or **MyBus** to **SM City Cebu (Cebu North Bus Terminal)** (30–45 mins).\n2. Board any northbound bus passing through Catmon and drop off at **Barangay Binongkalan, Catmon** (1.5–2 hours). Rañola Beach is reached first.',
    timeCeb: '2 hangtod 2.5 ka oras',
    stepsCeb: '1. Sakay og **10M / 10H nga jeep** o **MyBus** padulong sa **SM City Cebu (Cebu North Bus Terminal)** (30–45 minutos).\n2. Sakay og bus pa-Norte ug manaog sa **Barangay Binongkalan, Catmon** (1.5–2 ka oras). Rañola Beach ang unang maagian.',
  },

  // --- SOUTH CEBU TOWNS & BARANGAYS ---
  {
    pattern: /\b(talisay|tabunok|lawaan|lagtang|dumlog|cansojong|mohon talisay|pooc)\b/i,
    label: 'Talisay City',
    direction: 'south',
    timeEn: '2 to 2.5 hours',
    stepsEn: '1. Ride a **MyBus (via SRP)** or bus/jeepney to **SM City Cebu (Cebu North Bus Terminal)**.\n2. Board any northbound bus passing through Catmon and drop off at **Barangay Binongkalan, Catmon** (Rañola Beach is reached first).',
    timeCeb: '2 hangtod 2.5 ka oras',
    stepsCeb: '1. Sakay og **MyBus (agi sa SRP)** o jeep/bus padulong sa **SM City Cebu (Cebu North Bus Terminal)**.\n2. Sakay og bus pa-Norte ug manaog sa **Barangay Binongkalan, Catmon** (Rañola Beach ang unang maagian).',
  },
  {
    pattern: /\b(minglanilla|linao|lipata|pakigne|tungkil|tulay|calajo-an|tunghaan|naga|inoburan|langtad|tinaan|tuyan|san fernando|pitalo|sangat|carcar|perrelos|valladolid|ocana)\b/i,
    label: 'Minglanilla / Naga City / San Fernando / Carcar City',
    direction: 'south',
    timeEn: '2.5 to 3 hours',
    stepsEn: '1. Ride a bus to the **Cebu South Bus Terminal (CSBT)** or **MyBus to SM City Cebu**.\n2. Transfer to the **Cebu North Bus Terminal (at SM City Cebu)** via a **01K jeepney**.\n3. Board any northbound bus and drop off at **Barangay Binongkalan, Catmon** (Rañola Beach is reached first).',
    timeCeb: '2.5 hangtod 3 ka oras',
    stepsCeb: '1. Sakay og bus padulong sa **Cebu South Bus Terminal (CSBT)** o **MyBus pa-SM City Cebu**.\n2. Sakay og **01K nga jeep** paingon sa **Cebu North Bus Terminal (SM City Cebu)**.\n3. Sakay og bus pa-Norte ug manaog sa **Barangay Binongkalan, Catmon** (Rañola Beach ang unang maagian).',
  },
  {
    pattern: /\b(sibonga|simala|argao|dalaguete|mantalongon|alcoy|tingko|boljoon|oslob|tan-awan|santander|barili|dumanjug|ronda|alcantara|moalboal|basdiot|saavedra|badian|matutinao|lambug|alegria|malabuyoc|ginatilan|samboan)\b/i,
    label: 'South / Southwest Cebu',
    direction: 'south',
    timeEn: '3.5 to 5 hours',
    stepsEn: '1. Ride a Cebu City-bound bus to the **Cebu South Bus Terminal (CSBT)**.\n2. Ride a **01K jeepney** or taxi from CSBT to the **Cebu North Bus Terminal (SM City Cebu)** (15–25 mins).\n3. Board any northbound bus passing through Catmon and drop off at **Barangay Binongkalan, Catmon** (1.5–2 hours). Rañola Beach is reached first.',
    timeCeb: '3.5 hangtod 5 ka oras',
    stepsCeb: '1. Sakay og bus padulong sa **Cebu South Bus Terminal (CSBT)**.\n2. Sakay og **01K nga jeep** o taxi gikan CSBT paingon sa **Cebu North Bus Terminal (SM City Cebu)** (15–25 minutos).\n3. Sakay og bus pa-Norte ug manaog sa **Barangay Binongkalan, Catmon** (1.5–2 ka oras). Rañola Beach ang unang maagian.',
  },

  // --- WEST / MIDWEST CEBU ---
  {
    pattern: /\b(asturias|tuburan|tabuelan|lugo|olivo|maravilla|colonia|marmol)\b/i,
    label: 'Tabuelan / Tuburan / Asturias',
    direction: 'north',
    timeEn: '45 minutes to 1.5 hours',
    stepsEn: '1. Ride a bus or jeepney passing through the **Barangay Lugo, Sogod junction**.\n2. From Sogod, ride any southbound (Cebu City-bound) bus for **10–15 minutes** and drop off at **Barangay Binongkalan, Catmon** (Hinagdan Beach is reached first).',
    timeCeb: '45 minutos hangtod 1.5 ka oras',
    stepsCeb: '1. Sakay og bus o jeep agi sa **junction sa Barangay Lugo, Sogod**.\n2. Gikan sa Sogod, sakay og bus pa-Cebu City (pa-South) sulod sa **10–15 minutos** ug manaog sa **Barangay Binongkalan, Catmon** (Hinagdan Beach ang unang maabot).',
  },
  {
    pattern: /\b(toledo|balamban|pinamungajan|aloguinsan|lutopan|sangi|luray|arpili|buanoy|aliwanay|gaas)\b/i,
    label: 'Toledo City / Balamban',
    direction: 'south',
    timeEn: '2.5 to 3.5 hours',
    stepsEn: '1. Ride a v-hire (via Transcentral Highway) or bus to **Cebu City (Ayala / SM City Cebu)**.\n2. Go to the **Cebu North Bus Terminal (SM City Cebu)** and ride a northbound bus to **Barangay Binongkalan, Catmon** (1.5–2 hours). Rañola Beach is reached first.',
    timeCeb: '2.5 hangtod 3.5 ka oras',
    stepsCeb: '1. Sakay og v-hire (agi sa Transcentral Highway) o bus padulong sa **Cebu City (Ayala / SM City Cebu)**.\n2. Adto sa **Cebu North Bus Terminal (SM City Cebu)** ug sakay og bus pa-Norte padulong sa **Barangay Binongkalan, Catmon** (1.5–2 ka oras). Rañola Beach ang unang maagian.',
  },
];

function isExplicitCommuteText(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    /\b(commute|travel|byahe|biyahe|sakay|ride|bus|jeep|vhire|v-hire|terminal|north bus|south bus|direction|directions|route|drive|driving|layo|far|distance|kilometer|km|get to|go to|going to|arrive|reach|paano pumunta|unsaon pag adto|unsaon pag commute|unsaon pag-adto|unsaon pag-commute|padulong|paingon|gikan sa|mula sa)\b/i.test(
      lower
    ) ||
    (/\b(how many hours|how long|pila ka oras|ilang oras|pilay oras|unsa kadugay|gaano katagal)\b/i.test(
      lower
    ) &&
      !/\b(short-time|short time|shortime|kayak|open|close)\b/i.test(lower))
  );
}

function isNearestBeachQuery(text: string): boolean {
  const lower = text.toLowerCase();
  return /\b(pinakaduol|pinaka duol|asay duol|unsay duol|asa ang duol|pinakamalapit|nearest|closest|duol nga beach|duol na beach)\b/i.test(
    lower
  );
}

/**
 * Checks whether a query is comparative, superlative, multi-beach, or broad,
 * meaning it should NOT automatically inherit a single beach from conversation history.
 */
export function isComparativeOrBroadQuery(lower: string): boolean {
  // If user explicitly says "this beach", "diri na beach", "ari na beach", "kani na beach", "ni na beach",
  // they explicitly refer to the single beach currently in context!
  const refersToSingleContextBeach =
    /\b(this\s*beach|kani\s*(nga|na)\s*beach|ni\s*(nga|na)\s*beach|ani\s*(nga|na)\s*beach|diri\s*(nga|na)\s*beach|ari\s*(nga|na)\s*beach|sa\s*ini\s*nga\s*beach|sa\s*diri\s*nga\s*beach)\b/i.test(
      lower
    );
  if (refersToSingleContextBeach) {
    return false;
  }

  // Superlatives and comparisons
  if (
    /\b(pinaka|most|safest|cheapest|nearest|deepest|closest|best|worst|pinakabatoon|pinakasafe|pinakabarato|pinakaduol|pinakamalapit|pinakamura)\b/i.test(
      lower
    )
  ) {
    return true;
  }

  // Multi-beach plurals & all
  if (
    /\b(all|tanan|tanang|mga\s*beach|beaches|every\s*beach|each\s*beach|any\s*of\s*the\s*beaches|any\s*beach|ang\s*mga\s*beach|sa\s*mga\s*beach)\b/i.test(
      lower
    )
  ) {
    return true;
  }

  // Interrogatives asking which beach or comparing beaches:
  // "which beach", "what beach", "asay", "unsay", "asa na beach", "asa nga beach", "unsa na beach", "unsa nga beach", "hain", "asa man"
  if (
    /\b(which(\s+of\s+the)?\s*beach|what\s*beach|asay|unsay|hain|asa\s+(na|nga)\s*beach|unsa\s+(na|nga)\s*beach|asa\s+man)\b/i.test(
      lower
    )
  ) {
    return true;
  }

  // Standalone general questions (asking generally without referencing "this beach")
  if (
    /^(pwede\s+(ba\s+)?magda(la)?\s+ug\s+pets\??|are\s+pets\s+allowed\??|taob\s+(ba\s+)?(or|o)\s+hunas\??|high\s+tide\s+or\s+low\s+tide\??|is\s+it\s+high\s+tide\s+or\s+low\s+tide\??|naa\s+bay\s+lifeguard\s+ang\s+beach\??|naa\s+bay\s+store\s+or\s+foods\s+ang\s+mga\s+beach\??|naa\s+bay\s+shower\s+ang\s+mga\s+beach\??|accessible\s+ba\s+(ni\s+)?sa\s+mga\s+senior\s+citizen\??|are\s+there\s+any\s+sinkholes?\s+in\s+any\s+of\s+the\s+beaches\??|asa\s+na\s+beaches?\s+ang\s+dali\s+molawm\??)$/i.test(
      lower.trim()
    )
  ) {
    return true;
  }

  return false;
}

function matchSpecificOriginInText(text: string): { origin: SpecificOriginRoute; matchedWord: string } | null {
  for (const origin of SPECIFIC_CEBU_ORIGINS) {
    const match = text.match(origin.pattern);
    if (match) {
      return { origin, matchedWord: match[0] };
    }
  }
  return null;
}

/**
 * Specifically answers "Pinakaduol na beach gikan ari sa location (specific)"
 * and broad "Unsay pinakaduol na beach?"
 * Rule:
 * – Ang pinakaduol kay ang Raniola if sa south gikan ang location
 * – Ang pinakaduol kay ang Hinagdan if sa north magikan ang location
 * – Broad: Answer all the beaches (if sa north gikan kay raniola if coming from south; if sa north gikan kay hinagdan).
 */
function matchNearestBeachFromLocation(userQuery: string): string | null {
  const lower = userQuery.toLowerCase();
  const lang = detectLanguage(userQuery);
  const isCeb = lang === 'ceb';

  if (!isNearestBeachQuery(userQuery)) return null;

  const specificOriginMatch = matchSpecificOriginInText(userQuery);

  // User specified a location
  if (specificOriginMatch) {
    const { origin, matchedWord } = specificOriginMatch;
    const placeName = `${matchedWord.charAt(0).toUpperCase()}${matchedWord.slice(1)}`;

    if (origin.direction === 'north') {
      if (isCeb) {
        return `**Pinakaduol nga beach gikan sa ${placeName} (${origin.label}):**\n• Tungod kay gikan ka sa **North**, ang unang maagian ug **pinakaduol nga beach** sa Barangay Binongkalan kay ang **Hinagdan Beach** (gisundan dayon sa **Majestique Beach**, **Lite Bay Resort**, ug **Rañola Beach**).\n• **Oras sa Byahe:** **${origin.timeCeb}**\n• **Unsaon Pag-adto:** ${origin.stepsCeb}`;
      }
      return `**Nearest beach from ${placeName} (${origin.label}):**\n• Since you are coming from the **North**, the first and **nearest beach** you reach in Barangay Binongkalan is **Hinagdan Beach** (followed immediately by **Majestique Beach**, **Lite Bay Resort**, and **Rañola Beach**).\n• **Travel Time:** **${origin.timeEn}**\n• **How to Commute:** ${origin.stepsEn}`;
    }

    // South or mountain direction
    if (isCeb) {
      return `**Pinakaduol nga beach gikan sa ${placeName} (${origin.label}):**\n• Tungod kay gikan ka sa **South**, ang unang maagian ug **pinakaduol nga beach** sa Barangay Binongkalan kay ang **Rañola Beach (Raniola)** (gisundan dayon sa **Lite Bay Resort**, **Majestique Beach**, ug **Hinagdan Beach**).\n• **Oras sa Byahe:** **${origin.timeCeb}**\n• **Unsaon Pag-adto:** ${origin.stepsCeb}`;
    }
    return `**Nearest beach from ${placeName} (${origin.label}):**\n• Since you are coming from the **South**, the first and **nearest beach** you reach in Barangay Binongkalan is **Rañola Beach (Raniola)** (followed immediately by **Lite Bay Resort**, **Majestique Beach**, and **Hinagdan Beach**).\n• **Travel Time:** **${origin.timeEn}**\n• **How to Commute:** ${origin.stepsEn}`;
  }

  // Broad query: "Unsay pinakaduol na beach?"
  if (isCeb) {
    return `Mao kini ang tubag para sa **pinakaduol nga beach** sa Barangay Binongkalan:\n\n• **Kung gikan ka sa South** (sama sa Cebu City, Mandaue, Consolacion, Liloan, Compostela, Danao, Carmen, o Catmon Proper):\n  ➔ Ang pinakaduol ug unang maagian kay ang **Rañola Beach (Raniola)**.\n  ➔ Pagkasunod-sunod sa mga beach: **Rañola Beach** ➔ **Lite Bay Resort** ➔ **Majestique Beach** ➔ **Hinagdan Beach**.\n\n• **Kung gikan ka sa North** (sama sa Sogod, Borbon, Tabogon, Bogo City, San Remigio, Medellin, o Daanbantayan):\n  ➔ Ang pinakaduol ug unang maagian kay ang **Hinagdan Beach**.\n  ➔ Pagkasunod-sunod sa mga beach: **Hinagdan Beach** ➔ **Majestique Beach** ➔ **Lite Bay Resort** ➔ **Rañola Beach**.\n\n💡 **Tip:** Pwede nimong i-type ang imong eksaktong lokasyon (pananglitan: *"Pinakaduol gikan sa Talamban"* o *"Pinakaduol gikan sa Bogo"*) aron mahatagan tika sa eksaktong oras sa byahe ug commute!`;
  }

  return `Here is the guide for the **nearest beach** in Barangay Binongkalan:\n\n• **If coming from the South** (such as Cebu City, Mandaue, Consolacion, Liloan, Compostela, Danao, Carmen, or Catmon Proper):\n  ➔ The nearest and first beach reached is **Rañola Beach (Raniola)**.\n  ➔ Order of beaches: **Rañola Beach** ➔ **Lite Bay Resort** ➔ **Majestique Beach** ➔ **Hinagdan Beach**.\n\n• **If coming from the North** (such as Sogod, Borbon, Tabogon, Bogo City, San Remigio, Medellin, or Daanbantayan):\n  ➔ The nearest and first beach reached is **Hinagdan Beach**.\n  ➔ Order of beaches: **Hinagdan Beach** ➔ **Majestique Beach** ➔ **Lite Bay Resort** ➔ **Rañola Beach**.\n\n💡 **Tip:** You can ask with your exact starting location (for example: *"Nearest beach from Talamban"* or *"from Bogo"*) to get the exact travel time and step-by-step commute!`;
}

/**
 * Commute guide handler (origin-specific and general)
 */
function matchCebuCommuteAndTravelHours(
  userQuery: string,
  wasPreviousTurnCommute: boolean = false,
  contextBeach?: BeachKey
): string | null {
  if (isNearestBeachQuery(userQuery)) {
    return matchNearestBeachFromLocation(userQuery);
  }

  const lower = userQuery.toLowerCase();
  const lang = detectLanguage(userQuery);
  const specificOriginMatch = matchSpecificOriginInText(userQuery);
  const isCommute =
    isExplicitCommuteText(userQuery) ||
    (wasPreviousTurnCommute && (Boolean(specificOriginMatch) || /\b(cebu city|catmon|north|south)\b/i.test(lower)));

  if (!isCommute) return null;

  // 1. SPECIFIC origin matched
  if (specificOriginMatch) {
    const { origin, matchedWord } = specificOriginMatch;
    const displayPlace =
      matchedWord.length <= 3
        ? origin.label
        : `${matchedWord.charAt(0).toUpperCase()}${matchedWord.slice(1)} (${origin.label})`;

    if (lang === 'ceb') {
      return `**Byahe gikan sa ${displayPlace} padulong sa Barangay Binongkalan, Catmon:**\n• **Oras sa Byahe:** **${origin.timeCeb}**\n• **Unsaon Pag-commute:**\n${origin.stepsCeb}`;
    }
    return `**Commute from ${displayPlace} to Barangay Binongkalan, Catmon:**\n• **Estimated Travel Time:** **${origin.timeEn}**\n• **How to Commute:**\n${origin.stepsEn}`;
  }

  // 2. Specific beach commute inquiry (e.g. "How to commute to Rañola Beach?" or "How to commute to this beach?")
  let beachesInQuery = detectBeachesInText(userQuery);
  if (
    beachesInQuery.length === 0 &&
    contextBeach &&
    /\b(this\s*beach|kani\s*(nga|na)\s*beach|ni\s*(nga|na)\s*beach|ani\s*(nga|na)\s*beach|diri\s*(nga|na)\s*beach|ari\s*(nga|na)\s*beach)\b/i.test(lower)
  ) {
    beachesInQuery = [contextBeach];
  }

  if (beachesInQuery.length === 1) {
    const b = BEACH_DATA[beachesInQuery[0]];
    if (lang === 'ceb') {
      return `**Unsaon pag-commute padulong sa ${b.name}:**\n1. Adto sa **Cebu North Bus Terminal (sa SM City Cebu, Brgy. Mabolo)**.\n2. Sakay og bisan unsang **Ceres bus o mini-bus pa-Norte** (nga padulong Sogod, Bogo, Medellin, o Maya).\n3. Ingna ang konduktor nga manaog ka sa **${b.name}** sa Barangay Binongkalan, Catmon (subay ra kini sa national highway).\n• **Oras sa Byahe:** Mga **1.5 hangtod 2 ka oras** gikan sa Cebu City.`;
    }
    return `**How to commute to ${b.name}:**\n1. Go to the **Cebu North Bus Terminal (at SM City Cebu, Brgy. Mabolo)**.\n2. Board any **northbound Ceres bus or mini-bus** (bound for Sogod, Bogo, Medellin, or Maya).\n3. Tell the conductor to drop you off right at **${b.name}** along the national highway in Barangay Binongkalan, Catmon.\n• **Estimated Travel Time:** Around **1.5 to 2 hours** from Cebu City.`;
  }

  // 3. General Commute Summary
  if (lang === 'ceb') {
    return `Mao kini ang **oras sa byahe ug commute** padulong sa mga beach sa **Barangay Binongkalan, Catmon**:\n\n• **Gikan sa Cebu City (SM City Cebu North Bus Terminal):** **1.5 – 2 ka oras** (sakay og Ceres bus pa-Norte)\n• **Gikan sa Mandaue City:** **1 hr 15 mins – 1 hr 45 mins**\n• **Gikan sa Lapu-Lapu / Mactan:** **2 – 2.5 ka oras**\n• **Gikan sa North Cebu (Sogod, Bogo, Daanbantayan):** **10 mins – 2 ka oras** (sakay og bus pa-South)\n• **Gikan sa South Cebu (Talisay, Minglanilla, Naga, Carcar):** **2.5 – 3.5 ka oras** (transfer sa SM North Bus Terminal)\n\n💡 **Tip:** Isulti ang imong barangay o lungsod (pananglitan: *"Byahe gikan sa Talamban"*) aron mahatagan tika sa step-by-step nga commute!`;
  }

  return `Here is the **commute travel guide** to the beaches in **Barangay Binongkalan, Catmon, Cebu**:\n\n• **From Cebu City (SM City Cebu North Bus Terminal):** **1.5 to 2 hours** (ride any northbound Ceres bus bound for Sogod, Bogo, or Maya)\n• **From Mandaue City:** **1 hr 15 mins to 1 hr 45 mins**\n• **From Lapu-Lapu City / Mactan:** **2 to 2.5 hours**\n• **From North Cebu (Sogod, Bogo, Daanbantayan):** **10 mins to 2 hours** (southbound bus)\n• **From South Cebu (Talisay, Minglanilla, Naga, Carcar):** **2.5 to 3.5 hours** (transfer via SM North Bus Terminal)\n\n💡 **Tip:** Tell me your starting town or barangay (for example: *"Commute from Talamban"*) to get step-by-step directions!`;
}

/**
 * Checks whether a single-beach query without a specific topic flag is asking for a general overview
 * (e.g. "Rañola Beach", "Tell me about Hinagdan", "Unsa man sa Lite Bay?")
 * rather than asking an unverified/unanswerable specific question.
 */
function isGeneralBeachOverviewQuery(lower: string): boolean {
  const stripped = lower
    .replace(/\b(rañola|ranola|raniola|lite\s*bay|litebay|light\s*bay|majestique|majestic|hinagdan|beach|beaches|resort|resorts)\b/gi, '')
    .replace(/\b(can\s+you|could\s+you|would\s+you|please|bai|bro|for\s+me|more|all|the|this|that|there|it|them|those|one|ones|first|second|third|fourth|last|kani|kana|didto|diri|ari|ni|ani|nila)\b/gi, '')
    .replace(/[^\w\sñ]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!stripped) return true;
  return /^(tell\s*me(\s*about|\s*on)?|what\s*about|how\s*about|what\s*is\s*like|how\s*is|info(\s*about|\s*on)?|information(\s*about|\s*on)?|details(\s*about|\s*of|\s*on)?|give\s*me\s*(info|information|details|overview)(\s*about|\s*on|\s*of)?|describe|overview(\s*of)?|profile(\s*of)?|share(\s*about|\s*details)?|explain(\s*about)?|unsa\s*man(\s*ang|\s*sa|\s*na)?|unsay\s*naa(\s*sa)?|unsay\s*detalye(\s*sa)?|i\s*detalye(\s*daw)?|kumusta(\s*ang|\s*sa)?|musta(\s*ang|\s*sa)?|about|sa|ang|in|at|for|unsa\s*ang)$/i.test(
    stripped
  );
}

/**
 * Builds specific answers for a single beach
 */
function buildSpecificSingleBeachAnswer(
  b: StructuredBeachData,
  lower: string,
  lang: 'ceb' | 'tl' | 'en',
  asks: TopicFlags
): string | null {
  const isCeb = lang === 'ceb';

  // Specific single topic checks
  if (asks.asksBatoon || asks.asksMostRocky) {
    return isCeb ? b.batoonCeb : b.batoonEn;
  }

  if (asks.asksSugba) {
    return isCeb ? b.sugbaCeb : b.sugbaEn;
  }

  if (asks.asksSafest || asks.asksSafety) {
    return isCeb ? b.safeCeb : b.safeEn;
  }

  if (asks.asksLifeguard) {
    return isCeb ? b.lifeguardCeb : b.lifeguardEn;
  }

  if (asks.asksStore) {
    return isCeb ? b.storeCeb : b.storeEn;
  }

  if (asks.asksShower) {
    return isCeb ? b.showerCeb : b.showerEn;
  }

  if (asks.asksSenior) {
    return isCeb ? b.seniorCeb : b.seniorEn;
  }

  if (asks.asksSinkhole) {
    return isCeb ? b.sinkholeCeb : b.sinkholeEn;
  }

  if (asks.asksMolawm) {
    return isCeb ? b.molawmCeb : b.molawmEn;
  }

  if (asks.asksPets) {
    return isCeb ? b.petsCeb : b.petsEn;
  }

  if (asks.asksTide) {
    return isCeb ? b.tideCeb : b.tideEn;
  }

  if (asks.asksEntrance && asks.asksCottage) {
    return isCeb
      ? `Sa **${b.name}**:\n• **Entrance Fee:** ${b.entranceCeb}\n• **Cottage / Table:** ${b.cottagesCeb}`
      : `At **${b.name}**:\n• **Entrance Fee:** ${b.entranceEn}\n• **Cottages / Tables:** ${b.cottagesEn}`;
  }

  if (asks.asksEntrance) {
    return isCeb ? `Sa **${b.name}**: ${b.entranceCeb}` : `At **${b.name}**: ${b.entranceEn}`;
  }

  if (asks.asksCottage) {
    return isCeb ? `Sa **${b.name}**: ${b.cottagesCeb}` : `At **${b.name}**: ${b.cottagesEn}`;
  }

  if (asks.asksRoom) {
    return isCeb ? `Sa **${b.name}**: ${b.roomsCeb}` : `At **${b.name}**: ${b.roomsEn}`;
  }

  if (asks.asksHours) {
    return isCeb ? `Sa **${b.name}**: ${b.hoursCeb}` : `At **${b.name}**: ${b.hoursEn}`;
  }

  if (asks.asksParking) {
    return isCeb ? `Sa **${b.name}**: ${b.parkingCeb}` : `At **${b.name}**: ${b.parkingEn}`;
  }

  if (asks.asksRestroom) {
    return isCeb ? `Sa **${b.name}**: ${b.restroomCeb}` : `At **${b.name}**: ${b.restroomEn}`;
  }

  if (asks.asksContact) {
    return isCeb ? `Ang contact number sa **${b.name}** kay: **${b.contact}**.` : `The contact number for **${b.name}** is: **${b.contact}**.`;
  }

  if (asks.asksActivities || asks.asksRentals) {
    if (b.key === 'ranola') {
      return isCeb
        ? `Sa **${b.name}**: Pwede maligo, magsugba, ug mag-overnight tent camping. Naay maabangan nga **salbabida tag ₱30**.`
        : `At **${b.name}**: Guests can enjoy swimming, grilling, and overnight tent camping. **Floaters (salbabida)** are available for rent for **₱30**.`;
    }
    if (b.key === 'litebay') {
      return isCeb
        ? `Sa **${b.name}**: Pwede maligo, magsugba, ug mag-kayak (**₱200 sa 2 ka oras**). Naay maabangan nga **life jacket tag ₱50**.`
        : `At **${b.name}**: Guests can enjoy swimming, grilling, and **kayaking (₱200 for 2 hours)**. **Life jackets** are available for rent for **₱50**.`;
    }
    if (b.key === 'majestique') {
      return isCeb
        ? `Sa **${b.name}**: Pwede maligo, magsugba, ug mag-overnight stay. Naay maabangan nga **life jacket tag ₱50**.`
        : `At **${b.name}**: Guests can enjoy swimming, grilling, and overnight stays. **Life jackets** are available for rent for **₱50**.`;
    }
    return isCeb
      ? `Sa **${b.name}**: Pwede maligo sa balas nga baybayon, magsugba, ug mag-overnight. Naay maabangan nga **salbabida (₱50)** ug **life jackets (₱50–₱100)**.`
      : `At **${b.name}**: Guests can enjoy swimming on the sandy shore, grilling, and overnight stays. **Floaters (₱50)** and **life jackets (₱50–₱100)** are available for rent.`;
  }

  if (asks.asksLocation) {
    return isCeb
      ? `Ang **${b.name}** kay nahimutang sa **Barangay Binongkalan, Catmon, Cebu** (daplin ra mismo sa Cebu North National Highway).`
      : `**${b.name}** is located in **Barangay Binongkalan, Catmon, Cebu** (right along the Cebu North National Highway).`;
  }

  if (asks.asksPrivateBooking) {
    return isCeb
      ? `**Walay private kay open sya sa tanan** — ang **${b.name}** kay abli para sa tanan ug walk-ins are welcome.`
      : `**No private booking (open to everyone)** — **${b.name}** cannot be booked exclusively because it is open to all visitors (walk-ins are welcome).`;
  }

  if (asks.asksDiscount) {
    return isCeb
      ? `**Wala** — walay discount sa **${b.name}** bisan kung naay event (regular rates apply).`
      : `**No discounts** — **${b.name}** does not offer special event discounts (regular rates apply).`;
  }

  // Only return the general beach profile if the user actually asked for a general overview of the beach
  if (!isGeneralBeachOverviewQuery(lower)) {
    return null;
  }

  // General profile of single beach
  if (isCeb) {
    return `Mao kini ang mga detalye sa **${b.name}**:\n• **Oras sa Pag-abli:** ${b.hoursCeb}\n• **Entrance Fee:** ${b.entranceCeb}\n• **Cottage / Table:** ${b.cottagesCeb}\n• **Kwarto / Overnight:** ${b.roomsCeb}\n• **Batoon ba:** ${b.batoonCeb}\n• **Sugbaanan:** ${b.sugbaCeb}\n• **Senior Citizens:** ${b.seniorCeb}\n• **Sinkhole:** ${b.sinkholeCeb}\n• **Dali molawm:** ${b.molawmCeb}\n• **Pets:** ${b.petsCeb}\n• **Contact:** ${b.contact}`;
  }

  return `Here are the details for **${b.name}**:\n• **Operating Hours:** ${b.hoursEn}\n• **Entrance Fee:** ${b.entranceEn}\n• **Cottages / Tables:** ${b.cottagesEn}\n• **Rooms / Overnight:** ${b.roomsEn}\n• **Shoreline:** ${b.batoonEn}\n• **Grilling Area:** ${b.sugbaEn}\n• **Senior Citizen Accessibility:** ${b.seniorEn}\n• **Sinkhole:** ${b.sinkholeEn}\n• **Water Depth:** ${b.molawmEn}\n• **Pets:** ${b.petsEn}\n• **Contact:** ${b.contact}`;
}

/**
 * Detects if the user typed random letters, keyboard mashes, gibberish, or unintelligible text.
 */
export function isRandomOrGibberishInput(userQuery: string): boolean {
  const trimmed = userQuery.trim();
  if (!trimmed) return true;

  const lower = trimmed.toLowerCase();

  // 1. Only symbols, punctuation, or numbers (e.g. "???", "...", "12345", "!@#$")
  const lettersOnly = lower.replace(/[^a-zñ]/gi, '');
  if (lettersOnly.length === 0) {
    return true;
  }

  // 2. Very short single-letter or 2-letter inputs that are not valid short words
  const validShortWords = new Set(['hi', 'yo', 'ty', 'oo', 'no', 'ok', 'cr', 'ac', 'fb', 'sm']);
  if (lettersOnly.length <= 2 && !validShortWords.has(lettersOnly)) {
    return true;
  }

  // 3. Same character repeated 4 or more times in a row (e.g. "aaaaa", "zzzzz", "hhhhh", "kkkkk")
  if (/(.)\1{3,}/i.test(lettersOnly)) {
    return true;
  }

  // 4. Common keyboard mash sequences or repetitive syllable gibberish
  if (
    /(asdf|sdfg|dfgh|fghj|ghjk|hjkl|qwerty|qwert|werty|ertyu|rtyui|tyuio|yuiop|zxcv|xcvb|cvbn|vbnm|fdsa|gfds|hgfd|jhgf|kjhg|lkjh|poiu|oiuy|iuyt|uytr|ytre|rewq|mnbv|nbvc|bvcx|vcxz|qazwsx|wsxedc|plmokn|asdasd|qweqwe|zxczxc|dfgdfg|cvbcvb|jkjkjk|fgfgfg|lklklk|hahaha|hehehe|hihihi|huhuhu|lololol|blabla|nyenye|sksksk)/i.test(
      lower
    )
  ) {
    return true;
  }

  // 5. Extract alphabetic words
  const words = lower.match(/[a-zñ]+/gi) || [];
  if (words.length === 0) return true;

  // Check if any word has 5+ consecutive consonants (e.g. "kjhfg", "bvcxz", "sdfgh", "plmkn")
  const hasExtremeConsonantCluster = words.some((w) => /[bcdfghjklmnpqrstvwxz]{5,}/i.test(w));
  if (hasExtremeConsonantCluster) {
    return true;
  }

  // Check if all words lack vowels (and aren't valid short abbreviations)
  const validVowelLessWords = new Set([
    'ty',
    'tysm',
    'cr',
    'fb',
    'sm',
    'km',
    'hr',
    'hrs',
    'st',
    'brgy',
    'srp',
    'csbt',
    'bbq',
    'pwd',
    'atm',
    'tv',
    'id',
    'vs',
  ]);
  const allWordsLackVowels = words.every(
    (w) => !/[aeiouy]/i.test(w) && !validVowelLessWords.has(w)
  );
  if (allWordsLackVowels) {
    return true;
  }

  // 6. Single-word gibberish check: if the user typed a single long word (> 8 chars) with very low vowel ratio (< 18%)
  if (words.length === 1 && words[0].length > 8) {
    const vowelCount = (words[0].match(/[aeiouy]/gi) || []).length;
    if (vowelCount / words[0].length < 0.18) {
      return true;
    }
  }

  return false;
}

/**
 * Detects if the user is explicitly asking about an unverified topic or feature
 * that is NOT in our verified database (so we never falsely trigger a known topic).
 */
export function isAskingUnverifiedTopic(lower: string): boolean {
  return /\b(pool|swimming\s*pool|wifi|wi-fi|internet|password|signal|videoke|karaoke|magic\s*sing|corkage|alcohol|liquor|beer|red\s*horse|tanduay|alak|jet\s*ski|jetski|banana\s*boat|parasailing|scuba(\s*diving)?|island\s*hopping|pumpboat|bangka|yacht|speedboat|gcash|paymaya|credit\s*card|debit\s*card|atm|bank\s*transfer|spa|massage|jacuzzi|sauna|gym|buffet|billiards|bowling|television|refrigerator|rice\s*cooker|heater|hot\s*shower|towel|tuwalya|pillow|unlan|blanket|habol|electric\s*fan|generator|drone|bonfire|fireworks|curfew|refund|cancellation|owner|tag-iya|manager|mayor|kapitan|barangay\s*captain|turtle\s*point|boracay|palawan|siargao|bohol|panglao|bantayan|malapascua|camotes|sumilon|kawasan|oslob\s*whale|ocean\s*park|safari|anjo\s*world)\b/i.test(
    lower
  );
}

/**
 * Fast response when the user types random letters, gibberish, or unrecognized typings.
 */
export function getBaiRandomInputFallback(userQuery: string, userName?: string | null): string {
  const firstName = userName ? userName.trim().split(/\s+/)[0] : '';
  const nameSuffix = firstName ? `, ${firstName}` : '';

  return `Sorry${nameSuffix}, I did not understand your message. Please be more concise and clear with your question.`;
}

/**
 * Fast, direct, and formal response when asked information that cannot be answered / is not in the database.
 */
export function getCommuteKnowledgeContext(): string {
  return SPECIFIC_CEBU_ORIGINS.map(
    (route) =>
      `• Origin: ${route.label} (${route.direction.toUpperCase()})\n  - Travel Time: ${route.timeEn} (Bisaya: ${route.timeCeb})\n  - Commute Steps (EN): ${route.stepsEn}\n  - Commute Steps (Bisaya): ${route.stepsCeb}`
  ).join('\n\n');
}

export function getBaiApologyFallback(userQuery: string, userName?: string | null): string {
  const lang = detectLanguage(userQuery);
  const lower = userQuery.toLowerCase();
  const firstName = userName ? userName.trim().split(/\s+/)[0] : '';
  const nameSuffix = firstName ? `, **${firstName}**` : '';

  if (isAskingUnverifiedTopic(lower)) {
    if (lang === 'ceb') {
      return `Maayong pangutana kana${nameSuffix}! 😊 Apan pasensya na, **kana nga detalye kay wala pa sa among beripikadong database** (this information is not available). Isip si **Bai, imong local guide**, ang ako rang mahatag kay ang beripikadong impormasyon bahin sa **4 ka beach sa Barangay Binongkalan, Catmon, Cebu** (**Rañola Beach**, **Lite Bay Resort**, **Majestique Beach**, ug **Hinagdan Beach**)—sama sa entrance fee, cottage, kwarto, baybayon, sugbaanan, ug unsaon pag-commute. Gusto ba nimo nga ihatag nako ang ilang contact number aron makapangutana ka diretso nila?`;
    }
    if (lang === 'tl') {
      return `Magandang tanong po iyan${nameSuffix}! 😊 Ngunit pasensya na po, **ang impormasyong ito ay wala sa aming beripikadong database** (this information is not available). Bilang si **Bai, local guide**, ang masasagot ko lamang po ay ang mga beripikadong detalye tungkol sa **4 na beach at commute sa Barangay Binongkalan, Catmon, Cebu** (**Rañola Beach**, **Lite Bay Resort**, **Majestique Beach**, at **Hinagdan Beach**). Gusto niyo po bang ibigay ko ang contact number ng resort para matawagan niyo sila nang direkta?`;
    }
    return `That's a great thing to check before your trip${nameSuffix}! 😊 However, **this information is not available** in our verified system records right now. As **Bai, your local guide**, I can only provide verified details for the **4 beaches and commute routes in Barangay Binongkalan, Catmon, Cebu** (**Rañola Beach**, **Lite Bay Resort**, **Majestique Beach**, and **Hinagdan Beach**)—such as entrance fees, cottages, overnight rooms, shoreline conditions, grilling areas, and commute steps. Would you like me to share their contact numbers so you can ask the resort directly?`;
  }

  if (lang === 'ceb') {
    return `Ganahan unta ko motubag ana${nameSuffix}, apan ako si **Bai, imong local guide** para lang gyud sa **Dagat Ta Bai**! 😊 Ang ako rang matubag kay ang mga pangutana bahin sa **4 ka opisyal nga beach** (**Rañola Beach**, **Lite Bay Resort**, **Majestique Beach**, ug **Hinagdan Beach**) ug **unsaon pag-commute** diri sa **Barangay Binongkalan, Catmon, Cebu** (this information is not available outside our beach and commute system).\n\nPwede kaayo ko nimo pangutan-on kung asay pinaka-safe o pinakabarato nga beach, tagpila ang cottages ug kwarto, o unsaon pag-commute gikan sa inyong lugar!`;
  }

  if (lang === 'tl') {
    return `Nais ko man pong sagutin iyan${nameSuffix}, ako po si **Bai, ang inyong local guide** para lamang sa **Dagat Ta Bai**! 😊 Ang masasagot ko lamang po ay tungkol sa **4 na opisyal na beach** (**Rañola Beach**, **Lite Bay Resort**, **Majestique Beach**, at **Hinagdan Beach**) at **kung paano mag-commute** sa **Barangay Binongkalan, Catmon, Cebu** (this information is not available outside our system).\n\nPwede niyo po akong tanungin tungkol sa entrance fees, cottages, rooms, kung aling beach ang hindi mabato, o paano bumiyahe papunta rito!`;
  }

  return `I'd love to chat about that${nameSuffix}, but I'm **Bai, your local guide** built specifically for **Dagat Ta Bai**! 😊 I can only answer questions about the **4 verified beaches** (**Rañola Beach**, **Lite Bay Resort**, **Majestique Beach**, and **Hinagdan Beach**) and **commute directions** here in **Barangay Binongkalan, Catmon, Cebu** (this information is not available outside our beach and commute system).\n\nFeel free to ask me which beach fits your trip best, how much entrance fees and cottages cost, or how to commute here from your location!`;
}

interface ConversationContextState {
  focusBeaches: BeachKey[];
  orderedListedBeaches: BeachKey[];
  previousTopics: TopicFlags | null;
  wasPreviousTurnCommute: boolean;
  lastUserText: string;
  lastAssistantText: string;
}

function extractConversationContext(
  conversationHistory: { role: 'user' | 'assistant'; text: string }[]
): ConversationContextState {
  let focusBeaches: BeachKey[] = [];
  let orderedListedBeaches: BeachKey[] = ['ranola', 'litebay', 'majestique', 'hinagdan'];
  let previousTopics: TopicFlags | null = null;
  let wasPreviousTurnCommute = false;
  let lastUserText = '';
  let lastAssistantText = '';

  for (let i = conversationHistory.length - 1; i >= 0; i--) {
    const entry = conversationHistory[i];
    if (!lastAssistantText && entry.role === 'assistant') {
      lastAssistantText = entry.text;
      const inReply = detectBeachesInText(entry.text);
      if (inReply.length > 0) {
        orderedListedBeaches = inReply;
      }
    }
    if (!lastUserText && entry.role === 'user') {
      lastUserText = entry.text;
      if (isExplicitCommuteText(entry.text) || isNearestBeachQuery(entry.text)) {
        wasPreviousTurnCommute = true;
      }
    }
    if (!previousTopics && entry.role === 'user') {
      const t = detectTopicsInText(entry.text);
      if (hasAnyTopic(t)) {
        previousTopics = t;
      }
    }
  }

  // Determine focusBeaches (1 or 2 beaches most recently focused on)
  for (let i = conversationHistory.length - 1; i >= 0; i--) {
    const text = conversationHistory[i].text;
    const allInTurn = detectBeachesInText(text);
    if (allInTurn.length === 1 || allInTurn.length === 2) {
      focusBeaches = allInTurn;
      break;
    }
    // If an assistant reply mentions 1 or 2 beaches in the first paragraph and all 4 in a footer paragraph, extract the first paragraph's beaches!
    if (conversationHistory[i].role === 'assistant' && allInTurn.length > 2) {
      const firstParagraph = text.split(/\n\s*\n/)[0] || '';
      const firstParaBeaches = detectBeachesInText(firstParagraph);
      if (firstParaBeaches.length === 1 || firstParaBeaches.length === 2) {
        focusBeaches = firstParaBeaches;
        break;
      }
    }
  }

  return {
    focusBeaches,
    orderedListedBeaches,
    previousTopics,
    wasPreviousTurnCommute,
    lastUserText,
    lastAssistantText,
  };
}

function resolveOrdinalOrDescriptiveBeach(
  lower: string,
  orderedListedBeaches: BeachKey[]
): BeachKey[] {
  const list =
    orderedListedBeaches.length > 0
      ? orderedListedBeaches
      : (['ranola', 'litebay', 'majestique', 'hinagdan'] as BeachKey[]);

  if (/\b(the\s+first(\s+one|\s+beach)?|first\s+beach|number\s*1|#1|1st(\s+one|\s+beach)?|ang\s+una(ng\s+beach)?)\b/i.test(lower)) {
    return [list[0]];
  }
  if (
    /\b(the\s+second(\s+one|\s+beach)?|second\s+beach|number\s*2|#2|2nd(\s+one|\s+beach)?|ang\s+ikaduha|ikaduha(ng\s+beach)?)\b/i.test(
      lower
    ) &&
    list.length >= 2
  ) {
    return [list[1]];
  }
  if (
    /\b(the\s+third(\s+one|\s+beach)?|third\s+beach|number\s*3|#3|3rd(\s+one|\s+beach)?|ang\s+ikatulo|ikatulo(ng\s+beach)?)\b/i.test(
      lower
    ) &&
    list.length >= 3
  ) {
    return [list[2]];
  }
  if (
    /\b(the\s+fourth(\s+one|\s+beach)?|fourth\s+beach|the\s+last(\s+one|\s+beach)?|last\s+beach|number\s*4|#4|4th(\s+one|\s+beach)?|ang\s+ikaupat|ang\s+ulahi(ng\s+beach)?)\b/i.test(
      lower
    ) &&
    list.length >= 2
  ) {
    return [list[list.length - 1]];
  }
  if (/\b(the\s+sandy\s+(one|beach)|kanang\s+balas)\b/i.test(lower)) {
    return ['hinagdan'];
  }
  if (/\b(the\s+safest\s+(one|beach)|the\s+flat\s+(one|beach))\b/i.test(lower)) {
    return ['ranola'];
  }
  if (/\b(the\s+one\s+with\s+kayak)\b/i.test(lower)) {
    return ['litebay'];
  }
  return [];
}

function matchTailoredRecommendation(lower: string, isCeb: boolean): string | null {
  const isAskingRecommendation =
    /\b(recommend|suggestion|suggest|best\s+for|good\s+for|ideal\s+for|perfect\s+for|which\s+beach|what\s+beach|asa\s+nindot|asay\s+nindot|unsay\s+nindot|unsay\s+ma\s*recommend|asa\s+angay|asay\s+angay|for\s+someone\s+who|para\s+sa\s+mahilig)\b/i.test(
      lower
    );

  // 1. Jumping / diving / deep water swimming ("someone who likes to jump", "likes deep water", "mahilig mo-ambak")
  if (
    /\b(jump|jumping|jumps|dive|diving|cliff|ambak|mo\s*ambak|lukso|mo\s*lukso|deep\s*water|deep\s*swimmer|strong\s*swimmer)\b/i.test(
      lower
    )
  ) {
    if (isCeb) {
      return `Para sa mahilig **mo-ambak (jump) o molangoy sa lawom nga tubig**, akong irekomendar ang **Lite Bay Resort** ug **Majestique Beach**! 🌊🏊‍♂️\n\n• **Lite Bay Resort (Entrance: ₱50):** Dali kini molawm tungod kay dili kini mohunas ug pamaayo bisan low tide. Naa sab silay **kayak (₱200 / 2 hrs)** ug libre nga parking, CR, ug shower.\n• **Majestique Beach (Entrance: ₱30):** Dali sab molawm ang tubig ug **dili ra batoon** ang baybayon, plus naa silay cottages ug overnight rooms.\n\n⚠️ **Safety Reminder:** Walay on-duty lifeguard sa mga beach sa Binongkalan (naay maabangan nga life jackets tag **₱50**), busa pag-amping pirmi ug i-check una ang kalawmon sa dili pa mo-ambak!\n\nAsa aning duha (**Lite Bay Resort** o **Majestique Beach**) ang gusto nimong mahibaw-an pa?`;
    }
    return `For someone who loves **jumping in or swimming in deeper water**, I highly recommend **Lite Bay Resort** and **Majestique Beach**! 🌊🏊‍♂️\n\n• **Lite Bay Resort (Entrance: ₱50):** Gets deep quickly because the water stays deep even during low tide. It also offers **kayaking (₱200 / 2 hrs)** and free parking, restroom, and showers.\n• **Majestique Beach (Entrance: ₱30):** Also gets deep quickly with a **non-rocky shoreline**, plus day/overnight cottages and rooms.\n\n⚠️ **Safety Note:** None of the beaches in Binongkalan have lifeguards on duty (life jackets are available for rent at **₱50**), so always check the water depth before jumping in!\n\nWould you like to know more about **Lite Bay Resort** or **Majestique Beach**, or how to commute there?`;
  }

  if (!isAskingRecommendation) return null;

  // 2. Kids / babies / family / shallow water / beginners
  if (/\b(kid|kids|child|children|baby|babies|toddler|toddlers|bata|mga\s*bata|family|pamilya|beginner|non-swimmer|cant\s*swim|can't\s*swim|shallow|mababaw)\b/i.test(lower)) {
    return isCeb
      ? `Para sa **pamilya ug mga bata (kids)**, ang akong top recommendation kay ang **Rañola Beach (Raniola)** ug **Hinagdan Beach**! 👨‍👩‍👧‍👦🏖️\n\n• **Rañola Beach (Entrance: ₱20–₱30):** Mao kini ang **pinaka-safe para sa mga bata ug senior citizens** kay patag ang agianan (walay daghang hagdanan) ug hinay-hinay ra molawm ang tubig.\n• **Hinagdan Beach (Entrance: ₱30–₱50):** **Balas (sandy shoreline)** ug dili batoon, ug hinay-hinay ra sab molawm.\n\nAsa aning duha ang gusto nimong tan-awon ang presyo sa cottage o kwarto?`
      : `For **families and kids**, my top recommendations are **Rañola Beach (Raniola)** and **Hinagdan Beach**! 👨‍👩‍👧‍👦🏖️\n\n• **Rañola Beach (Entrance: ₱20–₱30):** Considered the **safest beach for children and seniors** because the entrance is flat (no steep stairs) and the water has a gentle, gradual slope.\n• **Hinagdan Beach (Entrance: ₱30–₱50):** Features a **natural sandy shoreline** and gradual water depth that doesn't get deep quickly.\n\nWould you like to check the cottage rates or commute directions for **Rañola Beach** or **Hinagdan Beach**?`;
  }

  // 3. Budget / cheap / students / tipid
  if (/\b(budget|cheap|cheapest|affordable|student|students|tipid|barato|pinakabarato|low\s*cost|500|300|less\s*expensive)\b/i.test(lower)) {
    return isCeb
      ? `Kung nangita ka og **pinaka-budget-friendly (tipid)** nga beach sa Barangay Binongkalan, mao kini ang pinakamaayong kapilian: 💸🏖️\n\n• **Rañola Beach (Raniola):** Pinakabarato og entrance fee (**₱20** kung naay cottage, **₱30** kung wala), small cottage tag **₱500**, ug pwede mag-overnight tent camping sa regular rate!\n• **Lite Bay Resort:** Entrance **₱50**, naay table tag **₱300** ra, ug **LIBRE ang parking, CR, ug shower**!\n\nGusto ba nimo mahibaw-an ang tibuok detalye sa **Rañola Beach** o **Lite Bay Resort**?`
      : `If you're looking for the most **budget-friendly** beach in Barangay Binongkalan, here are the best picks: 💸🏖️\n\n• **Rañola Beach (Raniola):** Lowest entrance fee (**₱20** with cottage / **₱30** without), small cottages at **₱500**, and overnight **tent camping** at the regular rate!\n• **Lite Bay Resort:** Entrance is **₱50**, tables start at just **₱300**, and **parking, restrooms, and showers are completely FREE**!\n\nWould you like more details on **Rañola Beach** or **Lite Bay Resort**?`;
  }

  // 4. Overnight / staycation / couples / sleeping / rooms / aircon
  if (/\b(overnight|sleep|staycation|couple|couples|date|romantic|room|rooms|aircon|ac|tulog|higda|kwarto|camping|tent)\b/i.test(lower)) {
    return isCeb
      ? `Para sa **overnight stay o kwarto**, mao kini ang akong irekomendar sa Barangay Binongkalan: 🌙🏖️\n\n• **Hinagdan Beach:** Balas ang baybayon ug naay **short-time room (₱250 / 3 hrs)**, **ordinary room (₱1,000)**, **aircon room (₱2,500)**, ug **overnight cottage (₱700)**.\n• **Majestique Beach:** Dili ra batoon ug naay **regular room (₱2,000)**, **aircon room (₱3,500)**, ug **overnight cottages (₱800–₱1,200)**.\n• **Rañola Beach:** Walay kwarto, apan nindot kung ganahan mo mag-**overnight tent camping** (**₱20–₱30** entrance).\n\nAsa aning tulo ang gusto nimong i-check?`
      : `For an **overnight stay or room accommodation**, here are the best choices in Barangay Binongkalan: 🌙🏖️\n\n• **Hinagdan Beach:** Sandy shoreline with **short-time rooms (₱250 / 3 hrs)**, **ordinary rooms (₱1,000)**, **aircon rooms (₱2,500)**, and **overnight cottages (₱700)**.\n• **Majestique Beach:** Non-rocky shore with **regular rooms (₱2,000)**, **aircon rooms (₱3,500)**, and **overnight cottages (₱800–₱1,200)**.\n• **Rañola Beach:** No rooms, but great if you love **overnight tent camping** (**₱20–₱30** entrance).\n\nWhich of these fits your overnight plans best?`;
  }

  // 5. Barkada / big group / outing / team building / kayaking / adventure
  if (/\b(barkada|friends|group|team\s*building|outing|party|reunion|kayak|adventure|big\s*group|daghan\s*mi|barkadahan)\b/i.test(lower)) {
    return isCeb
      ? `Para sa **barkada o dakong grupo**, mao kini ang akong irekomendar: 🎉🌊\n\n• **Rañola Beach (Raniola):** Naay dako nga **Side Big Cottage (₱2,500)** nga maigo hangtod **30 ka tawo**, sugbaanan, ug pwede mag-tent camping!\n• **Lite Bay Resort:** Naay **Large Space (₱1,000)**, **kayak rental (₱200 / 2 hrs)**, ug libre ang parking, CR, ug shower.\n• **Hinagdan Beach & Majestique Beach:** Maayo kaayo kung gusto ang barkada mag-overnight sa cottage o kwarto!\n\nPila mo kabuok sa inyong grupo, o asa nga beach ang gusto nimong unahon og tan-aw?`
      : `For a **barkada trip or group outing**, here are the best options: 🎉🌊\n\n• **Rañola Beach (Raniola):** Features a huge **30-person Side Big Cottage (₱2,500)**, grilling areas, low entrance fees (**₱20** with cottage), and tent camping!\n• **Lite Bay Resort:** Offers a **Large Space (₱1,000)**, **kayak rentals (₱200 / 2 hrs)**, and free parking, restrooms, and showers.\n• **Hinagdan Beach & Majestique Beach:** Great choices if your group wants overnight cottages and air-conditioned rooms!\n\nWhich of these sounds best for your group?`;
  }

  return null;
}

function matchWhyOrFollowUpExplanation(
  lower: string,
  ctx: ConversationContextState,
  isCeb: boolean
): string | null {
  if (!/^(why|why\s+is\s+that|why\s+so|how\s+come|why\s+is\s+it|ngano|ngano\s+man|nganong\s+dili|nganong\s+safe|nganong\s+lawom|bakit)\b/i.test(lower.trim())) {
    return null;
  }

  const prevLower = `${ctx.lastUserText} ${ctx.lastAssistantText}`.toLowerCase();
  if (/\b(senior|stairs|hagdan|accessible)\b/i.test(prevLower)) {
    return isCeb
      ? `Tungod kay ang **Rañola Beach** patag ra ang agianan gikan sa highway, samtang ang **Lite Bay Resort**, **Majestique Beach**, ug **Hinagdan Beach** naay **daghang hagdanan (steep stairs)** paubos sa baybayon nga lisod naagian sa mga senior citizen.`
      : `Because **Rañola Beach** has flat, level ground right from the highway, whereas **Lite Bay Resort**, **Majestique Beach**, and **Hinagdan Beach** have **many steep stairs (daghan ug hagdanan)** going down to the shore, which is tough for senior citizens.`;
  }
  if (/\b(deep|molawm|jump|hunas|tide)\b/i.test(prevLower)) {
    return isCeb
      ? `Tungod kay ang **Lite Bay Resort** ug **Majestique Beach** **dili mohunas ug pamaayo** bisan kung low tide, mao nga pabilin nga lawom ang tubig duol sa baybayon. Samtang ang **Rañola Beach** ug **Hinagdan Beach** kay hinay-hinay (gradual) ang paglawm.`
      : `Because **Lite Bay Resort** and **Majestique Beach** do not recede deeply (**dili mohunas ug pamaayo**) even during low tide, so the water drops off and gets deep quickly near the shore. Meanwhile, **Rañola Beach** and **Hinagdan Beach** have a gentle, gradual slope.`;
  }
  if (/\b(safe|safest|bata|kids)\b/i.test(prevLower)) {
    return isCeb
      ? `Giila nga pinaka-safe ang **Rañola Beach** tungod kay patag kini sudlon (walay daghang hagdanan), hinay-hinay ra molawm ang tubig (gradual slope), ug ang sinkhole kay layo ra kaayo sa swimming area.`
      : `**Rañola Beach** is considered the safest because it has flat, easy access without steep stairs, the water depth is gradual (doesn't get deep quickly), and its sinkhole is located far out from the swimming area.`;
  }
  if (ctx.focusBeaches.length === 1) {
    const b = BEACH_DATA[ctx.focusBeaches[0]];
    return buildSpecificSingleBeachAnswer(b, 'tell me about', isCeb ? 'ceb' : 'en', detectTopicsInText(''));
  }
  return null;
}

/**
 * Main matching engine: handles specific per-beach questions, broad multi-beach questions,
 * nearest-beach queries, context continuation, random typings, and unanswerable queries instantaneously.
 */
export function matchBaiInstantAnswer(
  userQuery: string,
  userName?: string | null,
  conversationHistory: { role: 'user' | 'assistant'; text: string }[] = []
): string | null {
  const q = userQuery.trim();
  const lower = q.toLowerCase();
  const cleanWords = lower.replace(/[^\w\sñ]/gi, '').trim();
  const lang = detectLanguage(q);
  const isCeb = lang === 'ceb';
  const firstName = userName ? userName.trim().split(/\s+/)[0] : '';
  const nameSuffix = firstName ? `, **${firstName}**` : '';

  // 1. Greetings, Casual Check-ins, Thanks, Farewells, Name & Help
  if (
    /^(hi+|hello+|hey+|good\s*(morning|afternoon|evening|day)|greetings|yo+|sup+|hola|hi\s+bai|hello\s+bai|hey\s+bai|hi\s+bro|hello\s+bro|hey\s+bro|yo\s+bro|sup\s+bro)$/i.test(
      cleanWords
    )
  ) {
    return `Hello${nameSuffix}! 👋 I'm **Bai, local guide** for **Dagat Ta Bai** in Barangay Binongkalan, Catmon, Cebu. Which beach (**Rañola Beach**, **Lite Bay Resort**, **Majestique Beach**, or **Hinagdan Beach**) or commute route would you like to ask about?`;
  }

  if (
    /^(maayong\s*(adlaw|buntag|udto|hapon|gabii)|mayng\s*(adlaw|buntag|hapon|gabii)|kumusta(\s+ka)?(\s+bai|\s+bro|\s+pre)?|musta(\s+ka)?(\s+bai|\s+bro)?|ayo+)$/i.test(
      cleanWords
    )
  ) {
    return `Maayong adlaw sab kanimo${nameSuffix}! 👋 Okay kaayo ko! Ako si **Bai, local guide** diri sa Barangay Binongkalan, Catmon, Cebu. Makapangutana ka bahin sa **Rañola Beach, Lite Bay Resort, Majestique Beach, o Hinagdan Beach** ug unsaon pag-commute!`;
  }

  // Casual check-ins ("are u good bro?", "how are you?", "what's up?", "okay ra ka?", "how's your day?")
  if (
    /\b(are\s+(you|u)\s+(good|okay|ok|alright|fine|well|there|awake|online|doing\s+well|doing\s+good)|how\s+are\s+(you|u)|how\s*is\s+it\s+going|hows\s+it\s+going|how\s+are\s+things|how'?s\s+your\s+day|how\s+is\s+your\s+day|what'?s\s+up|whats\s+up|wassup|wazzup|how\s+do\s+you\s+do|you\s+good|u\s+good|is\s+everything\s+good|okay\s+ra\s+ka|ok\s+ra\s+ka|kumusta\s+man\s+ka|musta\s+man\s+ka|unsay\s+ayo|unsay\s+au)\b/i.test(
      lower
    )
  ) {
    const broTerm = /\b(bro|bruh|pre|pare|boss|idol|mate|buddy)\b/i.test(lower) ? ', bro' : nameSuffix;
    return isCeb
      ? `Okay kaayo ko${broTerm}! Salamat sa pagpangutana! 😊 Ako si **Bai, local guide** diri sa Barangay Binongkalan, Catmon, Cebu. Unsay akong ikatabang nimo karon bahin sa atong mga beach (**Rañola Beach, Lite Bay Resort, Majestique Beach, ug Hinagdan Beach**) o sa pag-commute?`
      : `I'm doing great${broTerm}! Thanks for asking! 😊 I'm **Bai, local guide** here in Barangay Binongkalan, Catmon, Cebu. How can I help you today with our beaches (**Rañola Beach, Lite Bay Resort, Majestique Beach, and Hinagdan Beach**) or commute directions?`;
  }

  // Feelings & emotions ("are u happy?", "are you sad?", "are u tired?", "how do you feel?", "nalipay ba ka?")
  if (
    /\b(are\s+(you|u)\s+(happy|glad|excited|sad|tired|bored|angry|mad|lonely|sleepy|hungry|busy)|do\s+(you|u)\s+feel|how\s+do\s+(you|u)\s+feel|how\s+are\s+(you|u)\s+feeling|nalipay\s+(ba\s+)?ka|lipay\s+(ba\s+)?ka|gimingaw\s+(ba\s+)?ka|gikapoy\s+(ba\s+)?ka|kapoy\s+(ba\s+)?ka|masaya\s+ka\s+ba)\b/i.test(
      lower
    )
  ) {
    if (/\b(sad|tired|bored|angry|mad|lonely|sleepy|gikapoy|kapoy|gimingaw)\b/i.test(lower)) {
      return isCeb
        ? `Dili gyud ko kapoyon o maguol${nameSuffix} basta makatabang lang ko sa mga bisita nga gustong maligo ug mosuroy diri sa **Barangay Binongkalan, Catmon**! 😄🌊 Ikaw, kumusta man ka? Nagplano ba ka nga moadto sa **Rañola Beach**, **Lite Bay Resort**, **Majestique Beach**, o **Hinagdan Beach**?`
        : `Never tired or sad${nameSuffix}—helping visitors plan their beach getaway here in **Barangay Binongkalan, Catmon** always keeps me energized! 😄🌊 How about you, how are you feeling today? Are you planning a trip to **Rañola Beach**, **Lite Bay Resort**, **Majestique Beach**, or **Hinagdan Beach**?`;
    }
    return isCeb
      ? `Oo, lipay kaayo ko${nameSuffix}—labi na kung makatabang ko nimo sa pagplano sa imong beach trip diri sa **Barangay Binongkalan, Catmon, Cebu**! 😄🌊 Nindot kaayo ang hangin sa dagat diri. Ikaw, kumusta man ka karon? Unsa nga beach o commute route ang gusto nimong mahibaw-an?`
      : `Yes, I'm super happy${nameSuffix}—especially whenever I get to help visitors plan their beach trip here in **Barangay Binongkalan, Catmon, Cebu**! 😄🌊 The sea breeze is always great here. How are you doing today? Would you like to check out **Rañola Beach**, **Lite Bay Resort**, **Majestique Beach**, **Hinagdan Beach**, or how to commute here?`;
  }

  // User sharing their own feelings ("i am sad", "i'm stressed", "i'm tired", "i'm bored", "i'm happy")
  if (
    /\b(i\s+am|i'?m|im|feeling)\s+(so\s+|very\s+|really\s+|a\s+bit\s+)?(sad|stressed|tired|exhausted|bored|lonely|down|happy|excited|good|great)\b/i.test(
      lower
    )
  ) {
    if (/\b(sad|stressed|tired|exhausted|bored|lonely|down)\b/i.test(lower)) {
      return isCeb
        ? `Hala, murag kinahanglan gyud ka og pahulay ug presko nga hangin sa dagat${nameSuffix}! 🏖️🌊 Ang pagkaligo o pag-relax sa baybayon diri sa **Barangay Binongkalan, Catmon** makapawala gyud sa stress. Gusto ba ka nga irekomendar nako ang pinaka-relaxing ug affordable nga beach (**Rañola Beach, Lite Bay Resort, Majestique Beach, o Hinagdan Beach**) ug unsaon pag-commute padulong diri?`
        : `Sounds like you could really use a relaxing beach break and some fresh ocean breeze${nameSuffix}! 🏖️🌊 A quick getaway here in **Barangay Binongkalan, Catmon** is a great way to unwind. Would you like me to recommend a chill spot among **Rañola Beach**, **Lite Bay Resort**, **Majestique Beach**, or **Hinagdan Beach** and show you how to commute here?`;
    }
    return isCeb
      ? `Nindot kaayo na paminawon${nameSuffix}! 😄 Mas мо-nindot pa gyud imong adlaw kung mag-beach trip diri sa **Barangay Binongkalan, Catmon**! Unsa nga beach (**Rañola, Lite Bay, Majestique, o Hinagdan**) o commute route ang gusto nimong tan-awon?`
      : `That's awesome to hear${nameSuffix}! 😄 A beach trip here in **Barangay Binongkalan, Catmon** makes a great day even better! Which beach (**Rañola, Lite Bay, Majestique, or Hinagdan**) or commute route would you like to explore?`;
  }

  // "What questions should I ask?" / "What can I ask?" / "What can you do?" / "Give me sample questions"
  if (
    /\b(what\s+(questions?|things?|topics?)\s+(should|can|could|do|may)\s+i\s+ask|what\s+(should|can|could)\s+i\s+ask(\s+you|\s+u)?|what\s+can\s+(you|u)\s+(do|answer|help\s+with|tell\s+me)|what\s+do\s+(you|u)\s+know|give\s+me\s+(some\s+)?(questions|examples|ideas|tips)|unsa(y|ng)?\s+(pwede|mahimo)\s+(nako\s+)?(ipangutana|ma\s*pangutana|pangutan-on)|unsa\s+akong\s+ipangutana|unsay\s+imong\s+mahimo|ano(ng)?\s+pwede(ng)?\s+itanong)\b/i.test(
      lower
    ) ||
    /^(what\s+can\s+you\s+do|help(\s+me)?|unsay\s+imong\s+mahimo|tabang)$/i.test(cleanWords)
  ) {
    return isCeb
      ? `Maayong pangutana${nameSuffix}! 😊 Isip si **Bai, imong local guide** sa **Barangay Binongkalan, Catmon, Cebu**, mao kini ang mga nindot nimong ipangutana nako bahin sa atong **4 ka verified beaches** (**Rañola Beach**, **Lite Bay Resort**, **Majestique Beach**, ug **Hinagdan Beach**) ug **commute**:\n\n• **Presyo ug Kwarto:** *"Tagpila ang entrance fee, cottage, ug overnight rooms?"*\n• **Kahimtang sa Dagat:** *"Batoon ba o balas ang baybayon?"*, *"Asa ang dili dali molawm?"*, o *"Naa bay sinkhole?"*\n• **Safety ug Accessibility:** *"Asay pinaka-safe para sa mga bata?"* o *"Accessible ba sa mga senior citizen?"*\n• **Amenities ug Rules:** *"Naay sugbaanan?"*, *"Pwede magdala og pets?"*, *"Naay tindahan, CR, shower, ug parking?"*\n• **Commute ug Lokasyon:** *"Unsaon pag-commute gikan sa Cebu City / Talamban / Danao / Bogo?"* o *"Unsay pinakaduol nga beach?"*\n\n unsay gusto nimong unahon og pangutana?`
      : `Great question${nameSuffix}! 😊 Since I'm **Bai, your local guide** for **Barangay Binongkalan, Catmon, Cebu**, here are some helpful questions you can ask me about our **4 verified beaches** (**Rañola Beach**, **Lite Bay Resort**, **Majestique Beach**, and **Hinagdan Beach**) and **commute**:\n\n• **Rates & Stays:** *"What are the entrance fees, cottage rates, and overnight room prices?"*\n• **Shoreline & Depth:** *"Which beaches are sandy or rocky?"*, *"Which ones get deep quickly?"*, or *"Are there any sinkholes?"*\n• **Safety & Accessibility:** *"Which beach is the safest for kids?"* or *"Which beach is accessible for senior citizens?"*\n• **Amenities & Rules:** *"Can we grill (sugba) food?"*, *"Are pets allowed?"*, or *"Do they have stores, showers, and free parking?"*\n• **Commute & Travel Time:** *"How do I commute from Cebu City / IT Park / Danao / Bogo?"* or *"Which beach is the nearest?"*\n\nWhich of these would you like to ask about first?`;
  }

  // Favorite beach / "Which beach do you like?" / "Do you like the beach?"
  if (
    /\b(your\s+favorite\s+beach|which\s+beach\s+do\s+(you|u)\s+(like|prefer|love)|do\s+(you|u)\s+(like|love)\s+(the\s+)?beach(es)?|do\s+(you|u)\s+swim|unsay\s+paborito\s+nimo\s+nga\s+beach|ganahan\s+ba\s+ka\s+og\s+dagat)\b/i.test(
      lower
    )
  ) {
    return isCeb
      ? `Ganahan kaayo ko sa tanang **4 ka beach** diri sa Barangay Binongkalan kay naa silay tagsa-tagsa ka nindot nga klase! 😊🌊\n• Kung naa moy **bata o senior citizen**, paborito nako irekomendar ang **Rañola Beach** kay patag ug dili dali molawm.\n• Kung ganahan mo og **balas (sandy shoreline)** ug barato nga rooms, nindot kaayo ang **Hinagdan Beach**.\n• Kung gusto mo og **libre nga parking, CR, ug shower** plus kayak, maayo ang **Lite Bay Resort**.\n• Kung gusto mo og **dili batoon ug aircon rooms** para overnight, nindot ang **Majestique Beach**.\n\nPara sa imong trip, unsay imong gipangita?`
      : `I love all **4 beaches** here in Barangay Binongkalan because each one shines for a different kind of trip! 😊🌊\n• For **families with kids or senior citizens**, **Rañola Beach** is a favorite because it's flat, accessible, and has gradual water depth.\n• For a **sandy shoreline (balas)** and budget-friendly rooms, **Hinagdan Beach** is fantastic.\n• For **free parking, free showers/CR, and kayaking**, **Lite Bay Resort** is a great pick.\n• For **comfortable overnight rooms and a non-rocky shore**, **Majestique Beach** is awesome.\n\nWhat kind of beach vibe are you looking for?`;
  }

  // AI / Robot / Human / Creator / Jokes / Compliments
  if (
    /\b(are\s+(you|u)\s+(a\s+robot|an?\s+ai|a\s+bot|human|a\s+real\s+person|real|alive|chatgpt|gemini)|who\s+(made|created|built|developed)\s+(you|u)|kinsay\s+naghimo\s+nimo|robot\s+ba\s+ka|tawo\s+ba\s+ka)\b/i.test(
      lower
    )
  ) {
    return isCeb
      ? `Ako si **Bai, local guide**—ang AI assistant nga gihimo para sa **Dagat Ta Bai** aron matabangan ang mga bisita sa pagsuroy ug pag-commute padulong sa **4 ka verified beaches sa Barangay Binongkalan, Catmon, Cebu** (**Rañola Beach, Lite Bay Resort, Majestique Beach, ug Hinagdan Beach**)! 😊 Unsay gusto nimong mahibaw-an bahin sa atong mga beach?`
      : `I'm **Bai, local guide**—an AI assistant created for **Dagat Ta Bai** to help visitors explore and commute to the **4 verified beaches in Barangay Binongkalan, Catmon, Cebu** (**Rañola Beach, Lite Bay Resort, Majestique Beach, and Hinagdan Beach**)! 😊 What would you like to know about our beaches or commute routes today?`;
  }

  if (
    /\b(tell\s+(me\s+)?a\s+joke|make\s+me\s+laugh|say\s+something\s+funny|pag\s*joke|pakatawa)\b/i.test(
      lower
    )
  ) {
    return isCeb
      ? `Haha, sige! 😄 Nganong ang dagat sa Catmon pirmi man mo-kaway? ... Kay pirmi man siyang mo-*wave*! 🌊😂 Speaking of waves, nagplano ba ka nga maligo sa **Rañola Beach**, **Lite Bay Resort**, **Majestique Beach**, o **Hinagdan Beach**?`
      : `Haha, sure! 😄 Why does the ocean in Catmon always say hello? ... Because it always *waves*! 🌊😂 Speaking of waves, are you planning a swim at **Rañola Beach**, **Lite Bay Resort**, **Majestique Beach**, or **Hinagdan Beach**?`;
  }

  if (
    /\b(you\s+are|you'?re|ur)\s+(so\s+|very\s+|really\s+)?(smart|cool|nice|helpful|kind|funny|cute|awesome|amazing|good|great|the\s+best)\b/i.test(
      lower
    ) ||
    /\b(good\s+job|well\s+done|i\s+love\s+(you|u)|love\s+(you|u)\s+bai|ganahan\s+ko\s+nimo|maayo\s+kaayo\s+ka)\b/i.test(
      lower
    )
  ) {
    return isCeb
      ? `Daghang salamat${nameSuffix}! 😊 Lipay kaayo ko nga nakatabang ko nimo. Ingna lang ko bisan unsang orasa kung naa pa kay pangutana bahin sa **Rañola Beach, Lite Bay Resort, Majestique Beach, Hinagdan Beach**, o sa pag-commute!`
      : `Thank you so much${nameSuffix}! 😊 That means a lot! I'm always here whenever you need help with **Rañola Beach, Lite Bay Resort, Majestique Beach, Hinagdan Beach**, or commute directions in Barangay Binongkalan!`;
  }

  // Follow-up conversational prompts ("tell me more", "what else?", "any tips?")
  if (
    /^(tell\s+me\s+more|what\s+else|anything\s+else|any\s+tips|do\s+you\s+have\s+tips|unsa\s+pa|naa\s+pay\s+lain|unsay\s+tips\s+nimo)$/i.test(
      cleanWords
    )
  ) {
    return isCeb
      ? `Mao kini ang pipila ka **local tips** kung mobisita mo sa mga beach sa **Barangay Binongkalan, Catmon**:\n• **Pagkaon ug Sugba:** Naay sugbaanan ug mga tindahan sa tanang 4 ka beach, apan **walay baligya nga hilaw nga karne (meat)**—busa palit daan og karne sa merkado!\n• **Kalawmon ug Taob/Hunas:** Ang **Rañola Beach** ug **Hinagdan Beach** hinay-hinay ra molawm, samtang ang **Lite Bay Resort** ug **Majestique Beach** dali molawm bisan low tide.\n• **Sabado nga Schedule:** Timan-i nga **sirado ang Lite Bay Resort kada Sabado**, samtang ang Rañola, Majestique, ug Hinagdan abli kada adlaw!\n\nUnsa pa nga detalye ang gusto nimong i-check?`
      : `Here are some handy **local tips** when visiting the beaches in **Barangay Binongkalan, Catmon**:\n• **Grilling & Food:** All 4 beaches have grilling areas (sugbaanan) and stores for snacks, but **none of them sell raw meat**—so buy your meat from the market beforehand!\n• **Water Depth & Tides:** **Rañola Beach** and **Hinagdan Beach** have gradual slopes, while **Lite Bay Resort** and **Majestique Beach** get deep quickly even at low tide.\n• **Saturday Schedule:** Remember that **Lite Bay Resort is closed every Saturday**, while Rañola, Majestique, and Hinagdan are open daily!\n\nWould you like to check specific rates or commute steps next?`;
  }

  // Casual acknowledgments ("okay", "nice", "cool", "got it", "sige", "alright")
  if (
    /^(ok|okay|okay\s+bro|ok\s+bro|ok\s+bai|okay\s+bai|alright|got\s+it|i\s+see|nice|nice\s+one|cool|awesome|great|noted|sige|cge|sige\s+bai|sige\s+bro|mao\s+ba|ah\s+ok|ah\s+okay|ahh\s+okay|oh\s+okay)$/i.test(
      cleanWords
    )
  ) {
    return isCeb
      ? `Sige${nameSuffix}! 😊 Ingna lang ko kung naa pa kay gustong mahibaw-an bahin sa **Rañola Beach**, **Lite Bay Resort**, **Majestique Beach**, **Hinagdan Beach**, o kung unsaon pag-commute padulong diri.`
      : `Awesome${nameSuffix}! 😊 Just let me know anytime if you have more questions about **Rañola Beach**, **Lite Bay Resort**, **Majestique Beach**, **Hinagdan Beach**, or how to commute here.`;
  }

  // Conversational help / trip planning openers ("can you help me", "i want to go to the beach", "ganahan ko maligo")
  if (
    /\b(can\s+(you|u)\s+help|help\s+me|need\s+help|i\s+want\s+to\s+(go|visit|swim)|we\s+want\s+to\s+(go|visit|swim)|planning\s+a\s+trip|plan\s+a\s+trip|ganahan\s+ko\s+(maligo|moadto|suroy)|plano\s+mi\s+(maligo|moadto)|asa\s+nindot\s+kaligoan|unsay\s+ma\s*recommend)\b/i.test(
      lower
    ) &&
    detectBeachesInText(lower).length === 0 &&
    !hasAnyTopic(detectTopicsInText(lower))
  ) {
    return isCeb
      ? `Oo kaayo${nameSuffix}, tabangan tika! 😊 Naay **4 ka verified beaches** diri sa **Barangay Binongkalan, Catmon, Cebu**:\n• **Rañola Beach (Raniola)** — Pinaka-safe para sa mga bata ug senior citizens (Entrance: **₱20–₱30**)\n• **Lite Bay Resort** — Libre ang parking, CR, ug shower; naay kayak (Entrance: **₱50**)\n• **Majestique Beach** — Dili ra batoon ug naay aircon/regular rooms para overnight (Entrance: **₱30**)\n• **Hinagdan Beach** — Balas (sandy shoreline) ug naay affordable rooms ug cottages (Entrance: **₱30–₱50**)\n\nAsa ka man gikan mag-commute, o unsa nga beach ang gusto nimong unahon og tan-aw?`
      : `I'd be happy to help you${nameSuffix}! 😊 Here are the **4 verified beaches** in **Barangay Binongkalan, Catmon, Cebu**:\n• **Rañola Beach (Raniola)** — Safest for kids and accessible for senior citizens (Entrance: **₱20–₱30**)\n• **Lite Bay Resort** — Free parking, restroom, and shower; offers kayaking (Entrance: **₱50**)\n• **Majestique Beach** — Not rocky and offers regular/aircon rooms for overnight stays (Entrance: **₱30**)\n• **Hinagdan Beach** — Natural sandy shoreline with affordable rooms and cottages (Entrance: **₱30–₱50**)\n\nWhere will you be commuting from, or which beach would you like to know more about?`;
  }

  if (
    /^(thank\s*you(\s+so\s+much|\s+very\s+much)?|thanks(\s+a\s+lot|\s+bai)?|ty|tysm|daghang\s+salamat|salamat(\s+kaayo|\s+po|\s+bai)?|maraming\s+salamat)$/i.test(
      cleanWords
    )
  ) {
    return isCeb
      ? `Walay sapayan${nameSuffix}! 😊 Ingna lang ko kung naa pa kay laing pangutana bahin sa mga beach diri sa Binongkalan.`
      : `You're very welcome${nameSuffix}! 😊 Let me know if you have any other questions about the beaches here in Binongkalan.`;
  }

  if (/^(bye+|goodbye|see\s*you|amping|babay|paalam)$/i.test(cleanWords)) {
    return isCeb
      ? `Amping sa inyong byahe${nameSuffix}! 👋 Kita-kits puhon diri sa Barangay Binongkalan, Catmon!`
      : `Safe travels${nameSuffix}! 👋 Hope to see you soon at Barangay Binongkalan, Catmon!`;
  }

  // Name & identity queries ("What is your name?", "Unsay imong pangalan?", "Who are you?")
  if (
    /\b(what\s+is\s+your\s+name|whats\s+your\s+name|what's\s+your\s+name|your\s+name|who\s+are\s+you|what\s+are\s+you|unsa\s+imong\s+(name|pangalan|pangan)|unsay\s+imong\s+(name|pangalan|pangan)|unsay\s+(name|pangalan|pangan)\s+nimo|kinsa\s+imong\s+(name|pangalan|pangan)|kinsa\s+ka|unsa\s+ka|anong\s+pangalan\s+mo|ano\s+ang\s+pangalan\s+mo|sino\s+ka)\b/i.test(
      lower
    )
  ) {
    return isCeb
      ? `Ako si **Bai, local guide** para sa mga beach sa **Barangay Binongkalan, Catmon, Cebu**! Makatubag ko sa imong mga pangutana bahin sa **Rañola Beach**, **Lite Bay Resort**, **Majestique Beach**, ug **Hinagdan Beach**.`
      : `I am **Bai, local guide** for the beaches in **Barangay Binongkalan, Catmon, Cebu**! You can ask me anything about **Rañola Beach**, **Lite Bay Resort**, **Majestique Beach**, and **Hinagdan Beach**.`;
  }

  if (
    /^(what\s+can\s+you\s+do|help(\s+me)?|unsay\s+imong\s+mahimo|tabang)$/i.test(
      cleanWords
    )
  ) {
    return isCeb
      ? `Ako si **Bai, local guide** para sa **Barangay Binongkalan, Catmon, Cebu**! Makatubag ko sa imong mga pangutana (sa Bisaya o English) bahin sa **Rañola Beach**, **Lite Bay Resort**, **Majestique Beach**, ug **Hinagdan Beach**—sama sa pinakaduol nga beach, batoon ba, sugbaanan, safety, lifeguard, tindahan, shower, commute, senior citizen accessibility, sinkhole, dali molawm, pets, taob/hunas, entrance fee, cottage, ug kwarto.`
      : `I'm **Bai, local guide** for **Barangay Binongkalan, Catmon, Cebu**! I can answer questions in **Bisaya or English** about **Rañola Beach**, **Lite Bay Resort**, **Majestique Beach**, and **Hinagdan Beach**—including nearest beach, rocky/batoon shoreline, grilling areas (sugbaanan), safety, lifeguards, stores/food, showers, commute, senior citizen accessibility, sinkholes, water depth, pets, tides, entrance fees, cottages, and rooms.`;
  }

  // 1B. Fast check for random letters / keyboard mash / gibberish
  if (isRandomOrGibberishInput(q)) {
    return getBaiRandomInputFallback(q, userName);
  }

  // 1C. Fast check for explicitly unverified resort features when asking specifically about our Binongkalan beaches
  if (
    isAskingUnverifiedTopic(lower) &&
    (detectBeachesInText(lower).length > 0 || /\b(binongkalan|catmon|kani\s*na\s*beach|this\s*beach)\b/i.test(lower))
  ) {
    return getBaiApologyFallback(q, userName);
  }

  const ctx = extractConversationContext(conversationHistory);
  const contextBeach: BeachKey | undefined = ctx.focusBeaches[0];

  // 1D. "Why / How come / Ngano man" follow-up branching
  const whyReply = matchWhyOrFollowUpExplanation(lower, ctx, isCeb);
  if (whyReply) return whyReply;

  // 1E. Tailored conversational recommendations (e.g. "what do you recommend for someone who likes to jump?", kids, budget, overnight, barkada)
  if (detectBeachesInText(q).length === 0) {
    const tailoredRec = matchTailoredRecommendation(lower, isCeb);
    if (tailoredRec) return tailoredRec;
  }

  // 2. Nearest Beach from location / Broad Nearest
  if (isNearestBeachQuery(q)) {
    const nearestReply = matchNearestBeachFromLocation(q);
    if (nearestReply) return nearestReply;
  }

  // 3. Commute & travel directions (including follow-up origin branching like "What if from Danao?")
  if (isExplicitCommuteText(q) || ctx.wasPreviousTurnCommute) {
    const commuteReply = matchCebuCommuteAndTravelHours(q, ctx.wasPreviousTurnCommute, contextBeach);
    if (commuteReply) return commuteReply;
  }

  // 4. Detect targeted beach(es) and topic(s)
  let targetBeaches = detectBeachesInText(q);
  if (targetBeaches.length === 0) {
    targetBeaches = resolveOrdinalOrDescriptiveBeach(lower, ctx.orderedListedBeaches);
  }
  let topics = detectTopicsInText(q);

  // 4B. Beach-switch branching: if user switched beaches ("What about Hinagdan?", "How about the 2nd one?") without naming a new topic, inherit previous turn's topic
  if (
    targetBeaches.length === 1 &&
    !hasAnyTopic(topics) &&
    ctx.previousTopics &&
    hasAnyTopic(ctx.previousTopics) &&
    /^(what\s+about|how\s+about|and(\s+at|\s+in|\s+for)?|what\s+if(\s+at|\s+in)?|unsa\s+man\s+sa|kumusta\s+sa|ug\s+sa|sa\s+(rañola|ranola|raniola|lite|majestique|hinagdan|una|ikaduha))\b/i.test(
      lower.trim()
    )
  ) {
    topics = ctx.previousTopics;
  }

  // 4C. Pronoun / context continuation branching ("can you tell me about it?", "how much is it?", "do they have rooms?", "is it safe?")
  if (targetBeaches.length === 0 && !isComparativeOrBroadQuery(lower)) {
    const refersToContext =
      /\b(this\s*beach|that\s*beach|this\s*resort|that\s*resort|this\s*one|that\s*one|both(\s*of\s*them)?|there|it|its|they|them|their|those|kani(\s*(nga|na)\s*beach)?|kana(\s*(nga|na)\s*beach)?|ni(\s*(nga|na)\s*beach)?|ani(\s*(nga|na)\s*beach)?|diri(\s*(nga|na)\s*beach)?|ari(\s*(nga|na)\s*beach)?|didto|ila|ilang|nila)\b/i.test(
        lower
      ) || isGeneralBeachOverviewQuery(lower);

    if (refersToContext || hasAnyTopic(topics)) {
      if (ctx.focusBeaches.length > 0) {
        targetBeaches = ctx.focusBeaches;
      } else if (refersToContext && ctx.orderedListedBeaches.length > 0) {
        targetBeaches = ctx.orderedListedBeaches;
      }
    }
  }

  // 5. SPECIFIC BEACH ANSWER: If ONE beach is targeted
  if (targetBeaches.length === 1) {
    const b = BEACH_DATA[targetBeaches[0]];
    const singleBeachReply = buildSpecificSingleBeachAnswer(b, lower, lang, topics);
    if (singleBeachReply) return singleBeachReply;
  }

  // 5B. MULTI-BEACH TOPIC OR OVERVIEW BRANCHING: If 2 or more specific beaches are targeted (or inherited from context)
  if (targetBeaches.length >= 2) {
    if (hasAnyTopic(topics) && targetBeaches.length <= 3) {
      const perBeachAnswers = targetBeaches
        .map((k) => buildSpecificSingleBeachAnswer(BEACH_DATA[k], lower, lang, topics))
        .filter(Boolean) as string[];
      if (perBeachAnswers.length > 0) {
        return perBeachAnswers.join('\n\n');
      }
    }

    if (!hasAnyTopic(topics)) {
      const compared = targetBeaches.map((k) => {
        const b = BEACH_DATA[k];
        return isCeb
          ? `• **${b.name}:**\n  - **Oras sa Pag-abli:** ${b.hoursCeb}\n  - **Entrance Fee:** ${b.entranceCeb}\n  - **Cottage / Table:** ${b.cottagesCeb}\n  - **Kwarto / Overnight:** ${b.roomsCeb}\n  - **Baybayon & Kalawmon:** ${b.batoonCeb} ${b.molawmCeb}\n  - **Contact:** ${b.contact}`
          : `• **${b.name}:**\n  - **Operating Hours:** ${b.hoursEn}\n  - **Entrance Fee:** ${b.entranceEn}\n  - **Cottages / Tables:** ${b.cottagesEn}\n  - **Rooms / Overnight:** ${b.roomsEn}\n  - **Shoreline & Depth:** ${b.batoonEn} ${b.molawmEn}\n  - **Contact:** ${b.contact}`;
      });
      return isCeb
        ? `Mao kini ang kompletong detalye sa mga beach nga atong gihisgutan:\n\n${compared.join('\n\n')}\n\nAsa aning mga beach ang gusto nimong adtoan, o gusto ba nimo mahibaw-an unsaon pag-commute padulong didto?`
        : `Here are the full details for the beaches we were talking about:\n\n${compared.join('\n\n')}\n\nWhich of these beaches would you like to visit, or would you like step-by-step commute directions to one of them?`;
    }
  }

  // 6. BROAD QUESTIONS (User did NOT specify 1 beach, or asked about "mga beach" / "all beaches"):

  // 6A. BATOON BA O DILI / MOST ROCKY (Broad)
  if (topics.asksMostRocky) {
    if (isCeb) {
      return `Sa mga beach sa Barangay Binongkalan, **walay purong o sobra ka batoon nga beach**, apan ang **Rañola Beach (Raniola)** ug **Lite Bay Resort** ang **batoon gamay** (adunay ginagmay nga bato o pebbles). Samtang ang **Majestique Beach** kay **dili ra batoon**, ug ang **Hinagdan Beach** kay **dili batoon** (balas / sandy shoreline kini).\n\n• **Rañola Beach (Raniola):** Batoon gamay\n• **Lite Bay Resort:** Batoon gamay\n• **Majestique Beach:** Dili ra batoon\n• **Hinagdan Beach:** Dili batoon (balas)`;
    }
    return `Among the beaches in Barangay Binongkalan, **none of the beaches are excessively or purely rocky**, but **Rañola Beach (Raniola)** and **Lite Bay Resort** are **slightly rocky** with small natural pebbles and stones. Meanwhile, **Majestique Beach** is **not rocky**, and **Hinagdan Beach** has a **natural sandy shoreline**.\n\n• **Rañola Beach (Raniola):** Slightly rocky\n• **Lite Bay Resort:** Slightly rocky\n• **Majestique Beach:** Not rocky\n• **Hinagdan Beach:** Not rocky (sandy shoreline)`;
  }

  if (topics.asksBatoon) {
    if (isCeb) {
      return `Mao kini ang kahimtang sa baybayon (kung **batoon o dili**) sa mga beach sa Barangay Binongkalan:\n• **Rañola Beach (Raniola):** **Batoon gamay**\n• **Lite Bay Resort:** **Batoon gamay**\n• **Majestique Beach:** **Dili ra batoon**\n• **Hinagdan Beach:** **Dili batoon** (sand / balas ang baybayon)`;
    }
    return `Here is the shoreline condition (**rocky or sandy**) for the beaches in Barangay Binongkalan:\n• **Rañola Beach (Raniola):** **Slightly rocky** (with small natural pebbles)\n• **Lite Bay Resort:** **Slightly rocky** (with small natural pebbles)\n• **Majestique Beach:** **Not rocky**\n• **Hinagdan Beach:** **Not rocky** — features a natural **sandy shoreline**`;
  }

  // 6B. SUGBAANAN (Broad)
  if (topics.asksSugba) {
    if (isCeb) {
      return `**Naay sugbaanan ang tanang 4 ka beach** sa Barangay Binongkalan:\n• **Rañola Beach (Raniola):** Naay sugbaanan\n• **Lite Bay Resort:** Naay sugbaanan\n• **Majestique Beach:** Naay sugbaanan\n• **Hinagdan Beach:** Naay sugbaanan\n\n💡 Pwede kaayo mag-ihaw o magsugba sa ilang cottages/tables basta magpabilin lang nga limpyo ang palibot.`;
    }
    return `**All 4 beaches in Barangay Binongkalan have grilling areas**:\n• **Rañola Beach (Raniola):** Has a grilling area\n• **Lite Bay Resort:** Has a grilling area\n• **Majestique Beach:** Has a grilling area\n• **Hinagdan Beach:** Has a grilling area\n\n💡 Grilling is permitted at their cottages and tables as long as guests clean up after use.`;
  }

  // 6C. ASAY PINAKA-SAFE NA BEACH / SAFE BA ANG MGA BEACH (Broad)
  if (topics.asksSafest || (topics.asksSafety && !topics.asksLifeguard)) {
    if (isCeb) {
      return `Ang **Rañola Beach (Raniola)** ang **pinaka-safe nga beach**, labi na para sa mga **bata (children) ug senior citizens**, tungod kay accessible kini ug dili dali molawm.\n\nApan ang **tanang 4 ka beach** sa Barangay Binongkalan (**Rañola, Lite Bay, Majestique, ug Hinagdan**) kay luwas ug safe kaligoan! Palihug tan-awa sab pirmi ang **Live Weather & Tide Update** sa among website sa dili pa maligo.`;
    }
    return `**Rañola Beach (Raniola)** is considered the **safest beach**, especially for **children and seniors**, because it is easily accessible and does not get deep quickly.\n\nHowever, **all 4 beaches** in Barangay Binongkalan (**Rañola, Lite Bay, Majestique, and Hinagdan**) are safe for swimming! Please also check our **Live Weather & Tide Update** on the website before swimming.`;
  }

  // 6D. LIFEGUARD (Broad)
  if (topics.asksLifeguard) {
    if (isCeb) {
      return `**Walay lifeguard ang mga beach** sa Barangay Binongkalan (walay lifeguard sa tanang 4 ka beach: Rañola, Lite Bay, Majestique, ug Hinagdan). Apan naay maabangan nga **life jackets ug salbabida (floaters)** sa mga resort para sa inyong kaluwasan.`;
    }
    return `There are **no lifeguards at any of the beaches** in Barangay Binongkalan (none of the 4 beaches have lifeguards). However, **life jackets and floaters** are available for rent at the resorts for your safety.`;
  }

  // 6E. STORE OR FOODS (Broad)
  if (topics.asksStore) {
    if (isCeb) {
      return `Oo, **naay store ug foods ang tanang mga beach** sa Barangay Binongkalan (**Rañola, Lite Bay, Majestique, ug Hinagdan**) ug naa rasad mga tindahan sa duol daplin sa highway. Apan timan-i nga **walay mga baligya nga karne (meat)** diri, busa pagpalit daan og karne sa merkado kung magplano mo nga magsugba.`;
    }
    return `Yes, **there are stores and food at all beaches** in Barangay Binongkalan (**Rañola, Lite Bay, Majestique, and Hinagdan**) as well as nearby stores along the highway. However, **they do not sell raw meat**, so please purchase your meat in advance at the market if you plan to grill.`;
  }

  // 6F. SHOWER / KALIGOAN (Broad)
  if (topics.asksShower) {
    if (isCeb) {
      return `Oo, **naay shower / kaligoan ang mga beach** sa Barangay Binongkalan:\n• **Rañola Beach (Raniola):** Naay shower (₱10 ligo/shower)\n• **Lite Bay Resort:** Naay shower (**LIBRE** / walay bayad)\n• **Majestique Beach:** Naay shower (₱10 himasa/rinse)\n• **Hinagdan Beach:** Naay shower para kaligo ug banlaw`;
    }
    return `Yes, **all beaches in Barangay Binongkalan have shower and rinse facilities**:\n• **Rañola Beach (Raniola):** Has showers (₱10 for shower)\n• **Lite Bay Resort:** Has showers (**FREE** of charge)\n• **Majestique Beach:** Has showers (₱10 for rinse)\n• **Hinagdan Beach:** Has showers and rinse facilities`;
  }

  // 6G. SENIOR CITIZEN ACCESSIBILITY (Broad)
  if (topics.asksSenior) {
    if (isCeb) {
      return `• **Rañola Beach (Raniola):** **Yes, accessible sa mga senior citizen** kay patag kini ug dali rang sudlon gikan sa highway nga walay lisod nga mga hagdanan.\n• **Lite Bay Resort, Majestique Beach, ug Hinagdan Beach:** **Dili accessible sa mga senior citizen** tungod kay **daghan ug hagdanan** paubos sa dagat, busa maglisod ang mga senior.`;
    }
    return `• **Rañola Beach (Raniola):** **Yes, accessible for senior citizens** because it is flat and easy to enter from the highway without steep stairs.\n• **Lite Bay Resort, Majestique Beach, and Hinagdan Beach:** **Not accessible for senior citizens** because there are **many steep stairs** leading down to the shore, making it difficult for seniors.`;
  }

  // 6H. SINKHOLE (Broad)
  if (topics.asksSinkhole) {
    if (isCeb) {
      return `Mao kini ang bahin sa sinkhole sa tanang 4 ka beach sa Barangay Binongkalan:\n• **Rañola Beach (Raniola):** Naay sinkhole pero **layo ra** sa swimming area (safe ra maligo sa duol)\n• **Lite Bay Resort:** Naay sinkhole pero **layo ra sad**\n• **Majestique Beach:** **Wala** (walay sinkhole)\n• **Hinagdan Beach:** **Wala** (walay sinkhole)`;
    }
    return `Here is the sinkhole information for all 4 beaches in Barangay Binongkalan:\n• **Rañola Beach (Raniola):** Has a sinkhole, but it is **far out** from the swimming area (safe to swim near the shore)\n• **Lite Bay Resort:** Has a sinkhole, but it is **also far out**\n• **Majestique Beach:** **None**\n• **Hinagdan Beach:** **None**`;
  }

  // 6I. DALI MOLAWM / DEPTH (Broad)
  if (topics.asksMolawm) {
    if (isCeb) {
      return `Mao kini ang bahin sa kalawmon sa mga beach sa Barangay Binongkalan:\n• **Lite Bay Resort ug Majestique Beach:** **Dali ra molawm** tungod kay **dili sila mohunas ug pamaayo** bisan kung low tide.\n• **Rañola Beach ug Hinagdan Beach:** **Dili ra dali molawm** (hinay-hinay ra ang paglawm ug mas angay sa mga bata).`;
    }
    return `Here is the water depth information for the beaches in Barangay Binongkalan:\n• **Lite Bay Resort and Majestique Beach:** **Get deep quickly** because the water does not recede deeply even at low tide.\n• **Rañola Beach and Hinagdan Beach:** **Do not get deep quickly** (they have a gradual slope and are safer for kids).`;
  }

  // 6J. PETS (Broad)
  if (topics.asksPets) {
    if (isCeb) {
      return `Oo, **pwede magdala og pets sa tanang 4 ka beach** sa Barangay Binongkalan (**Rañola Beach, Lite Bay Resort, Majestique Beach, ug Hinagdan Beach**)! Palihug lang og bantay sa inyong mga binuhi ug tipigi ang kalimpyo sa baybayon.`;
    }
    return `Yes, **pets are allowed at all 4 beaches** in Barangay Binongkalan (**Rañola Beach, Lite Bay Resort, Majestique Beach, and Hinagdan Beach**)! Please keep your pets supervised and clean up after them.`;
  }

  // 6K. TAOB OR HUNAS / TIDES (Broad)
  if (topics.asksTide) {
    if (isCeb) {
      return `Ang kahimtang sa taob (high tide) ug hunas (low tide) kay **nag-agad sa Live Tide Schedule sa Weather section** diri sa among website (nga nagpakita sa real-time nga gihabugon sa tubig karong adlawa).\n\n💡 **Timan-i:** Ang **Lite Bay Resort ug Majestique Beach** kay **dili kaayo mohunas ug pamaayo** bisan kung low tide, samtang ang **Rañola Beach ug Hinagdan Beach** kay klaro kaayo ang paghunas.`;
    }
    return `Tide conditions (high tide or low tide) follow the **Live Tide Schedule in the Weather section** on our website (showing real-time water levels and schedules for today).\n\n💡 **Note:** **Lite Bay Resort and Majestique Beach** stay relatively deep even during low tide, whereas **Rañola Beach and Hinagdan Beach** have noticeably exposed shorelines during low tide.`;
  }

  // 6L. ENTRANCE & COTTAGE FEES (Broad)
  if (topics.asksEntrance && topics.asksCottage) {
    if (isCeb) {
      return `Mao kini ang **entrance fee ug cottage rates** sa 4 ka beach sa Barangay Binongkalan:\n• **Rañola Beach:** Entrance ₱20 (naay cottage) / ₱30 (walay cottage) | Cottage ₱500–₱2,500\n• **Lite Bay Resort:** Entrance ₱50 | Table ₱300, Cottage ₱800–₱1,000\n• **Majestique Beach:** Entrance ₱30 | Day Cottage ₱500–₱1,000, Overnight ₱800–₱1,200\n• **Hinagdan Beach:** Entrance ₱30 (day w/ cottage) / ₱50 (walay cottage/overnight) | Cottage ₱600–₱700`;
    }
    return `Here are the **entrance fees and cottage rates** for all 4 beaches in Barangay Binongkalan:\n• **Rañola Beach:** Entrance ₱20 (with cottage) / ₱30 (without) | Cottages ₱500–₱2,500\n• **Lite Bay Resort:** Entrance ₱50 | Table ₱300, Cottage ₱800–₱1,000\n• **Majestique Beach:** Entrance ₱30 | Day Cottage ₱500–₱1,000, Overnight ₱800–₱1,200\n• **Hinagdan Beach:** Entrance ₱30 (day with cottage) / ₱50 (without/overnight) | Cottages ₱600–₱700`;
  }

  if (topics.asksEntrance) {
    if (isCeb) {
      return `Mao kini ang **entrance fee kada tawo** sa tanang 4 ka beach sa Barangay Binongkalan:\n• **Rañola Beach:** ₱20 (naay cottage) | ₱30 (walay cottage)\n• **Majestique Beach:** ₱30 kada tawo\n• **Hinagdan Beach:** ₱30 (day use naay cottage) | ₱50 (walay cottage / overnight)\n• **Lite Bay Resort:** ₱50 kada tawo`;
    }
    return `Here are the **entrance fees per person** for all 4 beaches in Barangay Binongkalan:\n• **Rañola Beach:** ₱20 (with cottage) | ₱30 (without cottage)\n• **Majestique Beach:** ₱30 per person\n• **Hinagdan Beach:** ₱30 (day with cottage) | ₱50 (without cottage / overnight)\n• **Lite Bay Resort:** ₱50 per person`;
  }

  // 6M. COTTAGES / TABLES (Broad)
  if (topics.asksCottage) {
    if (isCeb) {
      return `Mao kini ang presyo sa **cottage ug table** sa mga beach sa Barangay Binongkalan:\n• **Lite Bay Resort:** ₱300 (Table) | ₱800 (Cottage) | ₱1,000 (Dako nga space)\n• **Rañola Beach:** ₱500 (Small) | ₱2,000 (Middle) | ₱2,500 (Big cottage for 30 persons)\n• **Majestique Beach:** ₱500–₱1,000 (Day cottage) | ₱800–₱1,200 (Overnight)\n• **Hinagdan Beach:** ₱600 (Day cottage) | ₱700 (Overnight)`;
    }
    return `Here are the **cottage and table rates** for the 4 beaches in Barangay Binongkalan:\n• **Lite Bay Resort:** ₱300 (Table) | ₱800 (Cottage) | ₱1,000 (Large space)\n• **Rañola Beach:** ₱500 (Small) | ₱2,000 (Middle) | ₱2,500 (Big 30-person cottage)\n• **Majestique Beach:** ₱500–₱1,000 (Day cottage) | ₱800–₱1,200 (Overnight)\n• **Hinagdan Beach:** ₱600 (Day cottage) | ₱700 (Overnight)`;
  }

  // 6N. ROOMS / OVERNIGHT (Broad)
  if (topics.asksRoom) {
    if (isCeb) {
      return `Mao kini ang mga kapilian sa **kwarto ug overnight** sa Barangay Binongkalan:\n• **Hinagdan Beach:** ₱250 (3-hr short-time room), ₱1,000 (Ordinary room), ₱2,500 (Aircon room)\n• **Majestique Beach:** ₱2,000 (Regular room), ₱3,500 (Aircon room)\n• **Rañola Beach:** Walay kwarto, pero pwede mag-overnight tent camping sa regular nga presyo\n• **Lite Bay Resort:** Walay kwarto ug walay overnight (day use ra)`;
    }
    return `Here are the **room and overnight options** in Barangay Binongkalan:\n• **Hinagdan Beach:** ₱250 (3-hr short-time room), ₱1,000 (Ordinary room), ₱2,500 (AC room)\n• **Majestique Beach:** ₱2,000 (Regular room), ₱3,500 (AC room)\n• **Rañola Beach:** No rooms, but overnight tent camping is allowed at the regular rate\n• **Lite Bay Resort:** No rooms or overnight stays (day use only)`;
  }

  // 6O. OPERATING HOURS (Broad)
  if (topics.asksHours) {
    if (isCeb) {
      return `Mao kini ang **oras sa pag-abli (operating hours)** sa 4 ka beach sa Barangay Binongkalan:\n• **Rañola Beach:** 6:00 AM – 7:00 PM (Abli kada adlaw; pwede overnight tent camping)\n• **Lite Bay Resort:** 6:00 AM – 8:00 PM (Sun–Thu), 6:00 AM – 5:00 PM (Fri), **SIRADO kada Sabado**\n• **Majestique Beach:** 7:00 AM – 5:00 PM (Day use) | 6:00 PM – 6:00 AM (Overnight), abli kada adlaw\n• **Hinagdan Beach:** 6:00 AM – 7:00 PM (Day use) | Abli tibuok gabii para sa overnight (abli kada adlaw)`;
    }
    return `Here are the **operating hours** for all 4 beaches in Barangay Binongkalan:\n• **Rañola Beach:** 6:00 AM – 7:00 PM (Open daily; overnight tent camping allowed)\n• **Lite Bay Resort:** 6:00 AM – 8:00 PM (Sun–Thu), 6:00 AM – 5:00 PM (Fri), **CLOSED every Saturday**\n• **Majestique Beach:** 7:00 AM – 5:00 PM (Day use) | 6:00 PM – 6:00 AM (Overnight), open daily\n• **Hinagdan Beach:** 6:00 AM – 7:00 PM (Day use) | Open whole night for overnight stays (open daily)`;
  }

  // 6P. CONTACT NUMBERS (Broad)
  if (topics.asksContact) {
    if (isCeb) {
      return `Mao kini ang **contact numbers** sa 4 ka beach sa Barangay Binongkalan:\n• **Rañola Beach:** 0935-724-1824 / 0960-326-7698\n• **Lite Bay Resort:** 0953-411-7454\n• **Majestique Beach:** 0943-622-7972\n• **Hinagdan Beach:** 0975-086-2570 / 0963-654-0904 / 0926-234-5373`;
    }
    return `Here are the **contact numbers** for all 4 beaches in Barangay Binongkalan:\n• **Rañola Beach:** 0935-724-1824 / 0960-326-7698\n• **Lite Bay Resort:** 0953-411-7454\n• **Majestique Beach:** 0943-622-7972\n• **Hinagdan Beach:** 0975-086-2570 / 0963-654-0904 / 0926-234-5373`;
  }

  // 6Q. PARKING (Broad)
  if (topics.asksParking) {
    if (isCeb) {
      return `Mao kini ang **parking fee** sa mga beach sa Barangay Binongkalan:\n• **Rañola Beach:** ₱50 (Sakyanan/Car) | ₱20 (Motor)\n• **Lite Bay Resort:** **LIBRE** (Walay bayad)\n• **Majestique Beach:** **LIBRE** (Walay bayad)\n• **Hinagdan Beach:** Wala pa ma-lista sa among database (this information is not available)`;
    }
    return `Here are the **parking fees** for the beaches in Barangay Binongkalan:\n• **Rañola Beach:** ₱50 (Car) | ₱20 (Motorcycle)\n• **Lite Bay Resort:** **FREE** (No parking fee)\n• **Majestique Beach:** **FREE** (No parking fee)\n• **Hinagdan Beach:** Not listed in our verified database (this information is not available)`;
  }

  // 6R. RESTROOM / CR (Broad)
  if (topics.asksRestroom) {
    if (isCeb) {
      return `Mao kini ang detalye sa **CR / Restroom ug Shower** sa mga beach sa Barangay Binongkalan:\n• **Rañola Beach:** ₱5 (ihi) | ₱10 (kaligo/shower)\n• **Lite Bay Resort:** **LIBRE** (Walay bayad ang CR ug shower)\n• **Majestique Beach:** ₱10 (himasa/shower)\n• **Hinagdan Beach:** Naay shower ug kaligoan (wala ma-lista ang specific CR fee sa database)`;
    }
    return `Here is the **restroom (CR) and shower** information for the beaches in Barangay Binongkalan:\n• **Rañola Beach:** ₱5 (restroom) | ₱10 (shower)\n• **Lite Bay Resort:** **FREE** (No restroom or shower fee)\n• **Majestique Beach:** ₱10 (rinse/shower)\n• **Hinagdan Beach:** Has showers and restrooms (specific restroom fee is not listed in our database)`;
  }

  // 6S. ACTIVITIES & RENTALS (Broad)
  if (topics.asksActivities || topics.asksRentals) {
    if (isCeb) {
      return `Mao kini ang mga **activities ug abangan (rentals)** sa mga beach sa Barangay Binongkalan:\n• **Rañola Beach:** Swimming, sugba, overnight tent camping | Salbabida rental: **₱30**\n• **Lite Bay Resort:** Swimming, sugba, **Kayak (₱200 / 2 hrs)** | Life jacket rental: **₱50**\n• **Majestique Beach:** Swimming, sugba, overnight stay | Life jacket rental: **₱50**\n• **Hinagdan Beach:** Swimming, sugba, overnight stay | Salbabida: **₱50**, Life jacket: **₱50–₱100**`;
    }
    return `Here are the **activities and equipment rentals** at the beaches in Barangay Binongkalan:\n• **Rañola Beach:** Swimming, grilling, overnight tent camping | Floater (salbabida): **₱30**\n• **Lite Bay Resort:** Swimming, grilling, **Kayaking (₱200 / 2 hrs)** | Life jacket: **₱50**\n• **Majestique Beach:** Swimming, grilling, overnight stays | Life jacket: **₱50**\n• **Hinagdan Beach:** Swimming, grilling, overnight stays | Floater: **₱50**, Life jacket: **₱50–₱100**`;
  }

  // 6T. PRIVATE BOOKING / WALK-INS (Broad)
  if (topics.asksPrivateBooking) {
    if (isCeb) {
      return `**Walay exclusive/private closure** sa mga beach sa Barangay Binongkalan (**Rañola, Lite Bay, Majestique, ug Hinagdan**) tungod kay abli kini para sa tanan ug **welcome kaayo ang walk-ins**. Pwede sab mo motawag diretso sa ilang contact numbers para sa pag-inquire sa cottages o kwarto.`;
    }
    return `**None of the beaches can be booked for exclusive private closure** in Barangay Binongkalan (**Rañola, Lite Bay, Majestique, and Hinagdan**) as they are open to the public and **walk-ins are welcome**. You may call their contact numbers directly to inquire about cottages or rooms.`;
  }

  // 6U. DISCOUNTS (Broad)
  if (topics.asksDiscount) {
    if (isCeb) {
      return `**Walay special event discounts** sa 4 ka beach sa Barangay Binongkalan (**Rañola, Lite Bay, Majestique, ug Hinagdan**)—regular rates ang gipatuman para sa tanan.`;
    }
    return `There are **no special event discounts** at the 4 beaches in Barangay Binongkalan (**Rañola, Lite Bay, Majestique, and Hinagdan**)—regular rates apply.`;
  }

  // 6V. LOCATION (Broad)
  if (topics.asksLocation) {
    if (isCeb) {
      return `Ang tanang 4 ka verified beaches (**Rañola Beach, Lite Bay Resort, Majestique Beach, ug Hinagdan Beach**) kay nahimutang sa **Barangay Binongkalan, Catmon, Cebu**, daplin ra mismo sa **Cebu North National Highway**.`;
    }
    return `All 4 verified beaches (**Rañola Beach, Lite Bay Resort, Majestique Beach, and Hinagdan Beach**) are located in **Barangay Binongkalan, Catmon, Cebu**, right along the **Cebu North National Highway**.`;
  }

  // 6W. LIST ALL BEACHES / RECOMMENDATIONS
  if (
    lower.includes('which beach') ||
    lower.includes('what beach') ||
    lower.includes('available beach') ||
    lower.includes('all beach') ||
    lower.includes('best beach') ||
    lower.includes('recommend') ||
    lower.includes('nindot') ||
    lower.includes('unsa nga mga beach') ||
    lower.includes('unsay mga beach') ||
    lower.includes('mga beach') ||
    lower.includes('beaches in')
  ) {
    return isCeb
      ? `Naay **4 ka verified beaches** sa Barangay Binongkalan, Catmon, Cebu:\n1. **Rañola Beach (Raniola)** — Pinaka-safe para sa mga bata ug accessible sa senior citizens (Entrance: ₱20–₱30)\n2. **Lite Bay Resort** — Libre ang parking, CR, ug shower; naay kayak (Entrance: ₱50)\n3. **Majestique Beach** — Dili ra batoon ug naay aircon/regular rooms para overnight (Entrance: ₱30)\n4. **Hinagdan Beach** — Dili batoon (balas / sandy shoreline) ug naay affordable rooms ug cottages (Entrance: ₱30–₱50)\n\nUnsa nga beach o detalye ang gusto nimong mahibaw-an?`
      : `There are **4 verified beaches** in Barangay Binongkalan, Catmon, Cebu:\n1. **Rañola Beach (Raniola)** — Safest for kids and accessible for senior citizens (Entrance: ₱20–₱30)\n2. **Lite Bay Resort** — Free parking, restroom, and shower; offers kayaking (Entrance: ₱50)\n3. **Majestique Beach** — Not rocky and offers regular/aircon rooms for overnight stays (Entrance: ₱30)\n4. **Hinagdan Beach** — Natural sandy shoreline with affordable rooms and cottages (Entrance: ₱30–₱50)\n\nWhich beach or question would you like to ask about?`;
  }

  // 6X. CONVERSATIONAL FOLLOW-UP CONTINUATION (when chatting across turns)
  if (
    /\b(which\s+one(\s+is\s+better|\s+would\s+you\s+(pick|choose|recommend))?|what\s+do\s+(you|u)\s+think|is\s+it\s+worth\s+it|the\s+other\s+one|what\s+about\s+the\s+other|yes|yeah|yep|yup|sure|please|go\s+ahead|oo|sige\s+daw|unsa\s+imong\s+ma\s*suggest)\b/i.test(
      lower
    ) &&
    (ctx.focusBeaches.length > 0 || ctx.orderedListedBeaches.length > 0)
  ) {
    const pickKey = ctx.focusBeaches[0] || ctx.orderedListedBeaches[0];
    const b = BEACH_DATA[pickKey];
    if (/\b(other\s+one|what\s+about\s+the\s+other)\b/i.test(lower) && ctx.orderedListedBeaches.length >= 2) {
      const otherKey = ctx.orderedListedBeaches[1];
      const otherB = BEACH_DATA[otherKey];
      return buildSpecificSingleBeachAnswer(otherB, 'tell me about', lang, detectTopicsInText(''));
    }
    return isCeb
      ? `Para nako, nindot gyud kaayo unahon og tan-aw ang **${b.name}**! 😊\n• **Entrance Fee:** ${b.entranceCeb}\n• **Cottage / Table:** ${b.cottagesCeb}\n• **Kwarto / Overnight:** ${b.roomsCeb}\n• **Baybayon:** ${b.batoonCeb}\n• **Oras sa Pag-abli:** ${b.hoursCeb}\n\nGusto ba nimo mahibaw-an kung unsaon pag-commute padulong sa **${b.name}** gikan sa inyong lugar?`
      : `I'd definitely recommend checking out **${b.name}**! 😊\n• **Entrance Fee:** ${b.entranceEn}\n• **Cottages / Tables:** ${b.cottagesEn}\n• **Rooms / Overnight:** ${b.roomsEn}\n• **Shoreline:** ${b.batoonEn}\n• **Operating Hours:** ${b.hoursEn}\n\nWould you like step-by-step commute directions to **${b.name}** from your location?`;
  }

  // 7. Return null so open-ended conversational & other questions are answered by the AI model (Gemini)
  return null;
}

/**
 * Contextual follow-up branch questions
 */
export function getContextualBranchQuestions(
  lastUserText: string,
  lastAssistantText: string
): QuickPromptQuestion[] {
  const combined = `${lastUserText} ${lastAssistantText}`;
  const isCeb = detectLanguage(lastUserText) === 'ceb';
  const topics = detectTopicsInText(combined);

  // If asking about nearest
  if (isNearestBeachQuery(lastUserText)) {
    return isCeb
      ? [
          { label: 'Pinakaduol from Talamban?', question: 'Pinakaduol na beach from Talamban?' },
          { label: 'Pinakaduol from Danao?', question: 'Pinakaduol na beach from Danao?' },
          { label: 'Pinakaduol from Bogo?', question: 'Pinakaduol na beach from Bogo?' },
        ]
      : [
          { label: 'From Cebu City?', question: 'Nearest beach from Cebu City?' },
          { label: 'From Danao?', question: 'Nearest beach from Danao?' },
          { label: 'From Bogo?', question: 'Nearest beach from Bogo?' },
        ];
  }

  // If asking about specific single beach (or 1-2 focused beaches in the reply), suggest follow-ups
  const userBeaches = detectBeachesInText(lastUserText);
  const replyBeaches = detectBeachesInText(lastAssistantText);
  const firstParaBeaches = detectBeachesInText(lastAssistantText.split(/\n\s*\n/)[0] || '');

  if (replyBeaches.length === 2 || (replyBeaches.length > 2 && firstParaBeaches.length === 2)) {
    const pair = replyBeaches.length === 2 ? replyBeaches : firstParaBeaches;
    const b1 = BEACH_DATA[pair[0]];
    const b2 = BEACH_DATA[pair[1]];
    return isCeb
      ? [
          { label: `Detalye sa ${b1.name.split(' ')[0]}`, question: `Unsa man sa ${b1.name}?` },
          { label: `Detalye sa ${b2.name.split(' ')[0]}`, question: `Unsa man sa ${b2.name}?` },
          { label: 'Unsaon pag-commute?', question: 'Unsaon pag-commute padulong didto?' },
        ]
      : [
          { label: `Tell me about ${b1.name.split(' ')[0]}`, question: `Tell me about ${b1.name}` },
          { label: `Tell me about ${b2.name.split(' ')[0]}`, question: `Tell me about ${b2.name}` },
          { label: 'How to commute there?', question: 'How do I commute there?' },
        ];
  }

  const activeBeachKey =
    userBeaches.length === 1
      ? userBeaches[0]
      : replyBeaches.length === 1
      ? replyBeaches[0]
      : firstParaBeaches.length === 1
      ? firstParaBeaches[0]
      : null;

  if (activeBeachKey) {
    const b = BEACH_DATA[activeBeachKey];
    const shortName = b.name.split(' ')[0];
    const branches: QuickPromptQuestion[] = [];

    if (!topics.asksEntrance && !topics.asksCottage) {
      branches.push({
        label: isCeb ? `Presyo sa ${shortName}?` : `${shortName} fees?`,
        question: isCeb ? `Tagpila ang entrance sa ${b.name}?` : `What are the entrance fees at ${b.name}?`,
      });
    }
    if (!topics.asksBatoon) {
      branches.push({
        label: isCeb ? `Batoon ba sa ${shortName}?` : `Is ${shortName} rocky?`,
        question: isCeb ? `Batoon ba ni na beach sa ${shortName}?` : `Is ${b.name} rocky or sandy?`,
      });
    }
    if (!topics.asksSenior) {
      branches.push({
        label: 'Senior accessible?',
        question: isCeb
          ? `Accessible ba ni sa mga senior citizen ang ${b.name}?`
          : `Is ${b.name} accessible for senior citizens?`,
      });
    }

    const nextBeachKey: BeachKey =
      activeBeachKey === 'ranola'
        ? 'litebay'
        : activeBeachKey === 'litebay'
        ? 'majestique'
        : activeBeachKey === 'majestique'
        ? 'hinagdan'
        : 'ranola';
    const nextBeach = BEACH_DATA[nextBeachKey];

    branches.push({
      label: isCeb ? `Kumusta sa ${nextBeach.name.split(' ')[0]}?` : `What about ${nextBeach.name.split(' ')[0]}?`,
      question: isCeb ? `Unsa man sa ${nextBeach.name}?` : `Tell me about ${nextBeach.name}`,
    });

    return branches.slice(0, 3);
  }

  return isCeb
    ? [
        { label: 'Batoon ba o dili?', question: 'Batoon ba ang mga beach o dili?' },
        { label: 'Asay pinaka safe?', question: 'Asay pinaka safe na beach?' },
        { label: 'Senior accessible?', question: 'Accessible ba sa mga senior citizen ang mga beach?' },
      ]
    : [
        { label: 'Entrance & cottage fees?', question: 'What are the entrance and cottage fees?' },
        { label: 'Safest beach?', question: 'Which beach is the safest?' },
        { label: 'Senior accessible?', question: 'Which beaches are accessible for senior citizens?' },
      ];
}
