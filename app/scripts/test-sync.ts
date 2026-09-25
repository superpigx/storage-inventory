import { mergeRemote, buildPayload } from '../src/domain/sync.ts';
import type { Bag, Item, LocationNode } from '../src/domain/types.ts';

let pass = 0;
let fail = 0;
function check(label: string, cond: boolean) {
  if (cond) pass++;
  else {
    fail++;
    console.log('  ✗ FAIL:', label);
  }
}

const localLoc: LocationNode[] = [
  { id: 'h', type: 'home', name: '我的家', parentId: null, createdAt: 1 }
];
const localBags: Bag[] = [{ id: 'b1', name: '袋A', cabinetId: 'h', createdAt: 1 }];
const localItems: Item[] = [
  { id: 'i1', name: '本地毛衣', bagId: 'b1', tags: [], createdAt: 1 }
];

// 远端多出：一个房间、一个袋、两件衣物；其中 i1 与本地冲突
const remote = buildPayload(
  [
    localLoc[0],
    { id: 'r2', type: 'room', name: '书房', parentId: 'h', createdAt: 2 }
  ],
  [
    localBags[0],
    { id: 'b2', name: '袋B', cabinetId: 'r2', createdAt: 2 }
  ],
  [
    { id: 'i1', name: '远端旧毛衣', bagId: 'b1', tags: [], createdAt: 0.5 }, // 冲突，本地优先
    { id: 'i2', name: '远端外套', bagId: 'b2', tags: [], createdAt: 2 }
  ]
);

const m = mergeRemote(
  { locations: localLoc, bags: localBags, items: localItems },
  remote
);

check('位置合并：新增书房', m.locations.length === 2);
check('位置统计 added=1', m.added.locations === 1);
check('袋合并：新增袋B', m.bags.length === 2 && m.added.bags === 1);
check('衣物合并：新增外套', m.items.length === 2 && m.added.items === 1);
check('冲突本地优先：保留本地毛衣', m.items.find(i => i.id === 'i1')?.name === '本地毛衣');
check('合并顺序依赖完整：袋B的柜子存在于位置', m.locations.some(l => l.id === 'r2'));
check('重复合并幂等', mergeRemote(m, remote).items.length === 2);
check('buildPayload 结构完整', buildPayload([], [], []).version === 1 && 'exportedAt' in buildPayload([], [], []));

console.log(`\nsync 单测: ${pass} 通过 / ${fail} 失败`);
if (fail > 0) process.exit(1);
