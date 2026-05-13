/**
 * Check & Create Women's Football Players
 * Park Orchards Football & Netball Club
 *
 * Kiểm tra xem đã có nữ football chưa ở cả 3 mục:
 *   - Women Football Seniors   (senior)
 *   - Women Football Reserves  (reserves)
 *   - Women Football Under 19  (under-19)
 *
 * Nếu team / player nào thiếu thì tự tạo mới.
 *
 * Chạy: node check-and-create-women-football.js
 */

const STORE_URL   = 'park-orchards-football-netball-club.myshopify.com';
const API_VERSION = '2024-10';
const ACCESS_TOKEN = 'shpat_YOUR_TOKEN_HERE';
const GRAPHQL_URL  = `https://${STORE_URL}/admin/api/${API_VERSION}/graphql.json`;

async function gql(query, variables = {}) {
  const res = await fetch(GRAPHQL_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': ACCESS_TOKEN },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

// ─── GraphQL ─────────────────────────────────────────────────────────────────

const QUERY_METAOBJECTS = `
  query FetchAll($type: String!) {
    metaobjects(type: $type, first: 100) {
      edges { node { id handle fields { key value } } }
    }
  }
`;

const QUERY_BY_HANDLE = `
  query ByHandle($handle: MetaobjectHandleInput!) {
    metaobjectByHandle(handle: $handle) { id handle fields { key value } }
  }
`;

const CREATE_MO = `
  mutation Create($metaobject: MetaobjectCreateInput!) {
    metaobjectCreate(metaobject: $metaobject) {
      metaobject { id handle }
      userErrors { field message code }
    }
  }
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getTermMap(type) {
  const result = await gql(QUERY_METAOBJECTS, { type });
  const map = {};
  for (const edge of (result.data?.metaobjects?.edges || [])) {
    map[edge.node.handle] = edge.node.id;
  }
  return map;
}

async function getByHandle(type, handle) {
  const result = await gql(QUERY_BY_HANDLE, { handle: { type, handle } });
  return result.data?.metaobjectByHandle || null;
}

async function getAllPlayers() {
  const result = await gql(QUERY_METAOBJECTS, { type: 'player_profile' });
  return (result.data?.metaobjects?.edges || []).map(e => ({
    id:     e.node.id,
    handle: e.node.handle,
    fields: Object.fromEntries(e.node.fields.map(f => [f.key, f.value])),
  }));
}

async function createMetaobject(type, handle, fields) {
  const result = await gql(CREATE_MO, {
    metaobject: {
      type,
      handle,
      fields,
      capabilities: { publishable: { status: 'ACTIVE' } },
    },
  });
  const payload = result.data?.metaobjectCreate;
  if (payload?.userErrors?.length > 0) {
    const errs = payload.userErrors.map(e => `[${e.code}] ${e.message}`).join('; ');
    return { ok: false, error: errs };
  }
  return { ok: true, id: payload?.metaobject?.id, handle: payload?.metaobject?.handle };
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── Data ────────────────────────────────────────────────────────────────────

// Teams cần kiểm tra / tạo
const womenFootballTeams = [
  { handle: 'women-football-seniors',  name: 'Women Football Seniors',  sport: 'football', division: 'women', grade: 'seniors',  sort: 4,  featured: true  },
  { handle: 'women-football-reserves', name: 'Women Football Reserves', sport: 'football', division: 'women', grade: 'reserves', sort: 9,  featured: false },
  { handle: 'women-football-u19',      name: 'Women Football Under 19', sport: 'football', division: 'women', grade: 'under-19', sort: 10, featured: false },
];

// Players mẫu cho từng team
const womenFootballPlayers = {
  'women-football-seniors': [
    { name: 'Sophie Martin',  preferred: 'Soph',  number: 2,  position: 'Midfielder', height: '170cm', bio: 'Best and fairest 2025, leads by example.',          featured: true  },
    { name: 'Emma Watson',    preferred: 'Ems',   number: 9,  position: 'Forward',    height: '168cm', bio: 'Deadly accurate in front of goal.',                  featured: false },
    { name: 'Chloe Davis',    preferred: 'Chlo',  number: 16, position: 'Defender',   height: '175cm', bio: 'Rock solid across half back.',                       featured: false },
    { name: 'Jade Thompson',  preferred: 'JT',    number: 21, position: 'Ruck',       height: '183cm', bio: 'Athletic ruckwoman with great endurance.',           featured: false },
  ],
  'women-football-reserves': [
    { name: 'Maddison Clarke', preferred: 'Maddi', number: 4,  position: 'Midfielder', height: '167cm', bio: 'Smart ball user who reads the game brilliantly.',   featured: true  },
    { name: 'Tara Sullivan',   preferred: 'Taz',   number: 12, position: 'Forward',    height: '165cm', bio: 'Nippy small forward with an eye for goal.',          featured: false },
    { name: 'Briana Walsh',    preferred: 'Bri',   number: 20, position: 'Defender',   height: '172cm', bio: 'Reliable stopper who never lets her opponent go.',   featured: false },
  ],
  'women-football-u19': [
    { name: 'Olivia Grant',   preferred: 'Liv',   number: 6,  position: 'Midfielder', height: '166cm', bio: 'Exciting young talent making waves in the juniors.', featured: true  },
    { name: 'Paige Henderson',preferred: 'Paigey',number: 13, position: 'Forward',    height: '164cm', bio: 'Sharp instincts in front of goal for her age.',       featured: false },
    { name: 'Sienna Ford',    preferred: 'Sie',   number: 18, position: 'Defender',   height: '169cm', bio: 'Composed under pressure, excellent one-on-one.',     featured: false },
  ],
};

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('⚽ Park Orchards FC — Check & Create Women\'s Football Players');
  console.log('='.repeat(65));
  console.log('');

  // 1. Fetch terms
  console.log('📋 Step 1: Fetching terms (sport / division / grade)...');
  const sports    = await getTermMap('club_sport');
  const divisions = await getTermMap('club_division');
  const grades    = await getTermMap('club_grade');

  console.log(`   Sports:    ${Object.keys(sports).join(', ') || '(none)'}`);
  console.log(`   Divisions: ${Object.keys(divisions).join(', ') || '(none)'}`);
  console.log(`   Grades:    ${Object.keys(grades).join(', ') || '(none)'}`);

  if (!sports.football || !divisions.women) {
    console.log('\n❌ Thiếu term "football" hoặc "women". Hãy chạy setup-metaobject-entries.js trước.');
    return;
  }
  if (!grades.seniors || !grades.reserves || !grades['under-19']) {
    console.log('\n❌ Thiếu grade term. Cần: seniors, reserves, under-19. Hãy chạy setup-metaobject-entries.js trước.');
    return;
  }

  // 2. Fetch tất cả players hiện tại để kiểm tra
  console.log('\n👤 Step 2: Kiểm tra players nữ football hiện tại...');
  const allPlayers = await getAllPlayers();

  // Lấy team GIDs của women football (nếu tồn tại)
  const existingWomenFootballTeamGids = new Set();
  const teamGidMap = {}; // handle → GID

  for (const team of womenFootballTeams) {
    const found = await getByHandle('club_team', team.handle);
    if (found) {
      teamGidMap[team.handle] = found.id;
      existingWomenFootballTeamGids.add(found.id);
      console.log(`   ✅ Team tồn tại: ${team.handle} → ${found.id}`);
    } else {
      console.log(`   ❌ Team chưa tồn tại: ${team.handle}`);
    }
    await sleep(200);
  }

  // Lọc players thuộc women football teams
  const womenFootballPlayerList = allPlayers.filter(p =>
    p.fields.team && existingWomenFootballTeamGids.has(p.fields.team)
  );

  console.log('');
  if (womenFootballPlayerList.length === 0) {
    console.log('   ⚠️  Chưa có player nào trong women football teams.');
  } else {
    console.log(`   📊 Tìm thấy ${womenFootballPlayerList.length} player nữ football:`);
    for (const p of womenFootballPlayerList) {
      console.log(`      - ${p.fields.full_name || p.handle} (team GID: ${p.fields.team})`);
    }
  }

  // 3. Tạo teams còn thiếu
  console.log('\n⚽ Step 3: Tạo teams còn thiếu...');
  console.log('-'.repeat(40));

  for (const team of womenFootballTeams) {
    if (teamGidMap[team.handle]) {
      console.log(`   ⏭  Bỏ qua (đã tồn tại): ${team.handle}`);
      continue;
    }

    const sportGid    = sports[team.sport];
    const divisionGid = divisions[team.division];
    const gradeGid    = grades[team.grade];

    if (!sportGid || !divisionGid || !gradeGid) {
      console.log(`   ❌ Thiếu term GID cho team: ${team.handle}`);
      continue;
    }

    console.log(`\n   🎯 Tạo team: ${team.name}`);
    const res = await createMetaobject('club_team', team.handle, [
      { key: 'team_name',    value: team.name },
      { key: 'sport',        value: sportGid },
      { key: 'division',     value: divisionGid },
      { key: 'grade',        value: gradeGid },
      { key: 'season_label', value: '2026' },
      { key: 'sort_order',   value: String(team.sort) },
      { key: 'featured',     value: String(team.featured) },
    ]);

    if (res.ok) {
      teamGidMap[team.handle] = res.id;
      console.log(`      ✅ Đã tạo (${res.id})`);
    } else {
      console.log(`      ❌ Lỗi: ${res.error}`);

      // Thử fetch lại nếu đã tồn tại (TAKEN handle)
      const existing = await getByHandle('club_team', team.handle);
      if (existing) {
        teamGidMap[team.handle] = existing.id;
        console.log(`      ℹ️  Đã dùng existing: ${existing.id}`);
      }
    }
    await sleep(400);
  }

  // 4. Tạo players còn thiếu
  console.log('\n👩 Step 4: Tạo players nữ football còn thiếu...');
  console.log('-'.repeat(40));

  let created = 0;
  let skipped = 0;

  for (const [teamHandle, players] of Object.entries(womenFootballPlayers)) {
    const teamGid = teamGidMap[teamHandle];
    if (!teamGid) {
      console.log(`\n   ⚠️ Bỏ qua players cho ${teamHandle} — không có team GID`);
      continue;
    }

    // Tìm players đã có trong team này
    const existingInTeam = allPlayers
      .filter(p => p.fields.team === teamGid)
      .map(p => p.fields.full_name?.toLowerCase());

    console.log(`\n   📂 ${teamHandle} (${players.length} players cần, ${existingInTeam.length} đã có)`);

    for (let i = 0; i < players.length; i++) {
      const p = players[i];
      const nameKey = p.name.toLowerCase();

      // Kiểm tra đã có player này chưa (theo tên)
      if (existingInTeam.includes(nameKey)) {
        console.log(`      ⏭  Bỏ qua (đã tồn tại): ${p.name}`);
        skipped++;
        continue;
      }

      const pHandle = `${teamHandle}-${p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '')}`;

      const fields = [
        { key: 'full_name',       value: p.name },
        { key: 'preferred_name',  value: p.preferred },
        { key: 'role_position',   value: p.position },
        { key: 'team',            value: teamGid },
        { key: 'bio_short',       value: p.bio },
        { key: 'height',          value: p.height },
        { key: 'featured_player', value: String(p.featured) },
        { key: 'sort_order',      value: String(i + 1) },
      ];

      if (p.number > 0) {
        fields.push({ key: 'jersey_number', value: String(p.number) });
      }

      const res = await createMetaobject('player_profile', pHandle, fields);

      if (res.ok) {
        console.log(`      ✅ ${p.name} (#${p.number || '-'} ${p.position})`);
        created++;
      } else {
        console.log(`      ⚠️  ${p.name}: ${res.error}`);
      }

      await sleep(300);
    }
  }

  // 5. Summary
  console.log('\n' + '='.repeat(65));
  console.log('🏁 Hoàn tất!');
  console.log('');
  console.log('📊 Kết quả:');
  console.log(`   Teams đã có / đã tạo: ${Object.keys(teamGidMap).length}/${womenFootballTeams.length}`);
  console.log(`   Players tạo mới:       ${created}`);
  console.log(`   Players bỏ qua (đã có):${skipped}`);
  console.log('');
  console.log('📋 Tóm tắt teams nữ football:');
  for (const team of womenFootballTeams) {
    const gid = teamGidMap[team.handle];
    console.log(`   ${gid ? '✅' : '❌'} ${team.name} → ${gid || 'không tạo được'}`);
  }
  console.log('');
  console.log('💡 Tiếp theo: Upload ảnh đại diện qua Shopify Admin → Content → Player Profiles');
  console.log('='.repeat(65));
}

main().catch(console.error);
