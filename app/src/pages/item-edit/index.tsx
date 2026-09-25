import { useEffect, useState } from 'react';
import { View, Text, Button, Input, Image, Picker } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useInventory } from '../../store/useInventory';
import { CATEGORIES, SEASONS, COLORS } from '../../domain/options';
import { pickPhoto } from '../../infra/photo';
import type { Item } from '../../domain/types';
import './index.css';

// 单选 chip：点已选中的再次点击即取消
function SingleChip({
  label,
  active,
  onClick
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return <Text className={'chip' + (active ? ' on' : '')} onClick={onClick}>{label}</Text>;
}

export default function ItemEdit() {
  const inv = useInventory();
  const id = Taro.getCurrentInstance().router?.params?.id;
  const editing = !!id;

  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [season, setSeason] = useState<string>('');
  const [color, setColor] = useState<string>('');
  const [tags, setTags] = useState('');
  const [photo, setPhoto] = useState('');
  const [bagId, setBagId] = useState('');

  useEffect(() => {
    if (id) {
      const it = inv.getItem(id);
      if (it) {
        setName(it.name);
        setCategory(it.category || CATEGORIES[0]);
        setSeason(it.season || '');
        setColor(it.color || '');
        setTags((it.tags || []).join('，'));
        setPhoto(it.photoPath || '');
        setBagId(it.bagId || '');
      }
    } else if (inv.bags.length) {
      setBagId(inv.bags[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const onPick = async () => {
    const data = await pickPhoto();
    if (data) setPhoto(data);
  };

  const save = () => {
    if (!bagId) {
      Taro.showToast({ title: '请选择所在压缩袋', icon: 'none' });
      return;
    }
    const tagArr = tags
      .split(/[，,]/)
      .map(s => s.trim())
      .filter(Boolean);
    const payload = {
      name: name.trim() || '未命名',
      category,
      season,
      color,
      tags: tagArr,
      bagId,
      photoPath: photo || undefined
    };
    if (editing && id) inv.updateItem(id, payload);
    else inv.addItem(payload);
    Taro.navigateBack();
  };

  const remove = () => {
    if (editing && id && typeof confirm === 'function' && confirm('删除该衣物？')) {
      inv.deleteItem(id);
      Taro.navigateBack();
    }
  };

  const bagIndex = Math.max(0, inv.bags.findIndex(b => b.id === bagId));
  const bagNames = inv.bags.map(b => b.name || '未命名压缩袋');

  return (
    <View className='page'>
      <View className='header'>
        <Text className='title'>{editing ? '编辑衣物' : '录入衣物'}</Text>
      </View>

      <View className='photo' onClick={onPick}>
        {photo ? (
          <Image className='preview' src={photo} mode='aspectFill' />
        ) : (
          <Text className='ph'>＋ 拍照 / 选图</Text>
        )}
      </View>

      <View className='field'>
        <Text className='label'>名称</Text>
        <Input
          className='input'
          value={name}
          placeholder='如：蓝色毛衣'
          onInput={(e: any) => setName(e.detail.value)}
        />
      </View>

      <View className='field col'>
        <Text className='label'>类别</Text>
        <View className='chips'>
          {CATEGORIES.map(c => (
            <SingleChip
              key={c}
              label={c}
              active={category === c}
              onClick={() => setCategory(category === c ? CATEGORIES[0] : c)}
            />
          ))}
        </View>
      </View>

      <View className='field col'>
        <Text className='label'>季节</Text>
        <View className='chips'>
          {SEASONS.map(s => (
            <SingleChip key={s} label={s} active={season === s} onClick={() => setSeason(season === s ? '' : s)} />
          ))}
        </View>
      </View>

      <View className='field col'>
        <Text className='label'>颜色</Text>
        <View className='chips'>
          {COLORS.map(c => (
            <SingleChip key={c} label={c} active={color === c} onClick={() => setColor(color === c ? '' : c)} />
          ))}
        </View>
      </View>

      <View className='field'>
        <Text className='label'>标签</Text>
        <Input
          className='input'
          value={tags}
          placeholder='逗号分隔，如：厚,户外'
          onInput={(e: any) => setTags(e.detail.value)}
        />
      </View>

      <View className='field'>
        <Text className='label'>所在袋</Text>
        {inv.bags.length ? (
          <Picker
            mode='selector'
            range={bagNames}
            value={bagIndex}
            onChange={(e: any) => setBagId(inv.bags[e.detail.value].id)}
          >
            <View className='picker'>{inv.bags[bagIndex]?.name || '请选择'}</View>
          </Picker>
        ) : (
          <Text className='warn'>还没有压缩袋，请先到首页添加</Text>
        )}
      </View>

      <View className='actions'>
        <Button className='btn-save' onClick={save}>
          保存
        </Button>
        {editing && (
          <Button className='btn-del' onClick={remove}>
            删除
          </Button>
        )}
      </View>
    </View>
  );
}
