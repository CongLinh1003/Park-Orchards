const fs = require('fs');

const mockups = [
  // Men (48 players)
  "LIAM BUHAGIAR", "JAMES PARSONS", "LIAM JEFFS", "JAYE WITNISH", "ALEX MAGNANO", "LIAM TAYLOR", "MICHAEL PROSENAK", "CONNOR HICKEY", "LIAM WEBB", "LEX HARTNETT", "JOSH MCAULIFFE", "LEWIS DOWNIE", "SAMMY PREST", "SAM HERON", "TOM LIVINGSTONE", "HARRISON LEONARD", "JACOB PRICE-INGLIS", "NIELS WITHOFF", "CIARAN HICKEY", "MASON BLAKEY", "JOSH VOOGD", "DYLAN KNIGHT", "MASON WITNISH", "KANE KEPPEL", "TOM WILSON", "TYLER PRUNTY", "JACK CULLEN", "LIAM CRIDLAND", "MATT HAYTHORNE", "BEN PANZA", "LUKE CORMACK", "MCLAREN SPITERI", "TOM REES", "JOSH CHAPPELL", "JAMAICA WOODS", "STEFAN D'SOUZA", "TIGE RIDLEY", "CRISTIAN CIAMPA", "WILL HELIOTIS", "WILL TAIT", "HENRY AMEER", "HAYDEN CAMPBELL", "MAX MORTON", "MAX HARRISON", "DARCY MONEY", "TYSON HARRAP", "SAM TSOUKATOS", "JAMES DEMPSEY",
  // Women (40 players)
  "KRISTEN BERTOLDI", "ALANNAH PANZA", "AVA CAMPBELL", "JORJA LIVINGSTONE", "ALANNAH BOELL", "ELLA MERTON", "BRIANNA CLARK", "GEORGIE SEARLE", "MIA MCAULIFFE", "MATILDA RAE", "TESS POWER", "DAISY COOPER", "CHLOE LIVINGSTONE", "RUBY CHANDLER", "ELLY HARTNETT", "JADE HUTCHINSON", "KAITLYN RUKAVINA", "REMY ARCHER", "CLAIRE BONE", "KATE BROWN", "SIENNA BETT", "JASMINE TAYLOR", "SIENNA POLLOCK", "MOLLY HEYMANSON", "ALLIE KING", "TEAGAN BRADLEY", "HAILEY SIMS", "CHARLOTTE SMILLIE", "ISABELLE POLLOCK", "AMY WALSH", "ELLA CRUPI", "AMELIA REES", "EMILY O'SULLIVAN", "PENNY BOWMAN", "MONICA CIAMPA", "ERIN LOUCAS", "SOPHIE TOSCANO", "ASLEIGH BILUCAGLIA", "ELLA MCKENZIE", "ZARA JACKSON-SMITH"
];

const shopifyPlayers = JSON.parse(fs.readFileSync('all_players.json', 'utf8'));

function norm(str) {
  return str ? str.trim().toLowerCase().replace(/[^a-z]/g, '') : '';
}

const mockupNorm = new Set(mockups.map(norm));

const webOnly = shopifyPlayers.filter(p => {
  const n = norm(p.full_name);
  // check if n is in mockupNorm, or if any mockup name is a substring of n or vice versa
  for (let m of mockups) {
      const mn = norm(m);
      if (mn === n || mn.includes(n) || n.includes(mn)) return false;
  }
  return true;
});

let md = "## Cầu thủ chỉ có trên web (Không có trong design)\n\n";
md += "| Cầu thủ | Team trên Web | Position | Số áo hiện tại |\n";
md += "|---|---|---|---|\n";
webOnly.forEach(p => {
  // Try to determine if it's netball or dummy
  let teamDesc = p.team || "";
  let isNetball = teamDesc.toLowerCase().includes("netball");
  md += `| ${p.full_name} | ${p.team ? p.team.split('/').pop() : 'Không rõ'} | ${p.role_position || 'N/A'} | ${p.jersey_number || 'Trống'} |\n`;
});

fs.writeFileSync('web-only-players.md', md);
console.log("Done");
