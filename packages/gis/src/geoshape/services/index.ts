/**
 * Geoshapeドメイン - サービス
 *
 * TopoJSONデータの取得とビジネスロジックを提供。
 * リポジトリ層へのアクセスを抽象化し、データの妥当性チェックを行う。
 */

export {
  fetchPrefectureTopology,
  fetchMunicipalityTopology,
  type Logger,
} from "./geoshape-service";
