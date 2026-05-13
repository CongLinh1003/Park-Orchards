const fs = require('fs');

const mockups = [
  { "number": "1", "name": "LIAM BUHAGIAR", "nickname": "BUDGIE", "gender": "Men" },
  { "number": "2", "name": "JAMES PARSONS", "nickname": "PARSO", "gender": "Men" },
  { "number": "3", "name": "LIAM JEFFS", "nickname": "JEFFA", "gender": "Men" },
  { "number": "4", "name": "JAYE WITNISH", "nickname": "WITTA", "gender": "Men" },
  { "number": "5", "name": "ALEX MAGNANO", "nickname": "AL", "gender": "Men" },
  { "number": "6", "name": "LIAM TAYLOR", "nickname": "LT", "gender": "Men" },
  { "number": "7", "name": "MICHAEL PROSENAK", "nickname": "PROZ", "gender": "Men" },
  { "number": "8", "name": "CONNOR HICKEY", "nickname": "HICKEY", "gender": "Men" },
  { "number": "9", "name": "LIAM WEBB", "nickname": "WEBBY", "gender": "Men" },
  { "number": "10", "name": "LEX HARTNETT", "nickname": "BHAT", "gender": "Men" },
  { "number": "11", "name": "JOSH MCAULIFFE", "nickname": "JMAC", "gender": "Men" },
  { "number": "12", "name": "LEWIS DOWNIE", "nickname": "LD", "gender": "Men" },
  { "number": "13", "name": "SAMMY PREST", "nickname": "PRESTY", "gender": "Men" },
  { "number": "14", "name": "SAM HERON", "nickname": "FART", "gender": "Men" },
  { "number": "15", "name": "TOM LIVINGSTONE", "nickname": "LIVO", "gender": "Men" },
  { "number": "16", "name": "HARRISON LEONARD", "nickname": "LENNY", "gender": "Men" },
  { "number": "17", "name": "JACOB PRICE-INGLIS", "nickname": "NOODLES", "gender": "Men" },
  { "number": "18", "name": "NIELS WITHOFF", "nickname": "HOFF", "gender": "Men" },
  { "number": "19", "name": "CIARAN HICKEY", "nickname": "CIZ", "gender": "Men" },
  { "number": "20", "name": "MASON BLAKEY", "nickname": "BIG RED", "gender": "Men" },
  { "number": "21", "name": "JOSH VOOGD", "nickname": "OOGIE", "gender": "Men" },
  { "number": "22", "name": "DYLAN KNIGHT", "nickname": "DYL", "gender": "Men" },
  { "number": "23", "name": "MASON WITNISH", "nickname": "WITTA", "gender": "Men" },
  { "number": "24", "name": "KANE KEPPEL", "nickname": "KEPP", "gender": "Men" },
  { "number": "25", "name": "TOM WILSON", "nickname": "WILLO", "gender": "Men" },
  { "number": "26", "name": "TYLER PRUNTY", "nickname": "JOHN", "gender": "Men" },
  { "number": "27", "name": "JACK CULLEN", "nickname": "BUCKETS", "gender": "Men" },
  { "number": "29", "name": "LIAM CRIDLAND", "nickname": "CRIDDA", "gender": "Men" },
  { "number": "30", "name": "MATT HAYTHORNE", "nickname": "HAYTH", "gender": "Men" },
  { "number": "31", "name": "BEN PANZA", "nickname": "PANZ", "gender": "Men" },
  { "number": "32", "name": "LUKE CORMACK", "nickname": "CORM", "gender": "Men" },
  { "number": "33", "name": "MCLAREN SPITERI", "nickname": "MACCA", "gender": "Men" },
  { "number": "34", "name": "TOM REES", "nickname": "REESY", "gender": "Men" },
  { "number": "35", "name": "JOSH CHAPPELL", "nickname": "CHAPPY", "gender": "Men" },
  { "number": "36", "name": "JAMAICA WOODS", "nickname": "WOODSY", "gender": "Men" },
  { "number": "37", "name": "STEFAN D'SOUZA", "nickname": "STEF", "gender": "Men" },
  { "number": "29", "name": "TIGE RIDLEY", "nickname": "TIG", "gender": "Men" },
  { "number": "38", "name": "CRISTIAN CIAMPA", "nickname": "CRISO", "gender": "Men" },
  { "number": "40", "name": "WILL HELIOTIS", "nickname": "TRUCK", "gender": "Men" },
  { "number": "42", "name": "WILL TAIT", "nickname": "TAITY", "gender": "Men" },
  { "number": "43", "name": "HENRY AMEER", "nickname": "STAUNCH", "gender": "Men" },
  { "number": "44", "name": "HAYDEN CAMPBELL", "nickname": "DORSAL", "gender": "Men" },
  { "number": "45", "name": "MAX MORTON", "nickname": "MOOT", "gender": "Men" },
  { "number": "46", "name": "MAX HARRISON", "nickname": "MAXY", "gender": "Men" },
  { "number": "48", "name": "DARCY MONEY", "nickname": "D MONEY", "gender": "Men" },
  { "number": "49", "name": "TYSON HARRAP", "nickname": "RAPTOR", "gender": "Men" },
  { "number": "50", "name": "SAM TSOUKATOS", "nickname": "SAMMY", "gender": "Men" },
  { "number": "51", "name": "JAMES DEMPSEY", "nickname": "DEMPS", "gender": "Men" },
  { "number": "52", "name": "TOM HEFFERNAN", "nickname": "HEFFA", "gender": "Men" },
  { "number": "53", "name": "ZACH VIPPOND", "nickname": "VIP", "gender": "Men" },
  { "number": "54", "name": "LENNY HICKEY", "nickname": "LEN", "gender": "Men" },
  { "number": "55", "name": "TARKYN LEONARD", "nickname": "ROOSTER", "gender": "Men" },
  { "number": "56", "name": "ALEC LEESON", "nickname": "AL", "gender": "Men" },
  { "number": "57", "name": "MITCH SCHAFER", "nickname": "THE GENERAL", "gender": "Men" },
  { "number": "58", "name": "TOM MACROKANIS", "nickname": "TMAC", "gender": "Men" },
  { "number": "59", "name": "SAM LOWTHER", "nickname": "SLOWTH", "gender": "Men" },
  { "number": "63", "name": "BEN MUNKS", "nickname": "MUNKSY", "gender": "Men" },
  { "number": "66", "name": "JOSH GALSTIANS", "nickname": "GAL", "gender": "Men" },
  { "number": "70", "name": "JAKE GALSTIANS", "nickname": "GAL", "gender": "Men" },
  { "number": "71", "name": "TRAVIS MIHAN", "nickname": "TRAV", "gender": "Men" },
  { "number": "75", "name": "ISAAC MACKLIN", "nickname": "CACKA", "gender": "Men" },
  { "number": "77", "name": "ZAC SCHAFER", "nickname": "CAZ", "gender": "Men" },
  { "number": "80", "name": "RYAN CHOONG", "nickname": "CHOONGY", "gender": "Men" },
  { "number": "81", "name": "TOM WORTHINGTON", "nickname": "WORTHO", "gender": "Men" },
  { "number": "88", "name": "ALEX MACROKANIS", "nickname": "AMAC", "gender": "Men" },
  { "number": "1", "name": "KRISTEN BERTOLDI", "nickname": "KB", "gender": "Women" },
  { "number": "2", "name": "ALANNAH PANZA", "nickname": "AP", "gender": "Women" },
  { "number": "3", "name": "AVA CAMPBELL", "nickname": "JEFFA", "gender": "Women" },
  { "number": "4", "name": "JORJA LIVINGSTONE", "nickname": "J LIVO", "gender": "Women" },
  { "number": "5", "name": "ALANNAH BOELL", "nickname": "LANS", "gender": "Women" },
  { "number": "6", "name": "ELLA MERTON", "nickname": "LT", "gender": "Women" },
  { "number": "7", "name": "BRIANNA CLARK", "nickname": "BRI", "gender": "Women" },
  { "number": "8", "name": "GEORGIE SEARLE", "nickname": "GEO", "gender": "Women" },
  { "number": "9", "name": "MIA MCAULIFFE", "nickname": "MEEZ", "gender": "Women" },
  { "number": "10", "name": "MATILDA RAE", "nickname": "TILLY", "gender": "Women" },
  { "number": "12", "name": "TESS POWER", "nickname": "JMAC", "gender": "Women" },
  { "number": "13", "name": "DAISY COOPER", "nickname": "LD", "gender": "Women" },
  { "number": "14", "name": "CHLOE LIVINGSTONE", "nickname": "CHLO", "gender": "Women" },
  { "number": "15", "name": "RUBY CHANDLER", "nickname": "PARSO", "gender": "Women" },
  { "number": "16", "name": "ELLY HARTNETT", "nickname": "JEFFA", "gender": "Women" },
  { "number": "17", "name": "JADE HUTCHINSON", "nickname": "WITTA", "gender": "Women" },
  { "number": "18", "name": "KAITLYN RUKAVINA", "nickname": "RUKA", "gender": "Women" },
  { "number": "19", "name": "REMY ARCHER", "nickname": "LT", "gender": "Women" },
  { "number": "20", "name": "CLAIRE BONE", "nickname": "PROZ", "gender": "Women" },
  { "number": "21", "name": "KATE BROWN", "nickname": "HICKEY", "gender": "Women" },
  { "number": "22", "name": "SIENNA BETT", "nickname": "WEBBY", "gender": "Women" },
  { "number": "23", "name": "JASMINE TAYLOR", "nickname": "JAZZI", "gender": "Women" },
  { "number": "24", "name": "SIENNA POLLOCK", "nickname": "JMAC", "gender": "Women" },
  { "number": "25", "name": "MOLLY HEYMANSON", "nickname": "MOL", "gender": "Women" },
  { "number": "26", "name": "ALLIE KING", "nickname": "BUDGIE", "gender": "Women" },
  { "number": "27", "name": "TEAGAN BRADLEY", "nickname": "PARSO", "gender": "Women" },
  { "number": "28", "name": "HAILEY SIMS", "nickname": "JEFFA", "gender": "Women" },
  { "number": "29", "name": "CHARLOTTE SMILLIE", "nickname": "CHARLIE", "gender": "Women" },
  { "number": "30", "name": "ISABELLE POLLOCK", "nickname": "ISSY", "gender": "Women" },
  { "number": "31", "name": "AMY WALSH", "nickname": "LT", "gender": "Women" },
  { "number": "32", "name": "ELLA CRUPI", "nickname": "PROZ", "gender": "Women" },
  { "number": "33", "name": "AMELIA REES", "nickname": "MILLS", "gender": "Women" },
  { "number": "35", "name": "EMILY O'SULLIVAN", "nickname": "WEBBY", "gender": "Women" },
  { "number": "36", "name": "PENNY BOWMAN", "nickname": "PEN", "gender": "Women" },
  { "number": "37", "name": "MONICA CIAMPA", "nickname": "JMAC", "gender": "Women" },
  { "number": "38", "name": "ERIN LOUCAS", "nickname": "LD", "gender": "Women" },
  { "number": "39", "name": "SOPHIE TOSCANO", "nickname": "BUDGIE", "gender": "Women" },
  { "number": "40", "name": "ASLEIGH BILUCAGLIA", "nickname": "PARSO", "gender": "Women" },
  { "number": "41", "name": "ELLA MCKENZIE", "nickname": "JEFFA", "gender": "Women" },
  { "number": "42", "name": "ZARA JACKSON-SMITH", "nickname": "WITTA", "gender": "Women" },
  { "number": "43", "name": "CHLOE THORN", "nickname": "AL", "gender": "Women" },
  { "number": "44", "name": "JORDAN ARMSTRONG", "nickname": "LT", "gender": "Women" },
  { "number": "45", "name": "ISABELLA FINTA", "nickname": "PROZ", "gender": "Women" },
  { "number": "46", "name": "AMY DICKSON", "nickname": "HICKEY", "gender": "Women" },
  { "number": "47", "name": "JESS HEADLEY", "nickname": "WEBBY", "gender": "Women" },
  { "number": "48", "name": "ABBEY CHAPMAN", "nickname": "BHAT", "gender": "Women" },
  { "number": "49", "name": "TEAGAN MURTIC", "nickname": "JMAC", "gender": "Women" },
  { "number": "52", "name": "VICTORIA MCKENZIE", "nickname": "LD", "gender": "Women" },
  { "number": "53", "name": "MIA BOSNA", "nickname": "BUDGIE", "gender": "Women" },
  { "number": "54", "name": "CHARLOTTE KEANEY", "nickname": "PARSO", "gender": "Women" }
];

const shopifyPlayers = JSON.parse(fs.readFileSync('all_players.json', 'utf8'));

let md = '# Player Jersey Audit Report\n\n';

// Normalize for comparison
function norm(str) {
  return str ? str.trim().toLowerCase().replace(/[^a-z]/g, '') : '';
}

md += '## 1. Discrepancies and Issues\n\n';

// Check copy paste errors in women's mockups
md += "### ⚠️ Suspicious Nicknames in Women's Mockups\n";
md += "The following women's players have nicknames that exactly match the men's nicknames from the same positions in their respective mockup templates. This strongly indicates a copy-paste error where the designer forgot to update the nicknames when replacing the player names.\n\n";
md += "| Women's Player | Women's Number | Nickname | Men's Player with same nickname |\n";
md += '|---|---|---|---|\n';

// Find women with same nickname as men
const menNicknames = mockups.filter(m => m.gender === 'Men').reduce((acc, m) => {
  acc[m.nickname] = m;
  return acc;
}, {});

mockups.filter(m => m.gender === 'Women').forEach(w => {
  if (menNicknames[w.nickname]) {
    const m = menNicknames[w.nickname];
    // Check if the nickname is genuinely likely to be shared (like "MACCA") or if it's very specific ("PARSO", "JEFFA")
    // Most of these are specific.
    md += `| ${w.name} | ${w.number} | **"${w.nickname}"** | ${m.name} (${m.number}) |\n`;
  }
});
md += '\n';

// Match mockups to Shopify
const shopifyByNormName = shopifyPlayers.reduce((acc, p) => {
  acc[norm(p.full_name)] = p;
  return acc;
}, {});

md += '### 🔍 Players in Mockups vs Shopify Status\n\n';
md += '| Mockup Player | Number | Nickname | Status in Shopify | Shopify Number |\n';
md += '|---|---|---|---|---|\n';

mockups.forEach(m => {
  const s = shopifyByNormName[norm(m.name)];
  if (!s) {
    // Try to find partial matches
    const partial = shopifyPlayers.find(p => norm(p.full_name).includes(norm(m.name)) || norm(m.name).includes(norm(p.full_name)));
    if (partial) {
      md += `| ${m.name} | ${m.number} | "${m.nickname}" | ⚠️ Name mismatch (Found: ${partial.full_name}) | ${partial.jersey_number || 'None'} |\n`;
    } else {
      md += `| ${m.name} | ${m.number} | "${m.nickname}" | ❌ **Missing from Shopify** | N/A |\n`;
    }
  } else {
    // Check number mismatch
    if (s.jersey_number !== m.number) {
       // Many players have default "23" in shopify
       const isDefault = s.jersey_number === '23';
       md += `| ${m.name} | ${m.number} | "${m.nickname}" | ⚠️ Number mismatch | ${s.jersey_number || 'None'} ${isDefault ? '(Default?)' : ''} |\n`;
    } else {
       md += `| ${m.name} | ${m.number} | "${m.nickname}" | ✅ Matched | ${s.jersey_number} |\n`;
    }
  }
});

md += '\n## 2. Players in Shopify BUT NOT in Mockups\n\n';
md += '| Shopify Player | Shopify Number | Notes |\n';
md += '|---|---|---|\n';

const mockupByNormName = mockups.reduce((acc, m) => {
  acc[norm(m.name)] = m;
  return acc;
}, {});

shopifyPlayers.forEach(s => {
  if (!mockupByNormName[norm(s.full_name)]) {
    // Check if it's a dummy
    const isDummy = s.bio_short && s.bio_short.includes("dummy") || s.team && s.team.includes("dummy");
    md += `| ${s.full_name} | ${s.jersey_number || 'None'} | ${isDummy ? '(Dummy Data?)' : ''} |\n`;
  }
});

fs.writeFileSync('jersey-report.md', md);
console.log('Report generated: jersey-report.md');
