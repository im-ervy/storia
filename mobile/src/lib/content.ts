// Carrega o conteúdo dos readers (data/content/<id>.json no web) a partir dos
// assets empacotados. Os arquivos foram copiados para assets/content/<id>.txt
// (JSON cru) e são tratados como ASSET — carregados sob demanda, fora do bundle
// JS, via expo-asset + expo-file-system (substitui o fs do data.ts no servidor).
import { Platform } from 'react-native';
import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import type { ReaderContent } from './types';
import { contentMap } from '../generated/contentMap';
import realContentJson from '../catalog/realContent.json';

const realContentIds = realContentJson as number[];
const cache = new Map<number, ReaderContent>();

async function readAssetText(mod: number): Promise<string> {
  const asset = Asset.fromModule(mod);
  if (!asset.downloaded) await asset.downloadAsync();
  const uri = asset.localUri ?? asset.uri;
  if (Platform.OS === 'web') {
    const res = await fetch(uri);
    return res.text();
  }
  return new File(uri).text();
}

async function load(id: number): Promise<ReaderContent> {
  const cached = cache.get(id);
  if (cached) return cached;
  const text = await readAssetText(contentMap[id]);
  const parsed = JSON.parse(text) as ReaderContent;
  cache.set(id, parsed);
  return parsed;
}

// Usa o conteúdo real quando existe; senão cai num dos livros capturados como
// amostra (espelha o fallback do data.ts do servidor).
export async function getContent(id: number): Promise<ReaderContent> {
  if (contentMap[id] != null) return load(id);
  const sampleId = realContentIds[0] ?? 14;
  const sample = await load(sampleId);
  return { ...sample, id };
}

export function hasContent(id: number): boolean {
  return contentMap[id] != null;
}
