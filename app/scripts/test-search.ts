import { matchItem, locationPath } from '../src/domain/search.ts';
import type { Bag, Item, LocationNode } from '../src/domain/types.ts';

let pass = 0;
let fail = 0;
function check(label: string, cond: boolean) {
  if (cond) {
    pass++;
  } else {
    fail++;
    console.log('  ✗ FAIL:', label);
  }
}

const nodes: LocationNode[] = [
  { id: 'h', type: 'home', name: '我的家', parentId: null, createdAt: 0 },
  { id: 'r', type: 'room', name: '主卧', parentId: 'h', createdAt: 0 },
  { id: 'c', type: 'cabinet', name: '衣柜A', parentId: 'r', createdAt: 0 }
];
const bags: Bag[] = [{ id: 'b1', name: '袋#3', cabinetId: 'c', createdAt: 0 }];
const sweater: Item = {
  id: 'i1',
  name: '蓝色毛衣',
  color: '蓝',
  season: '冬',
  category: '上衣',
  tags: ['保暖'],
  bagId: 'b1',
  createdAt: 0
};

// 1. 文本匹配衣物自身字段
check('文本匹配名称', matchItem(sweater, { text: '毛衣' }));
check('文本匹配标签', matchItem(sweater, { text: '保暖' }));

// 2. 新特性：文本匹配所在位置名（反向检索核心）
const path = locationPath('b1', bags, nodes); // ['我的家','主卧','衣柜A','袋#3']
check('路径回溯正确', JSON.stringify(path) === JSON.stringify(['我的家', '主卧', '衣柜A', '袋#3']));
check('搜“主卧”命中衣物', matchItem(sweater, { text: '主卧' }, { bagPath: path }));
check('搜“衣柜A”命中衣物', matchItem(sweater, { text: '衣柜a' }, { bagPath: path }));
check('搜“袋#3”命中衣物', matchItem(sweater, { text: '袋#3' }, { bagPath: path }));
check('搜无关位置不命中', !matchItem(sweater, { text: '厨房' }, { bagPath: path }));

// 3. 筛选逻辑不变量
check('季节筛选命中', matchItem(sweater, { seasons: ['冬'] }));
check('季节筛选不命中', !matchItem(sweater, { seasons: ['夏'] }));
check('多条件 AND', matchItem(sweater, { seasons: ['冬'], colors: ['蓝'] }));
check('多条件 AND 失败', !matchItem(sweater, { seasons: ['冬'], colors: ['红'] }));

console.log(`\nsearch 单测: ${pass} 通过 / ${fail} 失败`);
if (fail > 0) process.exit(1);
