import { useState } from 'react';
import { View, Text, Button, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useInventory } from '../../store/useInventory';
import type { Bag, LocationNode, LocationType } from '../../domain/types';
import './index.css';

const TYPE_LABEL: Record<LocationType, string> = {
  home: '家',
  room: '房间',
  cabinet: '柜子'
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
        <Text className='title'>收纳库存</Text>
        <View className='header-actions'>
          <Button
            className='btn-nav'
            onClick={() => Taro.navigateTo({ url: '/pages/items/index' })}
          >
            衣物检索
          </Button>
          <Button className='btn-add-root' onClick={() => inv.addLocation('home', '', null)}>
            + 新家
          </Button>
        </View>
      </View>
      <View className='tree'>
        {roots.length === 0 && (
          <Text className='empty'>还没有家，点上方「+ 新家」开始</Text>
        )}
        {roots.map(n => (
          <Node key={n.id} node={n} inv={inv} />
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

function Node({ node, inv }: { node: LocationNode; inv: Inv }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(node.name);

  const childType = CHILD_TYPE[node.type];
  const children = inv.locations.filter(n => n.parentId === node.id);
  const bags = node.type === 'cabinet' ? inv.bags.filter(b => b.cabinetId === node.id) : [];

  const commitEdit = () => {
    inv.updateLocation(node.id, draft);
    setEditing(false);
  };

  return (
    <View className='node'>
      <View className='node-row'>
        <Text className='toggle' onClick={() => setOpen(o => !o)}>
          {open ? '▾' : '▸'}
        </Text>
        {editing ? (
          <Input
            className='edit'
            value={draft}
            onInput={(e: any) => setDraft(e.detail.value)}
            onBlur={commitEdit}
          />
        ) : (
          <Text className='name' onClick={() => setEditing(true)}>
            {node.name}
          </Text>
        )}
        <Text className='type'>{TYPE_LABEL[node.type]}</Text>
        <Button className='btn-sm' onClick={() => inv.addLocation(childType, '', node.id)}>
          +子
        </Button>
        {node.type === 'cabinet' && (
          <Button className='btn-sm' onClick={() => inv.addBag('', node.id)}>
            +袋
          </Button>
        )}
        <Button
          className='btn-sm danger'
          onClick={() => {
            if (typeof confirm === 'function' && confirm('删除 ' + node.name + ' 及其下级？')) {
              inv.deleteLocation(node.id);
            }
          }}
        >
          删
        </Button>
      </View>
      {open && (
        <View className='children'>
          {children.map(c => (
            <Node key={c.id} node={c} inv={inv} />
          ))}
          {bags.map(b => (
            <BagRow key={b.id} bag={b} inv={inv} />
          ))}
          {children.length === 0 && bags.length === 0 && (
            <Text className='empty'>{node.type === 'cabinet' ? '暂无压缩袋' : '暂无下级'}</Text>
          )}
        </View>
      )}
    </View>
  );
}

function BagRow({ bag, inv }: { bag: Bag; inv: Inv }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(bag.name);

  const commit = () => {
    inv.updateBag(bag.id, draft);
    setEditing(false);
  };

  return (
    <View className='node bag'>
      <View className='node-row'>
        <Text className='toggle'>📦</Text>
        {editing ? (
          <Input
            className='edit'
            value={draft}
            onInput={(e: any) => setDraft(e.detail.value)}
            onBlur={commit}
          />
        ) : (
          <Text className='name' onClick={() => setEditing(true)}>
            {bag.name}
          </Text>
        )}
        <Text className='type'>压缩袋</Text>
        <Button className='btn-sm danger' onClick={() => inv.deleteBag(bag.id)}>
          删
        </Button>
      </View>
    </View>
  );
}
