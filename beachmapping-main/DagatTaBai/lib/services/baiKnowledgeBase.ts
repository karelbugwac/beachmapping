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
  { label: 'Unsay pinakaduol?', question: 'Unsay pinakaduol na beach?' },
  { label: 'Batoon ba o dili?', question: 'Batoon ba ang mga beach o dili?' },
  { label: 'Naay sugbaanan?', question: 'Asa na beach ang naay sugbaanan?' },
  { label: 'Asay pinaka safe?', question: 'Asay pinaka safe na beach?' },
  { label: 'Naay lifeguard?', question: 'Naa bay lifeguard ang mga beach?' },
  { label: 'Naay store / foods?', question: 'Naa bay store or foods ang mga beach?' },
  { label: 'Naay shower?', question: 'Naa bay shower ang mga beach?' },
  { label: 'Senior accessible?', question: 'Accessible ba sa mga senior citizen ang mga beach?' },
  { label: 'Naay sinkhole?', question: 'Are there any sinkholes in any of the beaches?' },
  { label: 'Dali molawm?', question: 'Asa na beaches ang dali molawm?' },
  { label: 'Pwede magda og pets?', question: 'Pwede ba magda ug pets sa mga beach?' },
  { label: 'Taob or hunas?', question: 'Taob or hunas?' },
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
    batoonEn: '**Rañola Beach (Raniola)** is **slightly rocky (batoon gamay)** with small natural pebbles/stones.',
    sugbaCeb: 'Oo, **naay sugbaanan** sa **Rañola Beach (Raniola)**.',
    sugbaEn: 'Yes, **Rañola Beach (Raniola)** has a grilling area (naay sugbaanan).',
    safeCeb: 'Oo, **safe kaayo maligo sa Rañola Beach (Raniola)**, ug kini sab ang **pinaka-safe nga beach labi na para sa mga bata (children) ug senior citizens** tungod kay accessible ug dili dali molawm. Palihug tan-awa sab ang Live Weather update sa among website sa dili pa maligo.',
    safeEn: 'Yes, **Rañola Beach (Raniola) is safe for swimming**, and it is considered the **safest beach especially for children and seniors** because it is accessible and does not get deep quickly. Please check our website Live Weather update before swimming.',
    lifeguardCeb: '**Walay lifeguard** sa **Rañola Beach (Raniola)** (walay lifeguard ang mga beach diri sa Binongkalan), pero naay maabangan nga salbabida gikan sa magsuroy-suroy tag **₱30**.',
    lifeguardEn: 'There is **no lifeguard** at **Rañola Beach (Raniola)** (none of the beaches in Binongkalan have on-duty lifeguards), but floaters (**salbabida**) are available for rent from roving vendors for **₱30**.',
    storeCeb: 'Oo, **naay store ug foods** sa **Rañola Beach (Raniola)** ug naa rasad mga tindahan sa duol daplin sa highway, pero **walay mga baligya nga karne (meat)**. Palit daan og karne sa merkado kung magplano mong magsugba.',
    storeEn: 'Yes, there are **stores and food** at **Rañola Beach (Raniola)** and nearby sari-sari stores along the highway, but **they do not sell raw meat**. Please buy meat from the market in advance if you plan to grill.',
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
    tideEn: 'To check if it is high tide (taob) or low tide (hunas) at **Rañola Beach (Raniola)**, please **refer to the Live Tide Status in the Weather section** on our website for today’s exact hours. Rañola has noticeably exposed shoreline at low tide.',
    parkingCeb: '**₱50** sa sakyanan (car) ug **₱20** sa motor.',
    parkingEn: '**₱50** for cars and **₱20** for motorcycles.',
    restroomCeb: '**₱5** sa ihi ug **₱10** sa kaligo / shower.',
    restroomEn: '**₱5** for restroom urination and **₱10** for shower / bath.',
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
    batoonEn: '**Lite Bay Resort** is **slightly rocky (batoon gamay)** with small pebbles/stones.',
    sugbaCeb: 'Oo, **naay sugbaanan** sa **Lite Bay Resort**.',
    sugbaEn: 'Yes, **Lite Bay Resort** has a grilling area (naay sugbaanan).',
    safeCeb: 'Oo, **safe maligo sa Lite Bay Resort**, mag-amping lang gamay tungod kay medyo dali kini molawm. Naay maabangan nga life jackets tag **₱50**. Palihug tan-awa sab ang Live Weather update sa website sa dili pa maligo.',
    safeEn: 'Yes, **Lite Bay Resort is safe for swimming**, just take extra care as it gets deep quickly. Life jackets are available for rent for **₱50**. Please check the website Live Weather update before swimming.',
    lifeguardCeb: '**Walay lifeguard** sa **Lite Bay Resort** (walay lifeguard ang mga beach sa Binongkalan), pero naay abangan nga **life jackets (₱50)** ug **kayak (₱200 sa 2 ka oras)**.',
    lifeguardEn: 'There is **no lifeguard** at **Lite Bay Resort** (no lifeguards at any Binongkalan beach), but **life jackets (₱50)** and **kayaks (₱200 for 2 hrs)** are available for rent.',
    storeCeb: 'Oo, **naay snacks ug foods** sa **Lite Bay Resort** ug naa ray mga tindahan sa duol daplin sa highway, pero **walay mga baligya nga karne (meat)**. Palit daan og karne sa merkado kung magplano mong magsugba.',
    storeEn: 'Yes, there are **snacks and food** at **Lite Bay Resort** and nearby stores along the highway, but **they do not sell raw meat**. Please buy meat in advance from the market if you plan to grill.',
    showerCeb: 'Oo, **naay shower / kaligoan** sa **Lite Bay Resort** (ug **LIBRE / walay bayad** ang ilang CR ug shower).',
    showerEn: 'Yes, **Lite Bay Resort has showers** and comfort rooms (and both are **FREE of charge**).',
    seniorCeb: '**Dili accessible sa mga senior citizen ang Lite Bay Resort** kay **daghan kini ug hagdanan** paubos sa dagat, busa maglisod ang mga senior.',
    seniorEn: '**Lite Bay Resort is not accessible for senior citizens** because there are many stairs (daghan ug hagdanan) leading down to the beach, making it difficult for seniors.',
    sinkholeCeb: 'Oo, **naay sinkhole sa Lite Bay Resort pero layo ra sad** sa swimming area, busa luwas ug safe ra maligo duol sa baybayon.',
    sinkholeEn: 'Yes, there is a **sinkhole at Lite Bay Resort, but it is also far out** from the swimming area, so swimming near the shore is safe.',
    molawmCeb: 'Oo, **dali molawm ang Lite Bay Resort** tungod kay **dili kini mohunas ug pamaayo** bisan kung low tide.',
    molawmEn: 'Yes, **Lite Bay Resort gets deep quickly** because the water does not recede deeply (dili mohunas ug pamaayo) even during low tide.',
    petsCeb: 'Oo, **pwede kaayo magdala og pets** sa **Lite Bay Resort**! Palihug lang og bantay sa inyong binuhi ug tabangi ang pagmintinar sa kalimpyo.',
    petsEn: 'Yes, **pets are allowed** at **Lite Bay Resort**! Please supervise your pets and help maintain cleanliness.',
    tideCeb: 'Para sa kahimtang sa taob o hunas sa **Lite Bay Resort**, palihug **i-refer ang Live Tide Status sa Weather section** diri sa among website. Timan-i sab nga ang Lite Bay kay **dili mohunas ug pamaayo** bisan kung low tide.',
    tideEn: 'To check if it is high tide (taob) or low tide (hunas) at **Lite Bay Resort**, please **refer to the Live Tide Status in the Weather section** on our website. Note that Lite Bay does not recede deeply even at low tide.',
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
    batoonEn: '**Majestique Beach** is **not rocky (dili ra batoon)**.',
    sugbaCeb: 'Oo, **naay sugbaanan** sa **Majestique Beach**.',
    sugbaEn: 'Yes, **Majestique Beach** has a grilling area (naay sugbaanan).',
    safeCeb: 'Oo, **safe maligo sa Majestique Beach**, mag-amping lang gamay tungod kay medyo dali kini molawm. Naay abangan nga life jackets tag **₱50**. Palihug tan-awa sab ang Live Weather update sa among website sa dili pa maligo.',
    safeEn: 'Yes, **Majestique Beach is safe for swimming**, just take extra care as it gets deep quickly. Life jackets are available for rent for **₱50**. Please check our website Live Weather update before swimming.',
    lifeguardCeb: '**Walay lifeguard** sa **Majestique Beach** (walay lifeguard ang mga beach sa Binongkalan), pero naay maabangan nga **life jackets tag ₱50**.',
    lifeguardEn: 'There is **no lifeguard** at **Majestique Beach** (no lifeguards at any Binongkalan beach), but **life jackets are available for rent for ₱50**.',
    storeCeb: 'Oo, **naay store ug foods** sa **Majestique Beach** ug naa rasad mga tindahan sa duol daplin sa highway, pero **walay mga baligya nga karne (meat)**. Palit daan og karne sa merkado kung magplano mong magsugba.',
    storeEn: 'Yes, there are **stores and food** at **Majestique Beach** and nearby stores along the highway, but **they do not sell raw meat**. Please buy meat from the market in advance if you plan to grill.',
    showerCeb: 'Oo, **naay shower / kaligoan** sa **Majestique Beach** (₱10 ang himasa / rinse).',
    showerEn: 'Yes, **Majestique Beach has showers** and rinse facilities (₱10 for shower / rinse).',
    seniorCeb: '**Dili accessible sa mga senior citizen ang Majestique Beach** kay **daghan kini ug hagdanan** paubos sa dagat, busa maglisod ang mga senior.',
    seniorEn: '**Majestique Beach is not accessible for senior citizens** because there are many stairs (daghan ug hagdanan) leading down to the shore, making it difficult for seniors.',
    sinkholeCeb: '**Walay sinkhole** sa **Majestique Beach**.',
    sinkholeEn: 'There is **no sinkhole** at **Majestique Beach**.',
    molawmCeb: 'Oo, **dali molawm ang Majestique Beach** tungod kay **dili kini mohunas ug pamaayo** bisan kung low tide.',
    molawmEn: 'Yes, **Majestique Beach gets deep quickly** because the water does not recede deeply (dili mohunas ug pamaayo) even during low tide.',
    petsCeb: 'Oo, **pwede kaayo magdala og pets** sa **Majestique Beach**! Palihug lang og bantay sa inyong binuhi ug tipigi ang kalimpyo sa palibot.',
    petsEn: 'Yes, **pets are allowed** at **Majestique Beach**! Please supervise your pets and help maintain cleanliness.',
    tideCeb: 'Para sa kahimtang sa taob o hunas sa **Majestique Beach**, palihug **i-refer ang Live Tide Status sa Weather section** diri sa among website. Timan-i sab nga ang Majestique kay **dili mohunas ug pamaayo** bisan kung low tide.',
    tideEn: 'To check if it is high tide (taob) or low tide (hunas) at **Majestique Beach**, please **refer to the Live Tide Status in the Weather section** on our website. Note that Majestique does not recede deeply even during low tide.',
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
    batoonEn: '**Hinagdan Beach** is **not rocky (dili batoon)** — it has a **sandy shoreline (balas)**!',
    sugbaCeb: 'Oo, **naay sugbaanan** sa **Hinagdan Beach**.',
    sugbaEn: 'Yes, **Hinagdan Beach** has a grilling area (naay sugbaanan).',
    safeCeb: 'Oo, **safe kaayo maligo sa Hinagdan Beach** tungod kay balas ang baybayon ug hinay-hinay ra ang paglawm. Naay abangan nga salbabida (₱50) ug life jackets (₱50–₱100). Palihug tan-awa sab ang Live Weather update sa website sa dili pa maligo.',
    safeEn: 'Yes, **Hinagdan Beach is safe for swimming** with its sandy shoreline and gradual depth. Floaters (₱50) and life jackets (₱50–₱100) are available for rent. Please check our website Live Weather update before swimming.',
    lifeguardCeb: '**Walay lifeguard** sa **Hinagdan Beach** (walay lifeguard ang mga beach sa Binongkalan), pero naay maabangan nga **salbabida (₱50)** ug **life jackets (₱50–₱100)**.',
    lifeguardEn: 'There is **no lifeguard** at **Hinagdan Beach** (no lifeguards at any Binongkalan beach), but **floaters (₱50)** and **life jackets (₱50–₱100)** are available for rent.',
    storeCeb: 'Oo, **naay store ug foods** sa **Hinagdan Beach** ug naa rasad mga tindahan sa duol daplin sa highway, pero **walay mga baligya nga karne (meat)**. Palit daan og karne sa merkado kung magplano mong magsugba.',
    storeEn: 'Yes, there are **stores and food** at **Hinagdan Beach** and nearby stores along the highway, but **they do not sell raw meat**. Please buy meat from the market in advance if you plan to grill.',
    showerCeb: 'Oo, **naay shower / kaligoan** sa **Hinagdan Beach** para sa pag-banlaw o himasa.',
    showerEn: 'Yes, **Hinagdan Beach has showers** and rinse facilities for washing off after swimming.',
    seniorCeb: '**Dili accessible sa mga senior citizen ang Hinagdan Beach** kay **daghan kini ug hagdanan** paubos sa baybayon, busa maglisod ang mga senior.',
    seniorEn: '**Hinagdan Beach is not accessible for senior citizens** because there are many stairs (daghan ug hagdanan) going down to the beach, making it difficult for seniors.',
    sinkholeCeb: '**Walay sinkhole** sa **Hinagdan Beach**.',
    sinkholeEn: 'There is **no sinkhole** at **Hinagdan Beach**.',
    molawmCeb: '**Dili ra dali molawm ang Hinagdan Beach**; balas ang baybayon ug hinay-hinay ra ang paglawm (gradual depth).',
    molawmEn: '**Hinagdan Beach does not get deep quickly**; it has a sandy shoreline and gradual depth.',
    petsCeb: 'Oo, **pwede kaayo magdala og pets** sa **Hinagdan Beach**! Palihug lang og bantay sa inyong binuhi ug tabangi ang pagmintinar sa kalimpyo sa baybayon.',
    petsEn: 'Yes, **pets are allowed** at **Hinagdan Beach**! Please supervise your pets and help keep the beach clean.',
    tideCeb: 'Para sa kahimtang sa taob o hunas sa **Hinagdan Beach**, palihug **i-refer ang Live Tide Status sa Weather section** diri sa among website. Klaro sab kaayo ang paghunas sa Hinagdan.',
    tideEn: 'To check if it is high tide (taob) or low tide (hunas) at **Hinagdan Beach**, please **refer to the Live Tide Status in the Weather section** on our website. Hinagdan has noticeably exposed shoreline at low tide.',
    parkingCeb: 'Pasensya na, wala pa ma-lista sa among database ang bayad sa parking sa **Hinagdan Beach**.',
    parkingEn: 'Sorry, the parking fee for **Hinagdan Beach** is not yet listed in our database.',
    restroomCeb: 'Pasensya na, wala pa ma-lista sa among database ang bayad sa CR sa **Hinagdan Beach**.',
    restroomEn: 'Sorry, the restroom fee for **Hinagdan Beach** is not yet listed in our database.',
  },
};

export function detectLanguage(q: string): 'ceb' | 'tl' | 'en' {
  const lower = ` ${q.toLowerCase()} `;
  if (
    /\b(tagpila|pila|unsa|unsay|asa|asay|abli|sirado|sabado|dominggo|walay|wala|bayad|kwarto|sakyanan|taob|hunas|unsaon|padulong|paingon|gikan|naay|naa|pwede|maayong|kumusta|pinakabarato|barato|pinakaduol|duol|kaligoan|makabangag|kinsa|ngano|kanus-a|ila|ilang|didto|byahe|biyahe|sakay|oras|kung|tinda|tindahan|maligo|balas|ba|mga|dili|batoon|bato-on|bato|sugba|sugbaanan|sugba-anan|ihaw|luwas|bantay|karne|hagdanan|hagdan|molawm|lawm|lawom|pamaayo|iro|ayam|binuhi|kuting)\b/.test(
      lower
    )
  ) {
    return 'ceb';
  }
  if (
    /\b(magkano|saan|paano|anong|anu-ano|bukas|sarado|bayad|kwarto|sasakyan|mula|papuntang|pinakamura|mura|pinakamalapit|malapit|bakit|kailan|sino|nila|doon|biyahe|sakay|ilang|meron|tindahan|ligtas|bato|mabato|ihaw|karne|malalim|aso|pusa)\b/.test(
      lower
    )
  ) {
    return 'tl';
  }
  return 'en';
}

export function detectBeachesInText(text: string): BeachKey[] {
  const lower = text.toLowerCase();
  const found: BeachKey[] = [];
  if (lower.includes('rañola') || lower.includes('ranola') || lower.includes('raniola')) found.push('ranola');
  if (lower.includes('lite bay') || lower.includes('litebay') || lower.includes('light bay')) found.push('litebay');
  if (lower.includes('majestique') || lower.includes('majestic')) found.push('majestique');
  if (lower.includes('hinagdan')) found.push('hinagdan');
  return found;
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
}

export function detectTopicsInText(text: string): TopicFlags {
  const lower = text.toLowerCase();
  return {
    asksMostRocky: /\b(most\s*rocky|pinaka\s*batoon|pinakabatoon|asay\s*pinaka\s*batoon|unsay\s*pinaka\s*batoon|pinaka\s*mabato|pinakamabato|pinaka\s*daghan\s*og\s*bato)\b/i.test(lower),
    asksBatoon: /\b(batoon|bato-on|bato|batoa|rocky|rocks|pebble|pebbles|stone|stones|balas|sand|sandy|white\s*sand|whitesand)\b/i.test(lower),
    asksSugba: /\b(sugba|sugbaanan|sugba-anan|ihaw|ihawan|grill|grilling|barbecue|bbq|barbeque)\b/i.test(lower),
    asksSafest: /\b(pinaka\s*safe|pinakasafe|asay\s*pinaka\s*safe|safest|safest\s*beach|safe\s*for\s*(children|kids|seniors|families))\b/i.test(lower),
    asksSafety: /\b(safe|safety|luwas|delikado|dangerous|wave|waves|bawod|current|ligtas)\b/i.test(lower),
    asksLifeguard: /\b(lifeguard|life\s*guard|bantay\s*dagat|guard)\b/i.test(lower),
    asksStore: /\b(store|stores|food|foods|tinda|tindahan|sari-sari|sari\s*sari|pagkaon|snack|snacks|canteen|karne|meat|shop|palitanan)\b/i.test(lower),
    asksShower: /\b(shower|showers|kaligoan|himasa|rinse|banlaw|ligoan)\b/i.test(lower),
    asksSenior: /\b(senior|seniors|senior\s*citizen|senior\s*citizens|tiguwang|elderly|accessible|wheelchair)\b/i.test(lower),
    asksSinkhole: /\b(sinkhole|sink\s*hole|sinkholes|sink\s*holes|bangag|lungag)\b/i.test(lower),
    asksMolawm: /\b(molawm|mo\s*lawm|dali\s*molawm|dali\s*mo\s*lawm|lawm|lawom|deep|depth|deeply|drop\s*off|drop-off|dropoff|shallow|mababaw|pamaayo|hunas\s*ug\s*pamaayo)\b/i.test(lower),
    asksPets: /\b(pet|pets|iro|ayam|dog|dogs|cat|cats|kuting|hayop|animal|animals)\b/i.test(lower),
    asksTide: /\b(taob|hunas|tide|tides|high\s*tide|low\s*tide|water\s*level)\b/i.test(lower),
    asksEntrance: /\b(entrance|entran|fee|bayad\s*sa\s*pagsulod|pagsulod|per\s*head|per\s*person)\b/i.test(lower),
    asksCottage: /\b(cottage|cottages|table|tables|shed|payag|space)\b/i.test(lower),
    asksRoom: /\b(room|rooms|kwarto|overnight|aircon|ac|short-time|shortime|short\s*time|balay|tent|camp|camping|tulog|katulog|stay)\b/i.test(lower),
    asksHours: /\b(open|opening|close|closing|operating|schedule|abli|sirado|mangabre|manirado|saturday|sabado|sunday|dominggo|everyday|kada\s*adlaw)\b/i.test(lower),
    asksContact: /\b(contact|number|phone|cellphone|call|text|tawag|reach)\b/i.test(lower),
    asksParking: /\b(parking|park|car|motor|motorcycle|sakyanan)\b/i.test(lower),
    asksRestroom: /\b(restroom|restrooms|cr|comfort\s*room|toilet|ihi|libang)\b/i.test(lower),
    asksActivities: /\b(activity|activities|snorkel|snorkeling|kayak|kayaking|fishing|lingaw)\b/i.test(lower),
    asksRentals: /\b(rent|rental|rentals|equipment|salbabida|floater|life\s*jacket|lifejacket|vest|goggles|fins|mouthpiece|abang)\b/i.test(lower),
    asksPrivateBooking: /\b(book|booking|mabookingan|ma-bookingan|bookingan|reserve|reservation|private|exclusive|walk-in|walk\s*in)\b/i.test(lower),
    asksDiscount: /\b(discount|discounts|promo|promos|event|events|birthday|birthdays|reunion|team\s*building|group\s*rate|less|hangyo)\b/i.test(lower),
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
    t.asksDiscount
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
 * Builds specific answers for a single beach
 */
function buildSpecificSingleBeachAnswer(
  b: StructuredBeachData,
  lower: string,
  lang: 'ceb' | 'tl' | 'en',
  asks: TopicFlags
): string {
  const isCeb = lang === 'ceb';

  // Specific single topic checks
  if (asks.asksBatoon) {
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

  // General profile of single beach
  if (isCeb) {
    return `Mao kini ang mga detalye sa **${b.name}**:\n• **Oras sa Pag-abli:** ${b.hoursCeb}\n• **Entrance Fee:** ${b.entranceCeb}\n• **Cottage / Table:** ${b.cottagesCeb}\n• **Kwarto / Overnight:** ${b.roomsCeb}\n• **Batoon ba:** ${b.batoonCeb}\n• **Sugbaanan:** ${b.sugbaCeb}\n• **Senior Citizens:** ${b.seniorCeb}\n• **Sinkhole:** ${b.sinkholeCeb}\n• **Dali molawm:** ${b.molawmCeb}\n• **Pets:** ${b.petsCeb}\n• **Contact:** ${b.contact}`;
  }

  return `Here are the details for **${b.name}**:\n• **Operating Hours:** ${b.hoursEn}\n• **Entrance Fee:** ${b.entranceEn}\n• **Cottages / Tables:** ${b.cottagesEn}\n• **Rooms / Overnight:** ${b.roomsEn}\n• **Shoreline (Batoon):** ${b.batoonEn}\n• **Grilling (Sugbaanan):** ${b.sugbaEn}\n• **Senior Citizen Accessibility:** ${b.seniorEn}\n• **Sinkhole:** ${b.sinkholeEn}\n• **Depth (Dali molawm):** ${b.molawmEn}\n• **Pets:** ${b.petsEn}\n• **Contact:** ${b.contact}`;
}

export function getBaiApologyFallback(userQuery: string, userName?: string | null): string {
  const lang = detectLanguage(userQuery);
  const firstName = userName ? userName.trim().split(/\s+/)[0] : '';
  const nameSuffix = firstName ? `, **${firstName}**` : '';

  if (lang === 'ceb') {
    return `Maayong adlaw${nameSuffix}. Subay sa among opisyal nga database sa **Barangay Binongkalan, Catmon, Cebu**, **wala akoy napalgan nga beripikadong impormasyon** kabahin sa maong pangutana o detalye.\n\nAron mahatagan kamo og tukma ug pormal nga giya, andam ako motubag sa mga beripikadong detalye alang sa 4 ka opisyal nga beach resort (**Rañola Beach**, **Lite Bay Resort**, **Majestique Beach**, ug **Hinagdan Beach**) kabahin sa:\n• **Lokasyon ug Byahe:** Pinakaduol nga beach gikan sa inyong lugar ug giya sa commute\n• **Baybayon:** Batoon ba o dili (rocky shoreline), kalawmon sa tubig (dali molawm), ug baybayon\n• **Kaluwasan:** Pinaka-safe nga beach, kondisyon sa dagat, ug kahimtang sa lifeguards\n• **Fasilidad ug Serbisyo:** Sugbaanan, tindahan/pagkaon, shower/himasa, ug senior citizen accessibility\n• **Kondisyon sa Dagat:** Sinkholes, taob ug hunas (live tide schedule), ug pagdala og mga pets\n• **Presyo ug Oras:** Entrance fees, cottages, mga kwarto, ug operating hours\n\nPalihug isulti kon asa niini ang buot ninyong ipangutana.`;
  }

  if (lang === 'tl') {
    return `Magandang araw po${nameSuffix}. Ayon sa opisyal na database ng **Barangay Binongkalan, Catmon, Cebu**, **wala po akong natagpuang beripikadong impormasyon** ukol sa inyong katanungan.\n\nUpang mabigyan kayo ng tumpak at pormal na gabay, maaari po ninyo akong tanungin tungkol sa 4 na opisyal na beach resort (**Rañola Beach**, **Lite Bay Resort**, **Majestique Beach**, at **Hinagdan Beach**) ukol sa:\n• **Lokasyon at Commute:** Pinakamalapit na beach mula sa inyong pinanggalingan at direksyon sa biyahe\n• **Dalampasigan:** Mabato ba o hindi, lalim ng tubig, at buhangin\n• **Kaligtasan:** Pinakaligtas na beach at lifeguards\n• **Pasilidad:** Sugbaanan/ihawan, tindahan/pagkain, shower, at senior citizen accessibility\n• **Kondisyon ng Dagat:** Sinkholes, taob/hunas (tides), at pagdadala ng pets\n• **Bayarin at Oras:** Entrance fees, cottage rates, mga kwarto, at operating hours\n\nMangyaring sabihin po kung alin sa mga ito ang nais ninyong itanong.`;
  }

  return `Good day${nameSuffix}. According to the official verified database of **Barangay Binongkalan, Catmon, Cebu**, **I do not have verified information** regarding this specific inquiry.\n\nTo ensure you receive accurate and formal assistance, I can provide verified information for our 4 official beach resorts (**Rañola Beach**, **Lite Bay Resort**, **Majestique Beach**, and **Hinagdan Beach**) on the following topics:\n• **Location & Commute:** Nearest beach based on your starting origin and step-by-step commute directions\n• **Shoreline Conditions:** Rocky conditions (batoon ba o dili), water depth (dali molawm), and sandy shores\n• **Safety & Lifeguards:** Safest beach for families/seniors and lifeguard status\n• **Facilities & Amenities:** Grilling areas (sugbaanan), food/stores, showers, and senior citizen accessibility\n• **Marine Conditions:** Sinkhole details, live tides (taob/hunas), and pet policies\n• **Rates & Schedules:** Entrance fees, cottage and table rentals, room accommodations, and operating hours\n\nPlease let me know which of these verified topics you would like to inquire about.`;
}

/**
 * Main matching engine: handles specific per-beach questions, broad multi-beach questions,
 * nearest-beach queries, and context continuation.
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

  // 1. Greetings
  if (
    /^(hi+|hello+|hey+|good\s*(morning|afternoon|evening|day)|greetings|yo|sup|hola|hi\s+bai|hello\s+bai|hey\s+bai)$/i.test(
      cleanWords
    )
  ) {
    return `Hello${nameSuffix}! Maayong adlaw! 👋 I'm **Bai**, your local beach guide for **Dagat Ta Bai** in Barangay Binongkalan, Catmon, Cebu. Which beach (**Rañola Beach**, **Lite Bay Resort**, **Majestique Beach**, or **Hinagdan Beach**) or detail would you like to ask about?`;
  }

  if (
    /^(maayong\s*(adlaw|buntag|udto|hapon|gabii)|mayng\s*(adlaw|buntag|hapon|gabii)|kumusta(\s+ka)?(\s+bai)?|musta(\s+bai)?|ayo+)$/i.test(
      cleanWords
    )
  ) {
    return `Maayong adlaw sab kanimo${nameSuffix}! 👋 Ako si **Bai**, ang imong local guide diri sa Barangay Binongkalan, Catmon, Cebu. Makapangutana ka bahin sa **Rañola Beach, Lite Bay Resort, Majestique Beach, o Hinagdan Beach**!`;
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

  // Find recent beach in conversation history for single-beach follow-ups
  let contextBeach: BeachKey | undefined = undefined;
  if (conversationHistory.length > 0) {
    for (let i = conversationHistory.length - 1; i >= 0; i--) {
      const prevBeaches = detectBeachesInText(conversationHistory[i].text);
      if (prevBeaches.length === 1) {
        contextBeach = prevBeaches[0];
        break;
      }
    }
  }

  // 2. Nearest Beach from location / Broad Nearest
  if (isNearestBeachQuery(q)) {
    const nearestReply = matchNearestBeachFromLocation(q);
    if (nearestReply) return nearestReply;
  }

  // 3. Commute & travel directions
  if (isExplicitCommuteText(q)) {
    const commuteReply = matchCebuCommuteAndTravelHours(q, false, contextBeach);
    if (commuteReply) return commuteReply;
  }

  // 4. Detect targeted beach(es) and topic(s)
  let targetBeaches = detectBeachesInText(q);
  const topics = detectTopicsInText(q);

  // Check multi-turn context continuation only if:
  // - No beach was explicitly mentioned in the query
  // - The query is NOT comparative or broad (e.g. NOT "which beach", "most rocky", "asay", "unsay", "all beaches", etc.)
  // - A previous context beach exists and the user either asks about "this beach" or a specific follow-up topic
  if (targetBeaches.length === 0 && contextBeach && !isComparativeOrBroadQuery(lower)) {
    const refersToThis = /\b(this\s*beach|kani\s*(nga|na)\s*beach|ni\s*(nga|na)\s*beach|ani\s*(nga|na)\s*beach|diri\s*(nga|na)\s*beach|ari\s*(nga|na)\s*beach)\b/i.test(lower);
    if (refersToThis || hasAnyTopic(topics)) {
      targetBeaches = [contextBeach];
    }
  }

  // 5. SPECIFIC BEACH ANSWER: If ONE beach is targeted
  if (targetBeaches.length === 1) {
    const b = BEACH_DATA[targetBeaches[0]];
    return buildSpecificSingleBeachAnswer(b, lower, lang, topics);
  }

  // 6. BROAD QUESTIONS (User did NOT specify 1 beach, or asked about "mga beach" / "all beaches"):

  // 6A. BATOON BA O DILI / MOST ROCKY (Broad)
  if (topics.asksMostRocky) {
    if (isCeb) {
      return `Sa mga beach sa Barangay Binongkalan, **walay purong o sobra ka batoon nga beach**, apan ang **Rañola Beach (Raniola)** ug **Lite Bay Resort** ang **batoon gamay** (adunay ginagmay nga bato o pebbles). Samtang ang **Majestique Beach** kay **dili ra batoon**, ug ang **Hinagdan Beach** kay **dili batoon** (balas / sandy shoreline kini).\n\n• **Rañola Beach (Raniola):** Batoon gamay\n• **Lite Bay Resort:** Batoon gamay\n• **Majestique Beach:** Dili ra batoon\n• **Hinagdan Beach:** Dili batoon (balas)`;
    }
    return `Among the beaches in Barangay Binongkalan, **none of the beaches are excessively or purely rocky**, but **Rañola Beach (Raniola)** and **Lite Bay Resort** are **slightly rocky (batoon gamay)** with small natural pebbles/stones. Meanwhile, **Majestique Beach** is **not rocky (dili ra batoon)**, and **Hinagdan Beach** is **not rocky (dili batoon)** as it has a sandy shoreline.\n\n• **Rañola Beach (Raniola):** Slightly rocky (batoon gamay)\n• **Lite Bay Resort:** Slightly rocky (batoon gamay)\n• **Majestique Beach:** Not rocky (dili ra batoon)\n• **Hinagdan Beach:** Not rocky (dili batoon / sandy)`;
  }

  if (topics.asksBatoon) {
    if (isCeb) {
      return `Mao kini ang kahimtang sa baybayon (kung **batoon o dili**) sa mga beach sa Barangay Binongkalan:\n• **Rañola Beach (Raniola):** **Batoon gamay**\n• **Lite Bay Resort:** **Batoon gamay**\n• **Majestique Beach:** **Dili ra batoon**\n• **Hinagdan Beach:** **Dili batoon** (sand / balas ang baybayon)`;
    }
    return `Here is the shoreline condition (**rocky/batoon or not**) for the beaches in Barangay Binongkalan:\n• **Rañola Beach (Raniola):** **Slightly rocky (batoon gamay)**\n• **Lite Bay Resort:** **Slightly rocky (batoon gamay)**\n• **Majestique Beach:** **Not rocky (dili ra batoon)**\n• **Hinagdan Beach:** **Not rocky (dili batoon)** — has a sandy shoreline (balas)`;
  }

  // 6B. SUGBAANAN (Broad)
  if (topics.asksSugba) {
    if (isCeb) {
      return `**Naay sugbaanan ang tanang 4 ka beach** sa Barangay Binongkalan:\n• **Rañola Beach (Raniola):** Naay sugbaanan\n• **Lite Bay Resort:** Naay sugbaanan\n• **Majestique Beach:** Naay sugbaanan\n• **Hinagdan Beach:** Naay sugbaanan\n\n💡 Pwede kaayo mag-ihaw o magsugba sa ilang cottages/tables basta magpabilin lang nga limpyo ang palibot.`;
    }
    return `**All 4 beaches in Barangay Binongkalan have grilling areas (naay sugbaanan)**:\n• **Rañola Beach (Raniola):** Has grilling area (naay sugbaanan)\n• **Lite Bay Resort:** Has grilling area (naay sugbaanan)\n• **Majestique Beach:** Has grilling area (naay sugbaanan)\n• **Hinagdan Beach:** Has grilling area (naay sugbaanan)\n\n💡 Grilling is permitted at their cottages and tables as long as guests clean up after use.`;
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
    return `There are **no lifeguards at any of the beaches** in Barangay Binongkalan (none of the 4 beaches have lifeguards). However, **life jackets and floaters (salbabida)** are available for rent at the resorts for your safety.`;
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
    return `Yes, **all beaches in Barangay Binongkalan have shower / rinse facilities**:\n• **Rañola Beach (Raniola):** Has shower (₱10 for shower)\n• **Lite Bay Resort:** Has shower (**FREE** of charge)\n• **Majestique Beach:** Has shower (₱10 for rinse/himasa)\n• **Hinagdan Beach:** Has showers and rinse facilities`;
  }

  // 6G. SENIOR CITIZEN ACCESSIBILITY (Broad)
  if (topics.asksSenior) {
    if (isCeb) {
      return `• **Rañola Beach (Raniola):** **Yes, accessible sa mga senior citizen** kay patag kini ug dali rang sudlon gikan sa highway nga walay lisod nga mga hagdanan.\n• **Lite Bay Resort, Majestique Beach, ug Hinagdan Beach:** **Dili accessible sa mga senior citizen** tungod kay **daghan ug hagdanan** paubos sa dagat, busa maglisod ang mga senior.`;
    }
    return `• **Rañola Beach (Raniola):** **Yes, accessible for senior citizens** because it is flat and easy to enter from the highway without steep stairs.\n• **Lite Bay Resort, Majestique Beach, and Hinagdan Beach:** **Not accessible for senior citizens** because there are many stairs (daghan ug hagdanan) leading down to the shore, making it difficult for seniors.`;
  }

  // 6H. SINKHOLE (Broad)
  if (topics.asksSinkhole) {
    if (isCeb) {
      return `Mao kini ang bahin sa sinkhole sa tanang 4 ka beach sa Barangay Binongkalan:\n• **Rañola Beach (Raniola):** Naay sinkhole pero **layo ra** sa swimming area (safe ra maligo sa duol)\n• **Lite Bay Resort:** Naay sinkhole pero **layo ra sad**\n• **Majestique Beach:** **Wala** (walay sinkhole)\n• **Hinagdan Beach:** **Wala** (walay sinkhole)`;
    }
    return `Here is the sinkhole information for all 4 beaches in Barangay Binongkalan:\n• **Rañola Beach (Raniola):** Has a sinkhole, but it is **far out** from the swimming area (safe to swim near the shore)\n• **Lite Bay Resort:** Has a sinkhole, but it is **also far out**\n• **Majestique Beach:** **None (Wala)**\n• **Hinagdan Beach:** **None (Wala)**`;
  }

  // 6I. DALI MOLAWM / DEPTH (Broad)
  if (topics.asksMolawm) {
    if (isCeb) {
      return `Mao kini ang bahin sa kalawmon sa mga beach sa Barangay Binongkalan:\n• **Lite Bay Resort ug Majestique Beach:** **Dali ra molawm** tungod kay **dili sila mohunas ug pamaayo** bisan kung low tide.\n• **Rañola Beach ug Hinagdan Beach:** **Dili ra dali molawm** (hinay-hinay ra ang paglawm ug mas angay sa mga bata).`;
    }
    return `Here is the water depth information for the beaches in Barangay Binongkalan:\n• **Lite Bay Resort and Majestique Beach:** **Get deep quickly (dali molawm)** because they do not recede deeply (dili mohunas ug pamaayo) even at low tide.\n• **Rañola Beach and Hinagdan Beach:** **Do not get deep quickly** (they have a gradual slope and are safer for kids).`;
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
    return `Tide conditions (taob or hunas) follow the **Live Tide Schedule in the Weather section** on our website (showing real-time water levels and schedules for today).\n\n💡 **Note:** **Lite Bay Resort and Majestique Beach** do not recede deeply (dili mohunas ug pamaayo) even during low tide, whereas **Rañola Beach and Hinagdan Beach** have noticeably exposed shorelines during low tide.`;
  }

  // 6L. ENTRANCE FEES (Broad)
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

  // 6O. LIST ALL BEACHES
  if (
    lower.includes('which beach') ||
    lower.includes('what beach') ||
    lower.includes('available beach') ||
    lower.includes('all beach') ||
    lower.includes('unsa nga mga beach') ||
    lower.includes('unsay mga beach')
  ) {
    return isCeb
      ? `Naay **4 ka verified beaches** sa Barangay Binongkalan, Catmon, Cebu:\n1. **Rañola Beach (Raniola)**\n2. **Lite Bay Resort**\n3. **Majestique Beach**\n4. **Hinagdan Beach**\n\nUnsa nga beach o detalye (batoon ba, sugbaanan, safety, lifeguard, tindahan, shower, senior accessibility, sinkhole, dali molawm, pets, o taob/hunas) ang gusto nimong mahibaw-an?`
      : `There are **4 verified beaches** in Barangay Binongkalan, Catmon, Cebu:\n1. **Rañola Beach (Raniola)**\n2. **Lite Bay Resort**\n3. **Majestique Beach**\n4. **Hinagdan Beach**\n\nWhich beach or question (rocky/batoon, grilling/sugbaanan, safety, lifeguards, store/foods, showers, senior accessibility, sinkholes, depth, pets, or tides) would you like to ask about?`;
  }

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
    return [
      { label: 'Pinakaduol from Talamban?', question: 'Pinakaduol na beach from Talamban?' },
      { label: 'Pinakaduol from Danao?', question: 'Pinakaduol na beach from Danao?' },
      { label: 'Pinakaduol from Sogod?', question: 'Pinakaduol na beach from Sogod?' },
      { label: 'Pinakaduol from Bogo?', question: 'Pinakaduol na beach from Bogo?' },
    ];
  }

  // If asking about specific single beach, suggest other topics for that beach + switch to another beach
  const userBeaches = detectBeachesInText(lastUserText);
  const replyBeaches = detectBeachesInText(lastAssistantText);
  const activeBeachKey =
    userBeaches.length === 1
      ? userBeaches[0]
      : replyBeaches.length === 1
      ? replyBeaches[0]
      : null;

  if (activeBeachKey) {
    const b = BEACH_DATA[activeBeachKey];
    const branches: QuickPromptQuestion[] = [];

    if (!topics.asksBatoon) {
      branches.push({
        label: isCeb ? `Batoon ba sa ${b.name.split(' ')[0]}?` : `Is ${b.name.split(' ')[0]} rocky?`,
        question: `Batoon ba ni na beach sa ${b.name.split(' ')[0]}?`,
      });
    }
    if (!topics.asksSugba) {
      branches.push({
        label: isCeb ? `Naay sugbaanan?` : `Has sugbaanan?`,
        question: `Naa bay sugbaanan sa ${b.name}?`,
      });
    }
    if (!topics.asksSenior) {
      branches.push({
        label: isCeb ? `Senior accessible?` : `Senior accessible?`,
        question: `Accessible ba ni sa mga senior citizen ang ${b.name}?`,
      });
    }
    if (!topics.asksSinkhole) {
      branches.push({
        label: isCeb ? `Naay sinkhole?` : `Is there a sinkhole?`,
        question: `Is there a sinkhole in ${b.name}?`,
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
      question: `Unsa man sa ${nextBeach.name}?`,
    });

    return branches.slice(0, 4);
  }

  return [
    { label: 'Batoon ba o dili?', question: 'Batoon ba ang mga beach o dili?' },
    { label: 'Naay sugbaanan?', question: 'Asa na beach ang naay sugbaanan?' },
    { label: 'Asay pinaka safe?', question: 'Asay pinaka safe na beach?' },
    { label: 'Senior accessible?', question: 'Accessible ba sa mga senior citizen ang mga beach?' },
  ];
}
