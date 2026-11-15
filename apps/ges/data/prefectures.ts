import { prefectureNameOf } from "@stats47/area";
/**
 * 47都道府県の座標データ（Google Earth Studio 用）
 * 県庁所在地の緯度・経度を使用
 */
export interface Prefecture {
  code: string;
  name: string;
  capital: string;
  lat: number;
  lng: number;
}

export const PREFECTURES: Prefecture[] = [
  { code: "01", capital: "札幌市", lat: 43.064615, lng: 141.346807 },
  { code: "02", capital: "青森市", lat: 40.824308, lng: 140.740044 },
  { code: "03", capital: "盛岡市", lat: 39.703619, lng: 141.152684 },
  { code: "04", capital: "仙台市", lat: 38.268837, lng: 140.872104 },
  { code: "05", capital: "秋田市", lat: 39.718614, lng: 140.102364 },
  { code: "06", capital: "山形市", lat: 38.240436, lng: 140.363633 },
  { code: "07", capital: "福島市", lat: 37.750299, lng: 140.467551 },
  { code: "08", capital: "水戸市", lat: 36.341811, lng: 140.446793 },
  { code: "09", capital: "宇都宮市", lat: 36.565725, lng: 139.883565 },
  { code: "10", capital: "前橋市", lat: 36.390668, lng: 139.060406 },
  { code: "11", capital: "さいたま市", lat: 35.85705, lng: 139.64893 },
  { code: "12", capital: "千葉市", lat: 35.605057, lng: 140.123306 },
  { code: "13", capital: "新宿区", lat: 35.689487, lng: 139.691706 },
  { code: "14", capital: "横浜市", lat: 35.447507, lng: 139.642345 },
  { code: "15", capital: "新潟市", lat: 37.902552, lng: 139.023095 },
  { code: "16", capital: "富山市", lat: 36.695291, lng: 137.211338 },
  { code: "17", capital: "金沢市", lat: 36.594682, lng: 136.625573 },
  { code: "18", capital: "福井市", lat: 36.065178, lng: 136.221527 },
  { code: "19", capital: "甲府市", lat: 35.664158, lng: 138.568449 },
  { code: "20", capital: "長野市", lat: 36.651299, lng: 138.180956 },
  { code: "21", capital: "岐阜市", lat: 35.391227, lng: 136.722291 },
  { code: "22", capital: "静岡市", lat: 34.976987, lng: 138.383084 },
  { code: "23", capital: "名古屋市", lat: 35.180188, lng: 136.906565 },
  { code: "24", capital: "津市", lat: 34.730283, lng: 136.508588 },
  { code: "25", capital: "大津市", lat: 35.004531, lng: 135.868585 },
  { code: "26", capital: "京都市", lat: 35.021247, lng: 135.755597 },
  { code: "27", capital: "大阪市", lat: 34.686297, lng: 135.519661 },
  { code: "28", capital: "神戸市", lat: 34.691269, lng: 135.183025 },
  { code: "29", capital: "奈良市", lat: 34.685296, lng: 135.832748 },
  { code: "30", capital: "和歌山市", lat: 34.226034, lng: 135.167509 },
  { code: "31", capital: "鳥取市", lat: 35.503891, lng: 134.237736 },
  { code: "32", capital: "松江市", lat: 35.472295, lng: 133.050551 },
  { code: "33", capital: "岡山市", lat: 34.661751, lng: 133.934406 },
  { code: "34", capital: "広島市", lat: 34.396033, lng: 132.45959 },
  { code: "35", capital: "山口市", lat: 34.185956, lng: 131.470649 },
  { code: "36", capital: "徳島市", lat: 34.065718, lng: 134.559296 },
  { code: "37", capital: "高松市", lat: 34.340149, lng: 134.043444 },
  { code: "38", capital: "松山市", lat: 33.841624, lng: 132.765681 },
  { code: "39", capital: "高知市", lat: 33.559706, lng: 133.531079 },
  { code: "40", capital: "福岡市", lat: 33.606576, lng: 130.418297 },
  { code: "41", capital: "佐賀市", lat: 33.249442, lng: 130.299794 },
  { code: "42", capital: "長崎市", lat: 32.744839, lng: 129.873756 },
  { code: "43", capital: "熊本市", lat: 32.789827, lng: 130.741667 },
  { code: "44", capital: "大分市", lat: 33.238172, lng: 131.612619 },
  { code: "45", capital: "宮崎市", lat: 31.911096, lng: 131.423893 },
  { code: "46", capital: "鹿児島市", lat: 31.560146, lng: 130.557978 },
  { code: "47", capital: "那覇市", lat: 26.212401, lng: 127.680932 },
].map((p) => ({ code: p.code, name: prefectureNameOf(p.code)!, capital: p.capital, lat: p.lat, lng: p.lng }));
