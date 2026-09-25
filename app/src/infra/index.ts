import { Repository } from '../domain/repository';
import { TaroKV } from './taroStorage';

// 单例仓储：未来若更换框架，只需替换 KVStore 实现
export const repo = new Repository(new TaroKV());
export const kv = new TaroKV();
