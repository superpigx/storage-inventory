import { useState } from 'react';
import { View, Text, Button, Input, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useInventory } from '../../store/useInventory';
import { CATEGORIES, SEASONS, COLORS } from '../../domain/options';
import type { ItemFilter } from '../../domain/search';
import './index.css';

export default function Items() {
  const inv = useInventory();
  const [text, setText] = useState('');
  const [seasons, setSeasons] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  const filter: ItemFilter = { text, seasons, colors, categories };
  const results = inv.searchItems(filter);

  const toggle = (arr: string[], set: (v: string[]) => void, v: string) =>
    set(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);

  const openEdit = (id?: string) =>
    Taro.navigateTo({ url: '/pages/item-edit/index' + (id ? '?id=' + id : '') });

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
        placeholder='搜 名称 / 颜色 / 季节 / 标签…'
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
            <Chip key={c} label={c} active={categories.includes(c)} onClick={() => toggle(categories, setCategories, c)} />
          ))}
        </View>
      </View>

      <Text className='count'>{results.length} 件匹配</Text>
      <View className='grid'>
        {results.map(it => {
          const path = inv.locationPathOfBag(it.bagId);
          return (
            <View className='card' key={it.id} onClick={() => openEdit(it.id)}>
              {it.photoPath ? (
                <Image className='thumb' src={it.photoPath} mode='aspectFill' />
              ) : (
                <View className='thumb ph'>📭</View>
              )}
              <Text className='name'>{it.name || '未命名'}</Text>
              <Text className='path'>{path.length ? path.join(' › ') : '未归位'}</Text>
            </View>
          );
        })}
        {results.length === 0 && <Text className='empty'>没有匹配的衣物，点「＋录入」添加</Text>}
      </View>
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
