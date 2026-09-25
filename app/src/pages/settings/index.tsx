import { useEffect, useState } from 'react';
import { View, Text, Button, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import Icon from '../../components/Icon';
import { kv, repo } from '../../infra';
import { WebDavClient, type WebDavConfig } from '../../infra/webdav';
import { buildPayload, mergeRemote } from '../../domain/sync';
import './index.css';

const CFG_KEY = 'si:webdav-config';

const DEFAULT_CFG: WebDavConfig = {
  server: 'https://dav.jianguoyun.com/dav/',
  dir: 'storage-inventory',
  username: '',
  password: ''
};

export default function Settings() {
  const [cfg, setCfg] = useState<WebDavConfig>(DEFAULT_CFG);
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    try {
      const raw = kv.get(CFG_KEY);
      if (raw) setCfg({ ...DEFAULT_CFG, ...JSON.parse(raw) });
    } catch {
      // 配置损坏时用默认值
    }
  }, []);

  const saveCfg = (c: WebDavConfig) => {
    setCfg(c);
    kv.set(CFG_KEY, JSON.stringify(c));
  };

  const set = (k: keyof WebDavConfig) => (e: any) => saveCfg({ ...cfg, [k]: e.detail.value });

  const valid = () => {
    if (!cfg.server.trim() || !cfg.username.trim() || !cfg.password.trim()) {
      setMsg({ ok: false, text: '请填写服务器地址、账号和应用密码' });
      return false;
    }
    return true;
  };

  const onTest = async () => {
    if (!valid()) return;
    setBusy('test');
    setMsg(null);
    const r = await new WebDavClient(cfg).test();
    setMsg({ ok: r.ok, text: r.message });
    setBusy('');
  };

  const onUpload = async () => {
    if (!valid()) return;
    setBusy('upload');
    setMsg(null);
    try {
      const client = new WebDavClient(cfg);
      await client.upload(
        buildPayload(repo.getLocations(), repo.getBags(), repo.getItems())
      );
      setMsg({ ok: true, text: `已上传备份（${repo.getItems().length} 件衣物）` });
    } catch (e: any) {
      setMsg({ ok: false, text: e?.message || '上传失败' });
    }
    setBusy('');
  };

  const onDownload = async () => {
    if (!valid()) return;
    setBusy('download');
    setMsg(null);
    try {
      const client = new WebDavClient(cfg);
      const remote = await client.download();
      if (!remote) {
        setMsg({ ok: false, text: '云端还没有备份，先在另一台设备上传' });
      } else {
        const merged = mergeRemote(
          { locations: repo.getLocations(), bags: repo.getBags(), items: repo.getItems() },
          remote
        );
        repo.importData(merged.locations, merged.bags, merged.items);
        setMsg({
          ok: true,
          text: `已合并：新增位置 ${merged.added.locations}、压缩袋 ${merged.added.bags}、衣物 ${merged.added.items}`
        });
      }
    } catch (e: any) {
      setMsg({ ok: false, text: e?.message || '下载失败' });
    }
    setBusy('');
  };

  return (
    <View className='page'>
      <View className='header'>
        <View>
          <Text className='title'>同步设置</Text>
          <Text className='subtitle'>使用你自己的坚果云 WebDAV 账号</Text>
        </View>
      </View>

      <View className='form card'>
        <View className='field'>
          <Text className='field-label'>服务器地址</Text>
          <Input className='input' value={cfg.server} onInput={set('server')} placeholder='https://dav.jianguoyun.com/dav/' />
        </View>
        <View className='field'>
          <Text className='field-label'>备份目录名</Text>
          <Input className='input' value={cfg.dir} onInput={set('dir')} placeholder='storage-inventory' />
        </View>
        <View className='field'>
          <Text className='field-label'>账号（手机号 / 邮箱）</Text>
          <Input className='input' value={cfg.username} onInput={set('username')} placeholder='you@example.com' />
        </View>
        <View className='field'>
          <Text className='field-label'>应用密码</Text>
          <Input className='input' password value={cfg.password} onInput={set('password')} placeholder='坚果云「账户信息 → 安全选项」里生成' />
        </View>
      </View>

      <View className='hint card'>
        <Text className='hint-title'>
          <Icon name='settings' size={14} color='var(--accent)' /> 如何获取坚果云应用密码
        </Text>
        <Text className='hint-text'>
          登录坚果云网页版 → 账户信息 → 安全选项 → 添加应用密码。出于安全考虑，坚果云不允许第三方应用使用登录密码，必须使用生成的应用密码。
        </Text>
      </View>

      {msg && (
        <View className={'msg ' + (msg.ok ? 'ok' : 'err')}>
          <Icon name={msg.ok ? 'check' : 'x'} size={15} />
          <Text className='msg-text'>{msg.text}</Text>
        </View>
      )}

      <View className='actions'>
        <Button className='btn btn-ghost btn-block' disabled={!!busy} onClick={onTest}>
          <Icon name='settings' size={16} />
          {busy === 'test' ? '测试中…' : '测试连接'}
        </Button>
        <Button className='btn btn-primary btn-block' disabled={!!busy} onClick={onUpload}>
          <Icon name='upload' size={16} color='#fff' />
          {busy === 'upload' ? '上传中…' : '上传备份到云端'}
        </Button>
        <Button className='btn btn-ghost btn-block' disabled={!!busy} onClick={onDownload}>
          <Icon name='download' size={16} />
          {busy === 'download' ? '同步中…' : '从云端下载并合并'}
        </Button>
      </View>
    </View>
  );
}
