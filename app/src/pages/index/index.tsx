import { useState } from 'react';
import { View, Text, Button, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useInventory } from '../../store/useInventory';
import Icon from '../../components/Icon';
import type { Bag, LocationNode, LocationType } from '../../domain/types';
import './index.css';

const TYPE_META: Record<LocationType, { label: string; icon: any }> = {
  home: { label: '家', icon: 'home' },
  room: { label: '房间', icon: 'room' },
  cabinet: { label: '柜子', icon: 'cabinet' }
};

// 子节点类型：家→房间→柜子；柜子下挂载压缩袋
const CHILD_TYPE: Record<LocationType, LocationType> = {
  home: 'room',
  room: 'cabinet',
  cabinet: 'cabinet'
};

export default function Index() {
  const inv = useInventory();
  const roots = inv.locations.filter(n => n.parentId === null);

  return (
    <View className='page'>
      <View className='header'>
        <View>
          <Text className='title'>收纳库存</Text>
          <Text className='subtitle'>家 · 房间 · 柜子 · 压缩袋</Text>
        </View>
        <View className='header-actions'>
          <Button
            className='btn btn-ghost'
            onClick={() => Taro.navigateTo({ url: '/pages/items/index' })}
          >
            <Icon name='search' size={16} />
            检索
          </Button>
          <Button className='btn btn-primary' onClick={() => inv.addLocation('home', '', null)}>
            <Icon name='plus' size={16} />
            新家
          </Button>
        </View>
      </View>

      <View className='tree'>
        {roots.length === 0 && (
          <View className='empty'>
            <View className='empty-ico'>
              <Icon name='home' size={26} />
            </View>
            <Text>还没有家，点右上角「新家」开始整理</Text>
          </View>
        )}
        {roots.map((n, i) => (
          <Node key={n.id} node={n} inv={inv} depth={0} index={i} />
        ))}
      </View>
    </View>
  );
}

interface Inv {
  locations: LocationNode[];
  bags: Bag[];
  addLocation: (type: LocationType, name: string, parentId: string | null) => LocationNode;
  updateLocation: (id: string, name: string) => void;
  deleteLocation: (id: string) => void;
  addBag: (name: string, cabinetId: string) => Bag;
  updateBag: (id: string, name: string) => void;
  deleteBag: (id: string) => void;
}

function Node({
  node,
  inv,
  depth,
  index
}: {
  node: LocationNode;
  inv: Inv;
  depth: number;
  index: number;
}) {
  const [open, setOpen] = useState(depth < 1);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(node.name);

  const meta = TYPE_META[node.type];
  const childType = CHILD_TYPE[node.type];
  const children = inv.locations.filter(n => n.parentId === node.id);
  const bags = node.type === 'cabinet' ? inv.bags.filter(b => b.cabinetId === node.id) : [];
  const hasChildren = children.length > 0 || bags.length > 0;

  const commitEdit = () => {
    inv.updateLocation(node.id, draft);
    setEditing(false);
  };

  const onDelete = () => {
    if (typeof confirm === 'function' && confirm('删除「' + node.name + '」及其下级？')) {
      inv.deleteLocation(node.id);
    }
  };

  return (
    <View className='node'>
      <View
        className={'node-row card anim-fade-up'}
        style={{ animationDelay: index * 40 + 'ms', marginLeft: depth * 14 + 'px' } as any}
      >
        <Text
          className={'chevron' + (hasChildren ? '' : ' disabled')}
          onClick={() => hasChildren && setOpen(o => !o)}
        >
          {hasChildren && <Icon name={open ? 'chevron-down' : 'chevron-right'} size={18} />}
        </Text>
        <View className='node-ico'>
          <Icon name={meta.icon} size={18} />
        </View>
        {editing ? (
          <Input
            className='edit'
            value={draft}
            focus
            onInput={(e: any) => setDraft(e.detail.value)}
            onBlur={commitEdit}
            onConfirm={commitEdit}
          />
        ) : (
          <Text className='name' onClick={() => setEditing(true)}>
            {node.name}
          </Text>
        )}
        <Text className='type-badge'>{meta.label}</Text>
        <View className='node-actions'>
          <View className='icon-btn accent' onClick={() => inv.addLocation(childType, '', node.id)}>
            <Icon name='plus' size={16} />
          </View>
          {node.type === 'cabinet' && (
            <View className='icon-btn' onClick={() => inv.addBag('', node.id)}>
              <Icon name='bag' size={16} />
            </View>
          )}
          <View className='icon-btn danger' onClick={onDelete}>
            <Icon name='trash' size={16} />
          </View>
        </View>
      </View>

      {open && hasChildren && (
        <View className='children'>
          {children.map((c, i) => (
            <Node key={c.id} node={c} inv={inv} depth={depth + 1} index={i} />
          ))}
          {bags.map((b, i) => (
            <BagRow key={b.id} bag={b} inv={inv} depth={depth + 1} index={i} />
          ))}
        </View>
      )}
    </View>
  );
}

function BagRow({
  bag,
  inv,
  depth,
  index
}: {
  bag: Bag;
  inv: Inv;
  depth: number;
  index: number;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(bag.name);

  const commit = () => {
    inv.updateBag(bag.id, draft);
    setEditing(false);
  };

  return (
    <View
      className='node bag card anim-fade-up'
      style={{ animationDelay: index * 40 + 'ms', marginLeft: depth * 14 + 'px' } as any}
    >
      <View className='node-row'>
        <Text className='chevron disabled' />
        <View className='node-ico bag-ico'>
          <Icon name='bag' size={18} />
        </View>
        {editing ? (
          <Input
            className='edit'
            value={draft}
            focus
            onInput={(e: any) => setDraft(e.detail.value)}
            onBlur={commit}
            onConfirm={commit}
          />
        ) : (
          <Text className='name' onClick={() => setEditing(true)}>
            {bag.name}
          </Text>
        )}
        <Text className='type-badge soft'>压缩袋</Text>
        <View className='node-actions'>
          <View
            className='icon-btn danger'
            onClick={() => {
              if (typeof confirm === 'function' && confirm('删除「' + bag.name + '」？')) {
                inv.deleteBag(bag.id);
              }
            }}
          >
            <Icon name='trash' size={16} />
          </View>
        </View>
      </View>
    </View>
  );
}
