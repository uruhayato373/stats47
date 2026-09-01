// Server 専用の公開 API。@stats47/gis/server (server-only) を引くため index.ts と分離する —
// client component が barrel を import した瞬間に落ちるのを防ぐ (他 feature の server.ts と同じ慣例)。
export { MunicipalityRankingMapSection } from './components/MunicipalityRankingMapSection';
