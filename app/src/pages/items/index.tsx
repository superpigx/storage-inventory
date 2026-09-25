import { useMemo, useState } from 'react';
import { View, Text, Button, Input, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useInventory } from '../../store/useInventory';
import { CATEGORIES, SEASONS, COLORS } from '../../domain/options';
import type { ItemFilter } from '../../domain/search';
import type { Item } from '../../domain/types';
import './index.css';

type SortKey = 'recent' | 'name' | 'location';

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'recent', label: '最近录入' },
  { key: 'name', label: '名称' },
  { key: 'location', label: '位置' }
];

export default function Items() {
  const inv = useInventory();
  const [text, setText] = useState('');
  const [seasons, setSeasons] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [sort, setSort] = useState<SortKey>('recent');
  const [groupBy, setGroupBy] = useState(true);

  const pathMap = inv.locationPathMap();
  const filter: ItemFilter = { text, seasons, colors, categories };
  const results = inv.searchItems(filter);

  const activeCount = seasons.length + colors.length + categories.length + (text.trim() ? 1 : 0);

  const sorted = useMemo(() => {
    const arr = [...results];
    if (sort === 'recent') arr.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    else if (sort === 'name') arr.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    else
      arr.sort(
        (a, b) =>
          (pathMap[a.bagId] || []).join(' ').localeCompare((pathMap[b.bagId] || []).join(' '))
      );
    return arr;
  }, [results, sort, pathMap]);

  const groups = useMemo(() => {
    if (!groupBy) return null;
    const m = new Map<string, Item[]>();
    for (const it of sorted) {
      const key = (pathMap[it.bagId] || []).join(' › ') || '未归位';
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(it);
    }
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [sorted, groupBy, pathMap]);

  const toggle = (arr: string[], set: (v: string[]) => void, v: string) =>
    set(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);

  const clearAll = () => {
    setText('');
    setSeasons([]);
    setColors([]);
    setCategories([]);
  };

  const openEdit = (id?: string) =>
    Taro.navigateTo({ url: '/pages/item-edit/index' + (id ? '?id=' + id : '') });

  const renderCard = (it: Item) => (
    <View className='card' key={it.id} onClick={() => openEdit(it.id)}>
      {it.photoPath ? (
        <Image className='thumb' src={it.photoPath} mode='aspectFill' />
      ) : (
        <View className='thumb ph'>📭</View>
      )}
      <Text className='name'>{it.name || '未命名'}</Text>
      <Text className='path'>{pathMap[it.bagId]?.length ? pathMap[it.bagId].join(' › ') : '未归位'}</Text>
    </View>
  );

  return (
    <View className='page'>
      <View className='header'>
        <Text className='title'>衣物检索</Text>
        <Button className='btn-add' onClick={() => openEdit()}>
          ＋录入
        </Button>
      </View>

      <Input
        className='search'
        placeholder='搜 名称 / 颜色 / 季节 / 标签 / 位置…'
        value={text}
        onInput={(e: any) => setText(e.detail.value)}
      />

      <View className='filter-row'>
        <Text className='filter-label'>季节</Text>
        <View className='chips'>
          {SEASONS.map(s => (
            <Chip key={s} label={s} active={seasons.includes(s)} onClick={() => toggle(seasons, setSeasons, s)} />
          ))}
        </View>
      </View>
      <View className='filter-row'>
        <Text className='filter-label'>颜色</Text>
        <View className='chips'>
          {COLORS.map(c => (
            <Chip key={c} label={c} active={colors.includes(c)} onClick={() => toggle(colors, setColors, c)} />
          ))}
        </View>
      </View>
      <View className='filter-row'>
        <Text className='filter-label'>类别</Text>
        <View className='chips'>
          {CATEGORIES.map(c => (
            <Chip
              key={c}
              label={c}
              active={categories.includes(c)}
              onClick={() => toggle(categories, setCategories, c)}
            />
          ))}
        </View>
      </View>

      {activeCount > 0 && (
        <View className='active-bar' onClick={clearAll}>
          <Text className='active-text'>已选 {activeCount} 个条件</Text>
          <Text className='active-clear'>清除筛选 ✕</Text>
        </View>
      )}

      <View className='toolbar'>
        <View className='sort-group'>
          {SORTS.map(s => (
            <Text
              key={s.key}
              className={'sort' + (sort === s.key ? ' on' : '')}
              onClick={() => setSort(s.key)}
            >
              {s.label}
            </Text>
          ))}
        </View>
        <Text className={'group-toggle' + (groupBy ? ' on' : '')} onClick={() => setGroupBy(v => !v)}>
          {groupBy ? '📂 按位置分组' : '▦ 平铺'}
        </Text>
      </View>

      <Text className='count'>{results.length} 件匹配</Text>

      {inv.items.length === 0 && (
        <View className='empty'>
          <Text className='empty-emoji'>🧺</Text>
          <Text className='empty-text'>还没有衣物，点「＋录入」添加第一件</Text>
        </View>
      )}

      {inv.items.length > 0 && results.length === 0 && (
        <View className='empty'>
          <Text className='empty-emoji'>🔍</Text>
          <Text className='empty-text'>没有匹配的衣物</Text>
          {activeCount > 0 && <Text className='empty-clear' onClick={clearAll}>点此清除筛选</Text>}
        </View>
      )}

      {results.length > 0 && groupBy && groups && (
        <View className='groups'>
          {groups.map(([key, items]) => (
            <View className='group' key={key}>
              <View className='group-head'>
                <Text className='group-path'>📍 {key}</Text>
                <Text className='group-count'>{items.length} 件</Text>
              </View>
              <View className='grid'>{items.map(renderCard)}</View>
            </View>
          ))}
        </View>
      )}

      {results.length > 0 && !groupBy && <View className='grid'>{sorted.map(renderCard)}</View>}
    </View>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <Text className={'chip' + (active ? ' on' : '')} onClick={onClick}>
      {label}
    </Text>
  );
}
