#!/usr/bin/env node
/**
 * Merge Shipneer deliverability data with state/district data and upload to Firebase.
 *
 * Strategy:
 *  1. Shipneer CSV  - authoritative source for Delivery (Y/N) and COD (Y/N)
 *  2. Complete CSV  - source for state & district (where available)
 *  3. Prefix map    - fallback state lookup for pincodes absent from Complete CSV
 *
 * Usage: node scripts/merge-and-upload-pincodes.js
 */

import fs from "fs";
import path from "path";
import { createRequire } from "module";

const __dirname = import.meta.dirname;
const require   = createRequire(import.meta.url);
const admin     = require("firebase-admin");

// Firebase init
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
  path.join(__dirname, "../firebase-service-account.json");

if (!fs.existsSync(serviceAccountPath)) {
  console.error("Firebase service account not found at:", serviceAccountPath);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

// Indian postal prefix to state map
const PREFIX_STATE_MAP = {
  "110":"DELHI","111":"DELHI",
  "121":"HARYANA","122":"HARYANA","123":"HARYANA","124":"HARYANA","125":"HARYANA","126":"HARYANA","127":"HARYANA","128":"HARYANA","129":"HARYANA","130":"HARYANA","131":"HARYANA","132":"HARYANA","133":"HARYANA","134":"HARYANA","135":"HARYANA",
  "140":"PUNJAB","141":"PUNJAB","142":"PUNJAB","143":"PUNJAB","144":"PUNJAB","145":"PUNJAB","146":"PUNJAB","147":"PUNJAB","148":"PUNJAB","149":"PUNJAB","151":"PUNJAB","152":"PUNJAB","153":"PUNJAB","154":"PUNJAB","155":"PUNJAB","160":"CHANDIGARH U.T.",
  "171":"HIMACHAL PRADESH","172":"HIMACHAL PRADESH","173":"HIMACHAL PRADESH","174":"HIMACHAL PRADESH","175":"HIMACHAL PRADESH","176":"HIMACHAL PRADESH","177":"HIMACHAL PRADESH",
  "180":"JAMMU & KASHMIR","181":"JAMMU & KASHMIR","182":"JAMMU & KASHMIR","183":"JAMMU & KASHMIR","184":"JAMMU & KASHMIR","185":"JAMMU & KASHMIR","190":"JAMMU & KASHMIR","191":"JAMMU & KASHMIR","192":"JAMMU & KASHMIR","193":"JAMMU & KASHMIR","194":"JAMMU & KASHMIR","195":"JAMMU & KASHMIR",
  "200":"UTTAR PRADESH","201":"UTTAR PRADESH","202":"UTTAR PRADESH","203":"UTTAR PRADESH","204":"UTTAR PRADESH","205":"UTTAR PRADESH","206":"UTTAR PRADESH","207":"UTTAR PRADESH","208":"UTTAR PRADESH","209":"UTTAR PRADESH","210":"UTTAR PRADESH","211":"UTTAR PRADESH","212":"UTTAR PRADESH","213":"UTTAR PRADESH","214":"UTTAR PRADESH","215":"UTTAR PRADESH","221":"UTTAR PRADESH","222":"UTTAR PRADESH","223":"UTTAR PRADESH","224":"UTTAR PRADESH","225":"UTTAR PRADESH","226":"UTTAR PRADESH","227":"UTTAR PRADESH","228":"UTTAR PRADESH","229":"UTTAR PRADESH","230":"UTTAR PRADESH","231":"UTTAR PRADESH","232":"UTTAR PRADESH","233":"UTTAR PRADESH","250":"UTTAR PRADESH","251":"UTTAR PRADESH","281":"UTTAR PRADESH","282":"UTTAR PRADESH","283":"UTTAR PRADESH","284":"UTTAR PRADESH","285":"UTTAR PRADESH",
  "246":"UTTARAKHAND","247":"UTTARAKHAND","248":"UTTARAKHAND","249":"UTTARAKHAND","262":"UTTARAKHAND","263":"UTTARAKHAND","271":"UTTARAKHAND",
  "301":"RAJASTHAN","302":"RAJASTHAN","303":"RAJASTHAN","304":"RAJASTHAN","305":"RAJASTHAN","306":"RAJASTHAN","307":"RAJASTHAN","311":"RAJASTHAN","312":"RAJASTHAN","313":"RAJASTHAN","314":"RAJASTHAN","321":"RAJASTHAN","322":"RAJASTHAN","323":"RAJASTHAN","324":"RAJASTHAN","325":"RAJASTHAN","326":"RAJASTHAN","327":"RAJASTHAN","328":"RAJASTHAN","331":"RAJASTHAN","332":"RAJASTHAN","333":"RAJASTHAN","341":"RAJASTHAN","342":"RAJASTHAN","343":"RAJASTHAN","344":"RAJASTHAN","345":"RAJASTHAN",
  "360":"GUJARAT","361":"GUJARAT","362":"GUJARAT","363":"GUJARAT","364":"GUJARAT","365":"GUJARAT","370":"GUJARAT","380":"GUJARAT","382":"GUJARAT","383":"GUJARAT","384":"GUJARAT","385":"GUJARAT","387":"GUJARAT","388":"GUJARAT","389":"GUJARAT","390":"GUJARAT","391":"GUJARAT","392":"GUJARAT","393":"GUJARAT","394":"GUJARAT","395":"GUJARAT","396":"GUJARAT",
  "400":"MAHARASHTRA","401":"MAHARASHTRA","402":"MAHARASHTRA","410":"MAHARASHTRA","411":"MAHARASHTRA","412":"MAHARASHTRA","413":"MAHARASHTRA","414":"MAHARASHTRA","415":"MAHARASHTRA","416":"MAHARASHTRA","421":"MAHARASHTRA","422":"MAHARASHTRA","423":"MAHARASHTRA","424":"MAHARASHTRA","425":"MAHARASHTRA","431":"MAHARASHTRA","440":"MAHARASHTRA","441":"MAHARASHTRA","442":"MAHARASHTRA","443":"MAHARASHTRA","444":"MAHARASHTRA","445":"MAHARASHTRA",
  "450":"MADHYA PRADESH","451":"MADHYA PRADESH","452":"MADHYA PRADESH","453":"MADHYA PRADESH","454":"MADHYA PRADESH","455":"MADHYA PRADESH","456":"MADHYA PRADESH","457":"MADHYA PRADESH","458":"MADHYA PRADESH","460":"MADHYA PRADESH","461":"MADHYA PRADESH","462":"MADHYA PRADESH","463":"MADHYA PRADESH","464":"MADHYA PRADESH","465":"MADHYA PRADESH","466":"MADHYA PRADESH","470":"MADHYA PRADESH","471":"MADHYA PRADESH","472":"MADHYA PRADESH","473":"MADHYA PRADESH","474":"MADHYA PRADESH","475":"MADHYA PRADESH","476":"MADHYA PRADESH","480":"MADHYA PRADESH","481":"MADHYA PRADESH","482":"MADHYA PRADESH","483":"MADHYA PRADESH","484":"MADHYA PRADESH","485":"MADHYA PRADESH","486":"MADHYA PRADESH","487":"MADHYA PRADESH","488":"MADHYA PRADESH","489":"MADHYA PRADESH",
  "490":"CHATTISGARH","491":"CHATTISGARH","492":"CHATTISGARH","493":"CHATTISGARH","494":"CHATTISGARH","495":"CHATTISGARH","496":"CHATTISGARH","497":"CHATTISGARH",
  "500":"TELANGANA","501":"TELANGANA","502":"TELANGANA","503":"TELANGANA","504":"TELANGANA","505":"TELANGANA","506":"TELANGANA","507":"TELANGANA","508":"TELANGANA","509":"TELANGANA",
  "515":"ANDHRA PRADESH","516":"ANDHRA PRADESH","517":"ANDHRA PRADESH","518":"ANDHRA PRADESH","519":"ANDHRA PRADESH","520":"ANDHRA PRADESH","521":"ANDHRA PRADESH","522":"ANDHRA PRADESH","523":"ANDHRA PRADESH","524":"ANDHRA PRADESH","525":"ANDHRA PRADESH","530":"ANDHRA PRADESH","531":"ANDHRA PRADESH","532":"ANDHRA PRADESH","533":"ANDHRA PRADESH","534":"ANDHRA PRADESH","535":"ANDHRA PRADESH",
  "560":"KARNATAKA","561":"KARNATAKA","562":"KARNATAKA","563":"KARNATAKA","564":"KARNATAKA","565":"KARNATAKA","570":"KARNATAKA","571":"KARNATAKA","572":"KARNATAKA","573":"KARNATAKA","574":"KARNATAKA","575":"KARNATAKA","576":"KARNATAKA","577":"KARNATAKA","581":"KARNATAKA","582":"KARNATAKA","583":"KARNATAKA","584":"KARNATAKA","585":"KARNATAKA","586":"KARNATAKA","587":"KARNATAKA","590":"KARNATAKA","591":"KARNATAKA","592":"KARNATAKA","593":"KARNATAKA","594":"KARNATAKA",
  "600":"TAMIL NADU","601":"TAMIL NADU","602":"TAMIL NADU","603":"TAMIL NADU","604":"TAMIL NADU","605":"TAMIL NADU","606":"TAMIL NADU","607":"TAMIL NADU","608":"TAMIL NADU","609":"TAMIL NADU","610":"TAMIL NADU","611":"TAMIL NADU","612":"TAMIL NADU","613":"TAMIL NADU","614":"TAMIL NADU","620":"TAMIL NADU","621":"TAMIL NADU","622":"TAMIL NADU","623":"TAMIL NADU","624":"TAMIL NADU","625":"TAMIL NADU","626":"TAMIL NADU","627":"TAMIL NADU","628":"TAMIL NADU","629":"TAMIL NADU","630":"TAMIL NADU","631":"TAMIL NADU","632":"TAMIL NADU","635":"TAMIL NADU","636":"TAMIL NADU","637":"TAMIL NADU","638":"TAMIL NADU","639":"TAMIL NADU","641":"TAMIL NADU","642":"TAMIL NADU","643":"TAMIL NADU","644":"TAMIL NADU",
  "670":"KERALA","671":"KERALA","672":"KERALA","673":"KERALA","674":"KERALA","675":"KERALA","676":"KERALA","677":"KERALA","678":"KERALA","679":"KERALA","680":"KERALA","681":"KERALA","682":"KERALA","683":"KERALA","684":"KERALA","685":"KERALA","686":"KERALA","691":"KERALA","692":"KERALA","695":"KERALA",
  "700":"WEST BENGAL","711":"WEST BENGAL","712":"WEST BENGAL","713":"WEST BENGAL","721":"WEST BENGAL","722":"WEST BENGAL","723":"WEST BENGAL","731":"WEST BENGAL","732":"WEST BENGAL","733":"WEST BENGAL","734":"WEST BENGAL","735":"WEST BENGAL","741":"WEST BENGAL","742":"WEST BENGAL","743":"WEST BENGAL","744":"WEST BENGAL",
  "751":"ORISSA","752":"ORISSA","753":"ORISSA","754":"ORISSA","755":"ORISSA","756":"ORISSA","757":"ORISSA","758":"ORISSA","759":"ORISSA","760":"ORISSA","761":"ORISSA","762":"ORISSA","763":"ORISSA","764":"ORISSA","765":"ORISSA","766":"ORISSA","767":"ORISSA","768":"ORISSA","769":"ORISSA","770":"ORISSA","771":"ORISSA",
  "800":"BIHAR","801":"BIHAR","802":"BIHAR","803":"BIHAR","804":"BIHAR","805":"BIHAR","811":"BIHAR","812":"BIHAR","813":"BIHAR","814":"BIHAR","815":"BIHAR","816":"BIHAR","821":"BIHAR","822":"BIHAR","823":"BIHAR","824":"BIHAR","825":"BIHAR",
  "826":"JHARKHAND","827":"JHARKHAND","828":"JHARKHAND","829":"JHARKHAND","831":"JHARKHAND","832":"JHARKHAND","833":"JHARKHAND","834":"JHARKHAND","835":"JHARKHAND","836":"JHARKHAND",
  "781":"ASSAM","782":"ASSAM","783":"ASSAM","784":"ASSAM","785":"ASSAM","786":"ASSAM","787":"ASSAM","788":"ASSAM",
  "790":"ARUNACHAL PRADESH","791":"ARUNACHAL PRADESH","792":"ARUNACHAL PRADESH",
  "793":"MEGHALAYA","794":"MEGHALAYA",
  "795":"MANIPUR","796":"MIZORAM","797":"NAGALAND","798":"NAGALAND","799":"TRIPURA",
  "737":"SIKKIM",
};

function getStateFromPrefix(pincode) {
  const s = String(pincode);
  return PREFIX_STATE_MAP[s.slice(0,3)] || PREFIX_STATE_MAP[s.slice(0,2)] || "";
}

async function main() {
  const shipneerPath = path.join(__dirname, "../shipneer pincodes.csv");
  const cleanPath    = path.join(__dirname, "../Complete_All_States_Combined_Pincodes_CLEAN.csv");
  const fullPath     = path.join(__dirname, "../Complete_All_States_Combined_Pincodes.csv");

  if (!fs.existsSync(shipneerPath)) {
    console.error("shipneer pincodes.csv not found"); process.exit(1);
  }

  // Build state lookup from Complete CSV
  const completePath = fs.existsSync(cleanPath) ? cleanPath : fullPath;
  console.log("Loading state data from:", path.basename(completePath));
  const completeLines = fs.readFileSync(completePath,"utf-8").split("\n").slice(1).filter(Boolean);
  const stateMap = new Map();
  for (const row of completeLines) {
    const [pin,state,district] = row.split(",").map(v=>v.trim());
    if (!stateMap.has(pin)) stateMap.set(pin, { state, district });
  }
  console.log(" ", stateMap.size, "pincodes with state info");

  // Parse Shipneer
  console.log("\nLoading Shipneer data...");
  const shipneerLines = fs.readFileSync(shipneerPath,"utf-8").split("\n").slice(1).filter(Boolean);
  const deliverable = shipneerLines.filter(r => r.split(",")[1]?.trim() === "Y");
  console.log(" ", deliverable.length, "deliverable pincodes in Shipneer");

  // Merge
  const seen = new Set();
  const merged = [];
  let fromComplete=0, fromPrefix=0, unknown=0;

  for (const row of deliverable) {
    const parts = row.split(",").map(v=>v.trim());
    const pincode = parseInt(parts[0]);
    if (isNaN(pincode) || seen.has(pincode)) continue;
    seen.add(pincode);

    const delivery = parts[1] || "Y";
    const cod      = parts[2] || "N";
    let state="", district="";

    if (stateMap.has(String(pincode))) {
      const s = stateMap.get(String(pincode));
      state = s.state; district = s.district; fromComplete++;
    } else {
      state = getStateFromPrefix(pincode);
      district = ""; if (state) fromPrefix++; else unknown++;
    }

    merged.push({ pincode, state, district, delivery, cod,
      delivery_available: delivery==="Y", cod_available: cod==="Y" });
  }

  console.log("\nMerge results:");
  console.log("  Total unique deliverable:", merged.length);
  console.log("  State from Complete CSV :", fromComplete);
  console.log("  State from prefix map   :", fromPrefix);
  console.log("  State unknown           :", unknown);

  // Upload
  const BATCH_SIZE = 50;
  let uploaded = 0;
  console.log("\nUploading", merged.length, "pincodes to Firebase...");

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  for (let i = 0; i < merged.length; i += BATCH_SIZE) {
    const slice = merged.slice(i, i+BATCH_SIZE);
    const batchNum = Math.floor(i/BATCH_SIZE) + 1;
    let retries = 5;
    while (retries > 0) {
      const batch = db.batch();
      for (const record of slice) {
        batch.set(db.collection("pincodes").doc(String(record.pincode)), record, { merge: true });
      }
      try {
        await batch.commit();
        uploaded += slice.length;
        break;
      } catch (e) {
        retries--;
        console.log(`  Batch ${batchNum} error (${retries} retries left): ${e.code} - ${e.message.slice(0,80)}`);
        if (retries === 0) throw e;
        await sleep(5000 * (5 - retries)); // exponential backoff
      }
    }
    if (uploaded % 1000 < BATCH_SIZE) {
      console.log("  Progress:", uploaded, "/", merged.length);
    }
    await sleep(300); // throttle to avoid quota exhaustion
  }

  const countSnap = await db.collection("pincodes").count().get();
  console.log("\nDone! Total pincodes in Firebase:", countSnap.data().count);
}

main().then(()=>process.exit(0)).catch(err=>{ console.error("Error:", err.code, err.message); process.exit(1); });

