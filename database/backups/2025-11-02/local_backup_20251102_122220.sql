PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  emailVerified DATETIME,
  image TEXT,
  username TEXT UNIQUE,
  password_hash TEXT,
  role TEXT DEFAULT 'user',
  is_active BOOLEAN DEFAULT 1,
  last_login DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "users" VALUES('00000000-0000-0000-0000-000000000001','Administrator','admin@stats47.local',NULL,NULL,'admin','$2b$10$pp6HL4f9XElzUtMSGU4SD.88T/CUuxHxu83f3k871IZ7zmALZ0YiK','admin',1,NULL,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "users" VALUES('00000000-0000-0000-0000-000000000002','Test User','user@stats47.local',NULL,NULL,'testuser','$2b$10$cPKcatYmvHaggCtqtwAvru.q1Dpbqy.uX6AYBk/S/xw0YqYM3Znj6','user',1,NULL,'2025-11-02 03:17:11','2025-11-02 03:17:11');
CREATE TABLE accounts (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  providerAccountId TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  sessionToken TEXT UNIQUE NOT NULL,
  userId TEXT NOT NULL,
  expires DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE verification_tokens (
  identifier TEXT NOT NULL,
  token TEXT NOT NULL,
  expires DATETIME NOT NULL,
  PRIMARY KEY (identifier, token)
);
CREATE TABLE categories (
  category_key TEXT PRIMARY KEY,
  category_name TEXT NOT NULL,
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "categories" VALUES('landweather','国土・気象','MapPin',0,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "categories" VALUES('population','人口・世帯','Users',1,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "categories" VALUES('laborwage','労働・賃金','TrendingUp',2,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "categories" VALUES('agriculture','農林水産業','Sprout',3,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "categories" VALUES('miningindustry','鉱工業','Factory',4,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "categories" VALUES('commercial','商業・サービス業','Store',5,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "categories" VALUES('economy','企業・家計・経済','PieChart',6,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "categories" VALUES('construction','住宅・土地・建設','Home',7,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "categories" VALUES('energy','エネルギー・水','Droplets',8,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "categories" VALUES('tourism','運輸・観光','Plane',9,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "categories" VALUES('educationsports','教育・文化・スポーツ','GraduationCap',10,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "categories" VALUES('administrativefinancial','行財政','Building2',11,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "categories" VALUES('safetyenvironment','司法・安全・環境','ShieldCheck',12,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "categories" VALUES('socialsecurity','社会保障・衛生','Hospital',13,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "categories" VALUES('international','国際','Globe',14,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "categories" VALUES('infrastructure','社会基盤施設','Construction',15,'2025-11-02 03:17:11','2025-11-02 03:17:11');
CREATE TABLE subcategories (
  subcategory_key TEXT PRIMARY KEY,
  subcategory_name TEXT NOT NULL,
  category_key TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_key) REFERENCES categories(category_key) ON DELETE CASCADE
);
INSERT INTO "subcategories" VALUES('land-area','土地面積','landweather',1,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "subcategories" VALUES('land-use','土地利用','landweather',2,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "subcategories" VALUES('natural-environment','自然環境','landweather',3,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "subcategories" VALUES('weather-climate','気象・気候','landweather',4,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "subcategories" VALUES('basic-population','総人口','population',1,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "subcategories" VALUES('population-movement','人口移動','population',2,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "subcategories" VALUES('population-composition','人口構成','population',3,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "subcategories" VALUES('marriage','婚姻・家族','population',4,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "subcategories" VALUES('households','世帯','population',5,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "subcategories" VALUES('birth-death','出生・死亡','population',6,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "subcategories" VALUES('wages-working-conditions','賃金・労働条件','laborwage',1,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "subcategories" VALUES('labor-force-structure','労働力構造','laborwage',2,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "subcategories" VALUES('industrial-structure','産業構造','laborwage',3,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "subcategories" VALUES('commuting-employment','通勤・就職','laborwage',4,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "subcategories" VALUES('labor-disputes','労働争議','laborwage',5,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "subcategories" VALUES('job-seeking-placement','求職・求人','laborwage',6,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "subcategories" VALUES('industry-occupation','産業・職業別','laborwage',7,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "subcategories" VALUES('employment-type','雇用形態','laborwage',8,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "subcategories" VALUES('agricultural-household','農業世帯','agriculture',1,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "subcategories" VALUES('manufacturing','製造業','miningindustry',1,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "subcategories" VALUES('commerce-service-industry','商業・サービス産業','commercial',1,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "subcategories" VALUES('commercial-facilities','商業施設','commercial',2,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "subcategories" VALUES('worker-household-income','労働者世帯収入','economy',1,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "subcategories" VALUES('household-economy','家計','economy',2,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "subcategories" VALUES('business-scale','企業規模','economy',3,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "subcategories" VALUES('business-activity','企業活動','economy',4,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "subcategories" VALUES('gross-product-economic-indicators','総生産・経済指標','economy',5,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "subcategories" VALUES('consumer-price-difference-index','消費者物価地域差指数','economy',6,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "subcategories" VALUES('living-environment','生活環境','construction',1,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "subcategories" VALUES('housing-ownership','住宅所有','construction',2,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "subcategories" VALUES('housing-structure','住宅構造','construction',3,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "subcategories" VALUES('housing-facilities','住宅設備','construction',4,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "subcategories" VALUES('construction-manufacturing','建設・製造','construction',5,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "subcategories" VALUES('welfare-facilities','福祉施設','construction',6,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "subcategories" VALUES('housing-statistics','住宅統計','construction',7,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "subcategories" VALUES('water-supply-sewerage','上水道・下水道','energy',1,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "subcategories" VALUES('waste-management','廃棄物処理','energy',2,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "subcategories" VALUES('industrial-water','工業用水','energy',3,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "subcategories" VALUES('infrastructure-energy','インフラ・エネルギー','energy',4,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "subcategories" VALUES('tourism-accommodation','観光・宿泊','tourism',1,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "subcategories" VALUES('kindergarten','幼稚園','educationsports',1,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "subcategories" VALUES('elementary-school','小学校','educationsports',2,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "subcategories" VALUES('junior-high-school','中学校','educationsports',3,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "subcategories" VALUES('high-school','高等学校','educationsports',4,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "subcategories" VALUES('college-university','短大・大学','educationsports',5,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "subcategories" VALUES('cultural-facilities','文化施設','educationsports',6,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "subcategories" VALUES('sports-facilities','スポーツ施設','educationsports',7,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "subcategories" VALUES('social-activities','社会活動','educationsports',8,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "subcategories" VALUES('childcare-early-education','保育・幼児教育','educationsports',9,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "subcategories" VALUES('compulsory-education','義務教育','educationsports',10,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "subcategories" VALUES('fiscal-indicators','財政指標','administrativefinancial',1,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "subcategories" VALUES('staff-assembly-election','職員・議会・選挙','administrativefinancial',2,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "subcategories" VALUES('tax-revenue','税収','administrativefinancial',3,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "subcategories" VALUES('investment','投資','administrativefinancial',4,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "subcategories" VALUES('revenue','歳入','administrativefinancial',5,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "subcategories" VALUES('expenditure','歳出','administrativefinancial',6,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "subcategories" VALUES('fire-emergency','消防・緊急事態','safetyenvironment',1,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "subcategories" VALUES('fire-insurance','火災保険','safetyenvironment',2,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "subcategories" VALUES('police-crime','警察・犯罪','safetyenvironment',3,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "subcategories" VALUES('traffic-accidents','交通事故','safetyenvironment',4,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "subcategories" VALUES('pollution-environment','公害・環境','safetyenvironment',5,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "subcategories" VALUES('card','社会保障指標','socialsecurity',1,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "subcategories" VALUES('death-statistics','死亡統計','socialsecurity',2,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "subcategories" VALUES('public-assistance-welfare','生活保護・福祉','socialsecurity',3,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "subcategories" VALUES('health-care','健康・保健','socialsecurity',4,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "subcategories" VALUES('foreign-population','外国人人口','international',1,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "subcategories" VALUES('foreigners','外国人統計','international',2,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "subcategories" VALUES('roads','道路','infrastructure',1,'2025-11-02 03:17:11','2025-11-02 03:17:11');
INSERT INTO "subcategories" VALUES('uncategorized','未分類','population',0,'2025-11-02 03:17:11','2025-11-02 03:17:11');
CREATE TABLE estat_metainfo (
  stats_data_id TEXT PRIMARY KEY,
  stat_name TEXT NOT NULL,
  title TEXT NOT NULL,
  area_type TEXT NOT NULL DEFAULT 'national',
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CHECK (area_type IN ('national', 'prefecture', 'city'))
);
INSERT INTO "estat_metainfo" VALUES('0000010101','社会・人口統計体系','Ａ　人口・世帯','national',NULL,'2025-10-31T03:10:24.413Z','2025-10-31T03:20:31.834Z');
INSERT INTO "estat_metainfo" VALUES('0000010102','社会・人口統計体系','Ｂ　自然環境','national',NULL,'2025-10-31T03:22:50.500Z','2025-10-31T03:22:50.500Z');
INSERT INTO "estat_metainfo" VALUES('0000010103','社会・人口統計体系','Ｃ　経済基盤','national',NULL,'2025-10-31T03:23:09.503Z','2025-10-31T03:23:09.503Z');
INSERT INTO "estat_metainfo" VALUES('0000010104','社会・人口統計体系','Ｄ　行政基盤','national',NULL,'2025-10-31T03:23:59.992Z','2025-10-31T03:23:59.992Z');
INSERT INTO "estat_metainfo" VALUES('0000010105','社会・人口統計体系','Ｅ　教育','national',NULL,'2025-10-31T03:24:17.763Z','2025-10-31T03:24:17.763Z');
INSERT INTO "estat_metainfo" VALUES('0000010106','社会・人口統計体系','Ｆ　労働','national',NULL,'2025-10-31T03:24:50.783Z','2025-10-31T03:24:50.783Z');
INSERT INTO "estat_metainfo" VALUES('0000010107','社会・人口統計体系','Ｇ　文化・スポーツ','national',NULL,'2025-10-31T03:25:06.844Z','2025-10-31T03:25:06.844Z');
INSERT INTO "estat_metainfo" VALUES('0000010108','社会・人口統計体系','Ｈ　居住','national',NULL,'2025-10-31T03:25:20.581Z','2025-10-31T03:25:20.581Z');
INSERT INTO "estat_metainfo" VALUES('0000010109','社会・人口統計体系','Ｉ　健康・医療','national',NULL,'2025-10-31T03:25:50.947Z','2025-10-31T03:25:50.947Z');
INSERT INTO "estat_metainfo" VALUES('0000010110','社会・人口統計体系','Ｊ　福祉・社会保障','national',NULL,'2025-10-31T03:26:13.212Z','2025-10-31T03:26:13.212Z');
INSERT INTO "estat_metainfo" VALUES('0000010111','社会・人口統計体系','Ｋ　安全','national',NULL,'2025-10-31T03:26:29.767Z','2025-10-31T03:26:29.767Z');
INSERT INTO "estat_metainfo" VALUES('0000010112','社会・人口統計体系','Ｌ　家計','national',NULL,'2025-10-31T03:26:43.789Z','2025-10-31T03:26:43.789Z');
INSERT INTO "estat_metainfo" VALUES('0000010113','社会・人口統計体系','Ｍ　生活時間','national',NULL,'2025-10-31T03:26:59.105Z','2025-10-31T03:26:59.105Z');
INSERT INTO "estat_metainfo" VALUES('0000010201','社会・人口統計体系','Ａ　人口・世帯','national',NULL,'2025-10-31T03:27:36.898Z','2025-10-31T03:38:19.072Z');
INSERT INTO "estat_metainfo" VALUES('0000010202','社会・人口統計体系','Ｂ　自然環境','national',NULL,'2025-10-31T03:28:17.401Z','2025-10-31T03:28:17.401Z');
INSERT INTO "estat_metainfo" VALUES('0000010203','社会・人口統計体系','Ｃ　経済基盤','national',NULL,'2025-10-31T03:28:26.829Z','2025-10-31T03:28:26.829Z');
INSERT INTO "estat_metainfo" VALUES('0000010204','社会・人口統計体系','Ｄ　行政基盤','national',NULL,'2025-10-31T03:28:41.796Z','2025-10-31T03:28:41.796Z');
INSERT INTO "estat_metainfo" VALUES('0000010205','社会・人口統計体系','Ｅ　教育','national',NULL,'2025-10-31T03:28:51.903Z','2025-10-31T03:28:51.903Z');
INSERT INTO "estat_metainfo" VALUES('0000010206','社会・人口統計体系','Ｆ　労働','national',NULL,'2025-10-31T03:29:04.345Z','2025-10-31T03:29:04.345Z');
INSERT INTO "estat_metainfo" VALUES('0000010207','社会・人口統計体系','Ｇ　文化・スポーツ','national',NULL,'2025-10-31T03:29:25.346Z','2025-10-31T03:29:25.346Z');
INSERT INTO "estat_metainfo" VALUES('0000010208','社会・人口統計体系','Ｈ　居住','national',NULL,'2025-10-31T03:29:50.802Z','2025-10-31T03:29:50.802Z');
INSERT INTO "estat_metainfo" VALUES('0000010209','社会・人口統計体系','Ｉ　健康・医療','national',NULL,'2025-10-31T03:30:04.536Z','2025-10-31T03:30:04.536Z');
INSERT INTO "estat_metainfo" VALUES('0000010210','社会・人口統計体系','Ｊ　福祉・社会保障','national',NULL,'2025-10-31T03:30:19.722Z','2025-10-31T03:30:19.722Z');
INSERT INTO "estat_metainfo" VALUES('0000010211','社会・人口統計体系','Ｋ　安全','national',NULL,'2025-10-31T03:30:32.090Z','2025-10-31T03:30:32.090Z');
INSERT INTO "estat_metainfo" VALUES('0000010212','社会・人口統計体系','Ｌ　家計','national',NULL,'2025-10-31T03:30:43.476Z','2025-10-31T03:30:43.476Z');
INSERT INTO "estat_metainfo" VALUES('0000010213','社会・人口統計体系','Ｍ　生活時間','national',NULL,'2025-10-31T03:30:55.007Z','2025-10-31T03:30:55.007Z');
INSERT INTO "estat_metainfo" VALUES('0000020201','社会・人口統計体系','Ａ　人口・世帯','city',NULL,'2025-10-31T03:39:00.317Z','2025-10-31T03:39:00.317Z');
INSERT INTO "estat_metainfo" VALUES('0000020202','社会・人口統計体系','Ｂ　自然環境','city',NULL,'2025-10-31T03:42:12.060Z','2025-10-31T03:42:12.060Z');
INSERT INTO "estat_metainfo" VALUES('0000020203','社会・人口統計体系','Ｃ　経済基盤','city',NULL,'2025-10-31T03:42:27.645Z','2025-10-31T03:42:27.645Z');
INSERT INTO "estat_metainfo" VALUES('0000020204','社会・人口統計体系','Ｄ　行政基盤','city',NULL,'2025-10-31T03:42:40.436Z','2025-10-31T03:42:40.436Z');
INSERT INTO "estat_metainfo" VALUES('0000020205','社会・人口統計体系','Ｅ　教育','city',NULL,'2025-10-31T03:42:51.624Z','2025-10-31T03:42:51.624Z');
INSERT INTO "estat_metainfo" VALUES('0000020206','社会・人口統計体系','Ｆ　労働','city',NULL,'2025-10-31T03:43:05.737Z','2025-10-31T03:43:05.737Z');
INSERT INTO "estat_metainfo" VALUES('0000020207','社会・人口統計体系','Ｇ　文化・スポーツ','city',NULL,'2025-10-31T03:43:16.268Z','2025-10-31T03:43:16.268Z');
INSERT INTO "estat_metainfo" VALUES('0000020208','社会・人口統計体系','Ｈ　居住','city',NULL,'2025-10-31T03:43:29.213Z','2025-10-31T03:43:29.213Z');
INSERT INTO "estat_metainfo" VALUES('0000020209','社会・人口統計体系','Ｉ　健康・医療','city',NULL,'2025-10-31T03:43:41.087Z','2025-10-31T03:43:41.087Z');
INSERT INTO "estat_metainfo" VALUES('0000020210','社会・人口統計体系','Ｊ　福祉・社会保障','city',NULL,'2025-10-31T03:44:17.210Z','2025-10-31T03:44:17.210Z');
INSERT INTO "estat_metainfo" VALUES('0000020211','社会・人口統計体系','Ｋ　安全','city',NULL,'2025-10-31T03:44:35.416Z','2025-10-31T03:44:35.416Z');
INSERT INTO "estat_metainfo" VALUES('0000020301','社会・人口統計体系','Ａ　人口・世帯','city',NULL,'2025-10-31T03:45:13.319Z','2025-10-31T03:45:13.319Z');
INSERT INTO "estat_metainfo" VALUES('0000020302','社会・人口統計体系','Ｂ　自然環境','city',NULL,'2025-10-31T03:54:33.061Z','2025-10-31T03:54:33.061Z');
INSERT INTO "estat_metainfo" VALUES('0000020303','社会・人口統計体系','Ｃ　経済基盤','city',NULL,'2025-10-31T03:54:52.907Z','2025-10-31T03:54:52.907Z');
INSERT INTO "estat_metainfo" VALUES('0000020304','社会・人口統計体系','Ｄ　行政基盤','city',NULL,'2025-10-31T03:55:05.403Z','2025-10-31T03:55:05.403Z');
INSERT INTO "estat_metainfo" VALUES('0000020305','社会・人口統計体系','Ｅ　教育','city',NULL,'2025-10-31T03:55:16.933Z','2025-10-31T03:55:16.933Z');
INSERT INTO "estat_metainfo" VALUES('0000020306','社会・人口統計体系','Ｆ　労働','city',NULL,'2025-10-31T03:55:26.799Z','2025-10-31T03:55:26.799Z');
INSERT INTO "estat_metainfo" VALUES('0000020307','社会・人口統計体系','Ｇ　文化・スポーツ','city',NULL,'2025-10-31T03:55:39.913Z','2025-10-31T03:55:39.913Z');
INSERT INTO "estat_metainfo" VALUES('0000020308','社会・人口統計体系','Ｈ　居住','city',NULL,'2025-10-31T03:55:52.264Z','2025-10-31T03:55:52.264Z');
INSERT INTO "estat_metainfo" VALUES('0000020309','社会・人口統計体系','Ｉ　健康・医療','city',NULL,'2025-10-31T03:56:02.511Z','2025-10-31T03:56:02.511Z');
INSERT INTO "estat_metainfo" VALUES('0000020310','社会・人口統計体系','Ｊ　福祉・社会保障','city',NULL,'2025-10-31T03:56:13.498Z','2025-10-31T03:56:13.498Z');
INSERT INTO "estat_metainfo" VALUES('0000020311','社会・人口統計体系','Ｋ　安全','city',NULL,'2025-10-31T03:56:25.760Z','2025-10-31T03:56:25.760Z');
CREATE TABLE estat_ranking_mappings (
  stats_data_id TEXT NOT NULL,
  cat01 TEXT NOT NULL,
  item_name TEXT NOT NULL,
  item_code TEXT NOT NULL,
  unit TEXT,
  area_type TEXT NOT NULL DEFAULT 'prefecture',  
  is_ranking BOOLEAN DEFAULT 0,  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (stats_data_id, cat01),
  CHECK (area_type IN ('prefecture', 'city', 'national'))
);
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1101','総人口','total-population','人','prefecture',1,'2025-11-02T03:17:35.359Z','2025-11-02T03:20:08.647Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A110101','総人口（男）','total-population-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A110102','総人口（女）','total-population-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1102','日本人人口','japanese-population','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A110201','日本人人口（男）','japanese-population-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A110202','日本人人口（女）','japanese-population-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1201','0～4歳人口','population-0-4','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A120101','0～4歳人口（男）','population-0-4-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A120102','0～4歳人口（女）','population-0-4-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1202','5～9歳人口','population-5-9','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A120201','5～9歳人口（男）','population-5-9-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A120202','5～9歳人口（女）','population-5-9-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1203','10～14歳人口','population-10-14','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A120301','10～14歳人口（男）','population-10-14-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A120302','10～14歳人口（女）','population-10-14-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1204','15～19歳人口','population-15-19','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A120401','15～19歳人口（男）','population-15-19-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A120402','15～19歳人口（女）','population-15-19-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1205','20～24歳人口','population-20-24','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A120501','20～24歳人口（男）','population-20-24-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A120502','20～24歳人口（女）','population-20-24-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1206','25～29歳人口','population-25-29','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A120601','25～29歳人口（男）','population-25-29-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A120602','25～29歳人口（女）','population-25-29-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1207','30～34歳人口','population-30-34','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A120701','30～34歳人口（男）','population-30-34-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A120702','30～34歳人口（女）','population-30-34-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1208','35～39歳人口','population-35-39','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A120801','35～39歳人口（男）','population-35-39-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A120802','35～39歳人口（女）','population-35-39-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1209','40～44歳人口','population-40-44','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A120901','40～44歳人口（男）','population-40-44-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A120902','40～44歳人口（女）','population-40-44-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1210','45～49歳人口','population-45-49','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A121001','45～49歳人口（男）','population-45-49-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A121002','45～49歳人口（女）','population-45-49-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1211','50～54歳人口','population-50-54','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A121101','50～54歳人口（男）','population-50-54-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A121102','50～54歳人口（女）','population-50-54-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1212','55～59歳人口','population-55-59','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A121201','55～59歳人口（男）','population-55-59-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A121202','55～59歳人口（女）','population-55-59-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1213','60～64歳人口','population-60-64','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A121301','60～64歳人口（男）','population-60-64-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A121302','60～64歳人口（女）','population-60-64-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1214','65～69歳人口','population-65-69','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A121401','65～69歳人口（男）','population-65-69-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A121402','65～69歳人口（女）','population-65-69-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1215','70～74歳人口','population-70-74','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A121501','70～74歳人口（男）','population-70-74-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A121502','70～74歳人口（女）','population-70-74-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1216','75～79歳人口','population-75-79','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A121601','75～79歳人口（男）','population-75-79-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A121602','75～79歳人口（女）','population-75-79-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1217','80～84歳人口','population-80-84','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A121701','80～84歳人口（男）','population-80-84-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A121702','80～84歳人口（女）','population-80-84-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1218','85～89歳人口','population-85-89','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A121801','85～89歳人口（男）','population-85-89-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A121802','85～89歳人口（女）','population-85-89-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1219','90～94歳人口','population-90-94','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A121901','90～94歳人口（男）','population-90-94-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A121902','90～94歳人口（女）','population-90-94-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1220','95～99歳人口','population-95-99','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A122001','95～99歳人口（男）','population-95-99-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A122002','95～99歳人口（女）','population-95-99-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1221','100歳以上人口','population-100-plus','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A122101','100歳以上人口（男）','population-100-plus-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A122102','100歳以上人口（女）','population-100-plus-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1231','年齢中位数','median-age','歳','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1301','15歳未満人口','young-population','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A130101','15歳未満人口（男）','young-population-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A130102','15歳未満人口（女）','young-population-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1302','15～64歳人口','production-age-population','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A130201','15～64歳人口（男）','production-age-population-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A130202','15～64歳人口（女）','production-age-population-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1303','65歳以上人口','old-population','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A130301','65歳以上人口（男）','old-population-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A130302','65歳以上人口（女）','old-population-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1304','15歳未満人口割合','young-population-ratio','％','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A130401','15歳未満人口割合（男）','young-population-ratio-male','％','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A130402','15歳未満人口割合（女）','young-population-ratio-female','％','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1305','15～64歳人口割合','production-age-population-ratio','％','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A130501','15～64歳人口割合（男）','production-age-population-ratio-male','％','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A130502','15～64歳人口割合（女）','production-age-population-ratio-female','％','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1306','65歳以上人口割合','ratio-65-plus','％','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A130601','65歳以上人口割合（男）','ratio-65-plus-male','％','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A130602','65歳以上人口割合（女）','ratio-65-plus-female','％','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1401','3歳人口','population-3','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A140101','3歳人口（男）','population-3-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A140102','3歳人口（女）','population-3-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1402','4歳人口','population-4','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A140201','4歳人口（男）','population-4-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A140202','4歳人口（女）','population-4-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1403','5歳人口','population-5','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A140301','5歳人口（男）','population-5-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A140302','5歳人口（女）','population-5-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1404','0～3歳人口','population-0-3','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A140401','0～3歳人口（男）','population-0-3-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A140402','0～3歳人口（女）','population-0-3-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1405','0～5歳人口','population-0-5','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A140501','0～5歳人口（男）','population-0-5-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A140502','0～5歳人口（女）','population-0-5-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1406','0～15歳人口','population-0-15','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A140601','0～15歳人口（男）','population-0-15-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A140602','0～15歳人口（女）','population-0-15-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1407','0～17歳人口','population-0-17','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A140701','0～17歳人口（男）','population-0-17-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A140702','0～17歳人口（女）','population-0-17-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1408','3～5歳人口','population-3-5','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A140801','3～5歳人口（男）','population-3-5-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A140802','3～5歳人口（女）','population-3-5-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1409','6～11歳人口','population-6-11','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A140901','6～11歳人口（男）','population-6-11-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A140902','6～11歳人口（女）','population-6-11-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1410','10～13歳人口','population-10-13','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A141001','10～13歳人口（男）','population-10-13-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A141002','10～13歳人口（女）','population-10-13-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1411','12～14歳人口','population-12-14','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A141101','12～14歳人口（男）','population-12-14-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A141102','12～14歳人口（女）','population-12-14-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1412','14～19歳人口','population-14-19','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A141201','14～19歳人口（男）','population-14-19-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A141202','14～19歳人口（女）','population-14-19-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1413','15～17歳人口','population-15-17','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A141301','15～17歳人口（男）','population-15-17-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A141302','15～17歳人口（女）','population-15-17-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1414','15歳以上人口','population-15-plus','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A141401','15歳以上人口（男）','population-15-plus-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A141402','15歳以上人口（女）','population-15-plus-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1415','40歳以上人口','population-40-plus','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A141501','40歳以上人口（男）','population-40-plus-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A141502','40歳以上人口（女）','population-40-plus-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1416','60歳以上人口','population-60-plus','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A141601','60歳以上人口（男）','population-60-plus-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A141602','60歳以上人口（女）','population-60-plus-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1417','70歳以上人口','population-70-plus','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A141701','70歳以上人口（男）','population-70-plus-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A141702','70歳以上人口（女）','population-70-plus-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1418','80歳以上人口','population-80-plus','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A141801','80歳以上人口（男）','population-80-plus-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A141802','80歳以上人口（女）','population-80-plus-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1419','75歳以上人口','population-75-plus','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A141901','75歳以上人口（男）','population-75-plus-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A141902','75歳以上人口（女）','population-75-plus-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1420','85歳以上人口','population-85-plus','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A142001','85歳以上人口（男）','population-85-plus-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A142002','85歳以上人口（女）','population-85-plus-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1501','－1歳人口','population-minus-1','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1502','0歳人口','population-0','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A150201','0歳人口（男）','population-0-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A150202','0歳人口（女）','population-0-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1503','1歳人口','population-1','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A150301','1歳人口（男）','population-1-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A150302','1歳人口（女）','population-1-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1504','2歳人口','population-2','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A150401','2歳人口（男）','population-2-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A150402','2歳人口（女）','population-2-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1505','6歳人口','population-6','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A150501','6歳人口（男）','population-6-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A150502','6歳人口（女）','population-6-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1506','7歳人口','population-7','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A150601','7歳人口（男）','population-7-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A150602','7歳人口（女）','population-7-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1507','8歳人口','population-8','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A150701','8歳人口（男）','population-8-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A150702','8歳人口（女）','population-8-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1508','9歳人口','population-9','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A150801','9歳人口（男）','population-9-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A150802','9歳人口（女）','population-9-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1509','10歳人口','population-10','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A150901','10歳人口（男）','population-10-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A150902','10歳人口（女）','population-10-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1510','11歳人口','population-11','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A151001','11歳人口（男）','population-11-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A151002','11歳人口（女）','population-11-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1511','12歳人口','population-12','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A151101','12歳人口（男）','population-12-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A151102','12歳人口（女）','population-12-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1512','13歳人口','population-13','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A151201','13歳人口（男）','population-13-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A151202','13歳人口（女）','population-13-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1513','14歳人口','population-14','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A151301','14歳人口（男）','population-14-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A151302','14歳人口（女）','population-14-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1514','15歳人口','population-15','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A151401','15歳人口（男）','population-15-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A151402','15歳人口（女）','population-15-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1515','16歳人口','population-16','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A151501','16歳人口（男）','population-16-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A151502','16歳人口（女）','population-16-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1516','17歳人口','population-17','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A151601','17歳人口（男）','population-17-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A151602','17歳人口（女）','population-17-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1517','18歳人口','population-18','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A151701','18歳人口（男）','population-18-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A151702','18歳人口（女）','population-18-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1601001','未婚人口（15歳以上）（男）','unmarried-population-man','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1601002','未婚人口（15歳以上）（女）','unmarried-population-woman','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1601011','未婚人口（15～19歳）（男）','never-married-15-19-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1601012','未婚人口（15～19歳）（女）','never-married-15-19-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1601021','未婚人口（20～24歳）（男）','never-married-20-24-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1601022','未婚人口（20～24歳）（女）','never-married-20-24-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1601031','未婚人口（25～29歳）（男）','never-married-25-29-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1601032','未婚人口（25～29歳）（女）','never-married-25-29-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1601041','未婚人口（30～34歳）（男）','never-married-30-34-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1601042','未婚人口（30～34歳）（女）','never-married-30-34-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1601051','未婚人口（35～39歳）（男）','never-married-35-39-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1601052','未婚人口（35～39歳）（女）','never-married-35-39-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1601061','未婚人口（40～44歳）（男）','never-married-40-44-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1601062','未婚人口（40～44歳）（女）','never-married-40-44-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1601071','未婚人口（45～49歳）（男）','never-married-45-49-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1601072','未婚人口（45～49歳）（女）','never-married-45-49-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1601081','未婚人口（50～54歳）（男）','never-married-50-54-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1601082','未婚人口（50～54歳）（女）','never-married-50-54-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1601091','未婚人口（55～59歳）（男）','never-married-55-59-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1601092','未婚人口（55～59歳）（女）','never-married-55-59-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1601101','未婚人口（60～64歳）（男）','never-married-60-64-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1601102','未婚人口（60～64歳）（女）','never-married-60-64-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1601111','未婚人口（65～69歳）（男）','never-married-65-69-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1601112','未婚人口（65～69歳）（女）','never-married-65-69-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1601121','未婚人口（70～74歳）（男）','never-married-70-74-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1601122','未婚人口（70～74歳）（女）','never-married-70-74-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1601131','未婚人口（75～79歳）（男）','never-married-75-79-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1601132','未婚人口（75～79歳）（女）','never-married-75-79-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1601141','未婚人口（80～84歳）（男）','never-married-80-84-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1601142','未婚人口（80～84歳）（女）','never-married-80-84-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1601151','未婚人口（85歳以上）（男）','never-married-85-plus-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1601152','未婚人口（85歳以上）（女）','never-married-85-plus-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1602001','有配偶人口（15歳以上）（男）','married-15-plus-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1602002','有配偶人口（15歳以上）（女）','married-15-plus-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1602021','有配偶人口（20～24歳）（男）','married-20-24-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1602022','有配偶人口（20～24歳）（女）','married-20-24-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1602031','有配偶人口（25～29歳）（男）','married-25-29-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1602032','有配偶人口（25～29歳）（女）','married-25-29-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1602041','有配偶人口（30～34歳）（男）','married-30-34-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1602042','有配偶人口（30～34歳）（女）','married-30-34-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1602051','有配偶人口（35～39歳）（男）','married-35-39-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1602052','有配偶人口（35～39歳）（女）','married-35-39-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1602061','有配偶人口（40～44歳）（男）','married-40-44-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1602062','有配偶人口（40～44歳）（女）','married-40-44-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1602071','有配偶人口（45～49歳）（男）','married-45-49-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1602072','有配偶人口（45～49歳）（女）','married-45-49-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1602081','有配偶人口（50～54歳）（男）','married-50-54-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1602082','有配偶人口（50～54歳）（女）','married-50-54-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1602091','有配偶人口（55～59歳）（男）','married-55-59-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1602092','有配偶人口（55～59歳）（女）','married-55-59-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1602101','有配偶人口（60～64歳）（男）','married-60-64-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1602102','有配偶人口（60～64歳）（女）','married-60-64-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1602111','有配偶人口（65～69歳）（男）','married-65-69-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1602112','有配偶人口（65～69歳）（女）','married-65-69-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1602121','有配偶人口（70～74歳）（男）','married-70-74-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1602122','有配偶人口（70～74歳）（女）','married-70-74-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1602131','有配偶人口（75～79歳）（男）','married-75-79-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1602132','有配偶人口（75～79歳）（女）','married-75-79-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1602141','有配偶人口（80～84歳）（男）','married-80-84-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1602142','有配偶人口（80～84歳）（女）','married-80-84-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1602151','有配偶人口（85歳以上）（男）','married-85-plus-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1602152','有配偶人口（85歳以上）（女）','married-85-plus-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1603001','死別人口（15歳以上）（男）','widowed-15-plus-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1603002','死別人口（15歳以上）（女）','widowed-15-plus-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1603031','死別人口（25～29歳）（男）','widowed-25-29-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1603032','死別人口（25～29歳）（女）','widowed-25-29-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1603041','死別人口（30～34歳）（男）','widowed-30-34-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1603042','死別人口（30～34歳）（女）','widowed-30-34-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1603051','死別人口（35～39歳）（男）','widowed-35-39-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1603052','死別人口（35～39歳）（女）','widowed-35-39-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1603061','死別人口（40～44歳）（男）','widowed-40-44-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1603062','死別人口（40～44歳）（女）','widowed-40-44-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1603071','死別人口（45～49歳）（男）','widowed-45-49-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1603072','死別人口（45～49歳）（女）','widowed-45-49-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1603081','死別人口（50～54歳）（男）','widowed-50-54-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1603082','死別人口（50～54歳）（女）','widowed-50-54-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1603091','死別人口（55～59歳）（男）','widowed-55-59-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1603092','死別人口（55～59歳）（女）','widowed-55-59-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1603101','死別人口（60～64歳）（男）','widowed-60-64-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1603102','死別人口（60～64歳）（女）','widowed-60-64-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1603111','死別人口（65～69歳）（男）','widowed-65-69-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1603112','死別人口（65～69歳）（女）','widowed-65-69-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1603121','死別人口（70～74歳）（男）','widowed-70-74-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1603122','死別人口（70～74歳）（女）','widowed-70-74-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1603131','死別人口（75～79歳）（男）','widowed-75-79-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1603132','死別人口（75～79歳）（女）','widowed-75-79-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1603141','死別人口（80～84歳）（男）','widowed-80-84-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1603142','死別人口（80～84歳）（女）','widowed-80-84-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1603151','死別人口（85歳以上）（男）','widowed-85-plus-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1603152','死別人口（85歳以上）（女）','widowed-85-plus-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1603201','死別人口（60歳以上）（男）','widowed-60-plus-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1603202','死別人口（60歳以上）（女）','widowed-60-plus-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1604001','離別人口（15歳以上）（男）','divorced-15-plus-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1604002','離別人口（15歳以上）（女）','divorced-15-plus-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1604011','離別人口（15～19歳）（男）','divorced-15-19-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1604012','離別人口（15～19歳）（女）','divorced-15-19-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1604021','離別人口（20～24歳）（男）','divorced-20-24-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1604022','離別人口（20～24歳）（女）','divorced-20-24-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1604031','離別人口（25～29歳）（男）','divorced-25-29-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1604032','離別人口（25～29歳）（女）','divorced-25-29-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1604041','離別人口（30～34歳）（男）','divorced-30-34-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1604042','離別人口（30～34歳）（女）','divorced-30-34-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1604051','離別人口（35～39歳）（男）','divorced-35-39-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1604052','離別人口（35～39歳）（女）','divorced-35-39-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1604061','離別人口（40～44歳）（男）','divorced-40-44-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1604062','離別人口（40～44歳）（女）','divorced-40-44-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1604071','離別人口（45～49歳）（男）','divorced-45-49-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1604072','離別人口（45～49歳）（女）','divorced-45-49-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1604081','離別人口（50～54歳）（男）','divorced-50-54-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1604082','離別人口（50～54歳）（女）','divorced-50-54-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1604091','離別人口（55～59歳）（男）','divorced-55-59-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1604092','離別人口（55～59歳）（女）','divorced-55-59-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1604101','離別人口（60～64歳）（男）','divorced-60-64-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1604102','離別人口（60～64歳）（女）','divorced-60-64-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1604111','離別人口（65～69歳）（男）','divorced-65-69-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1604112','離別人口（65～69歳）（女）','divorced-65-69-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1604121','離別人口（70～74歳）（男）','divorced-70-74-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1604122','離別人口（70～74歳）（女）','divorced-70-74-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1604131','離別人口（75～79歳）（男）','divorced-75-79-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1604132','離別人口（75～79歳）（女）','divorced-75-79-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1604141','離別人口（80～84歳）（男）','divorced-80-84-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1604142','離別人口（80～84歳）（女）','divorced-80-84-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1604151','離別人口（85歳以上）（男）','divorced-85-plus-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1604152','離別人口（85歳以上）（女）','divorced-85-plus-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1604201','離別人口（40～49歳）（男）','divorced-40-49-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1604202','離別人口（40～49歳）（女）','divorced-40-49-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1604301','離別人口（50～59歳）（男）','divorced-50-59-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1604302','離別人口（50～59歳）（女）','divorced-50-59-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A161001','未婚者割合（15歳以上人口）','ratio-never-married-15-plus','％','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1700','外国人人口','foreign-resident-count','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A170001','外国人人口（男）','foreign-resident-count-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A170002','外国人人口（女）','foreign-resident-count-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1701','外国人人口（韓国、朝鮮）','foreign-resident-count-korea','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A170101','外国人人口（韓国・朝鮮）（男）','foreign-resident-count-korea-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A170102','外国人人口（韓国・朝鮮）（女）','foreign-resident-count-korea-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1702','外国人人口（中国）','foreign-resident-count-china','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A170201','外国人人口（中国）（男）','foreign-resident-count-china-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A170202','外国人人口（中国）（女）','foreign-resident-count-china-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1703','外国人人口（アメリカ）','foreign-resident-count-usa','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A170301','外国人人口（アメリカ）（男）','foreign-resident-count-usa-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A170302','外国人人口（アメリカ）（女）','foreign-resident-count-usa-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1706','外国人人口（フィリピン）','foreign-resident-count-philippines','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A170601','外国人人口（フィリピン）（男）','foreign-resident-count-philippines-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A170602','外国人人口（フィリピン）（女）','foreign-resident-count-philippines-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1707','外国人人口（ブラジル）','foreign-resident-count-brazil','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A170701','外国人人口（ブラジル）（男）','foreign-resident-count-brazil-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A170702','外国人人口（ブラジル）（女）','foreign-resident-count-brazil-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1801','人口集中地区人口','densely-inhabited-district-population','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A180101','人口集中地区人口（男）','densely-inhabited-district-population-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A180102','人口集中地区人口（女）','densely-inhabited-district-population-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A1802','人口集中地区面積','densely-populated-area','ｋｍ2','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A191001','将来推計人口（2020年）','projected-population-2020','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A191002','将来推計人口（2025年）','projected-population-2025','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A191003','将来推計人口（2030年）','projected-population-2030','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A191004','将来推計人口（2035年）','projected-population-2035','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A191005','将来推計人口（2040年）','projected-population-2040','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A191006','将来推計人口（2045年）','projected-population-2045','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A191007','将来推計人口（2050年）','projected-population-2050','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A192001','全国総人口に占める人口割合','ratio-of-total-population','％','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A192002','人口性比（総数）','sex-ratio-total','‐','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A192003','人口増減率','population-growth-rate','‰','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A2101','住民基本台帳人口（日本人）','basic-resident-register-population-japanese','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A210101','住民基本台帳人口（日本人）（男）','basic-resident-register-population-japanese-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A210102','住民基本台帳人口（日本人）（女）','basic-resident-register-population-japanese-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A2102','行政区域内人口（住民基本台帳人口＋外国人登録人口）','population-in-administrative-area','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A2201','住民基本台帳人口（外国人）','basic-resident-register-population-foreigner','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A2301','住民基本台帳人口（総数）','basic-resident-register-population-total','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A3100','外国人登録人口','registered-foreigner-population','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A3101','外国人登録人口（アジア）','registered-foreigner-population-asia','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A310101','外国人登録人口（韓国・朝鮮）','registered-foreigner-population-korea','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A310102','外国人登録人口（中国）','registered-foreigner-population-china','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A310103','外国人登録人口（フィリピン）','registered-foreigner-population-philippines','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A310105','外国人登録人口（タイ）','registered-foreigner-population-thailand','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A3102','外国人登録人口（ヨーロッパ）','registered-foreigner-population-europe','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A310201','外国人登録人口（英国）','registered-foreigner-population-uk','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A3103','外国人登録人口（北米）','registered-foreigner-population-north-america','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A310301','外国人登録人口（米国）','registered-foreigner-population-usa','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A3104','外国人登録人口（南米）','registered-foreigner-population-south-america','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A310401','外国人登録人口（ブラジル）','registered-foreigner-population-brazil','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A310402','外国人登録人口（ペルー）','registered-foreigner-population-peru','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A3200','在留外国人数','resident-foreigner-population','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A3201','在留外国人数（アジア）','resident-foreigner-population-asia','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A320101','在留外国人数（韓国・朝鮮）','resident-foreigner-population-korea','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A320102','在留外国人数（中国）','resident-foreigner-population-china','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A320103','在留外国人数（韓国）','resident-foreigner-population-korea-only','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A320104','在留外国人数（朝鮮）','resident-foreigner-population-chosen','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A3202','在留外国人数（ヨーロッパ）','resident-foreigner-population-europe','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A3203','在留外国人数（北アメリカ）','resident-foreigner-population-north-america','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A3204','在留外国人数（南アメリカ）','resident-foreigner-population-south-america','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A4101','出生数','births','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A410101','出生数（男）','births-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A410102','出生数（女）','births-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A410201','出生数（母親の年齢15歳未満）','births-mother-under-15','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A410202','出生数（母親の年齢15～19歳）','births-mother-15-19','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A410203','出生数（母親の年齢20～24歳）','births-mother-20-24','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A410204','出生数（母親の年齢25～29歳）','births-mother-25-29','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A410205','出生数（母親の年齢30～34歳）','births-mother-30-34','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A410206','出生数（母親の年齢35～39歳）','births-mother-35-39','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A410207','出生数（母親の年齢40～44歳）','births-mother-40-44','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A410208','出生数（母親の年齢45～49歳）','births-mother-45-49','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A410209','出生数（母親の年齢50歳以上）','births-mother-50-plus','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A4103','合計特殊出生率','total-fertility-rate','‐','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A4200','死亡数','death-count','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A420001','死亡数（男）','deaths-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A420002','死亡数（女）','deaths-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A4201','死亡数（0～4歳）','deaths-0-4','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A420101','死亡数（0～4歳）（男）','deaths-0-4-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A420102','死亡数（0～4歳）（女）','deaths-0-4-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A4202','死亡数（5～9歳）','deaths-5-9','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A420201','死亡数（5～9歳）（男）','deaths-5-9-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A420202','死亡数（5～9歳）（女）','deaths-5-9-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A4203','死亡数（10～14歳）','deaths-10-14','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A420301','死亡数（10～14歳）（男）','deaths-10-14-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A420302','死亡数（10～14歳）（女）','deaths-10-14-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A4204','死亡数（15～19歳）','deaths-15-19','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A420401','死亡数（15～19歳）（男）','deaths-15-19-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A420402','死亡数（15～19歳）（女）','deaths-15-19-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A4205','死亡数（20～24歳）','deaths-20-24','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A420501','死亡数（20～24歳）（男）','deaths-20-24-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A420502','死亡数（20～24歳）（女）','deaths-20-24-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A4206','死亡数（25～29歳）','deaths-25-29','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A420601','死亡数（25～29歳）（男）','deaths-25-29-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A420602','死亡数（25～29歳）（女）','deaths-25-29-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A4207','死亡数（30～34歳）','deaths-30-34','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A420701','死亡数（30～34歳）（男）','deaths-30-34-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A420702','死亡数（30～34歳）（女）','deaths-30-34-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A4208','死亡数（35～39歳）','deaths-35-39','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A420801','死亡数（35～39歳）（男）','deaths-35-39-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A420802','死亡数（35～39歳）（女）','deaths-35-39-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A4209','死亡数（40～44歳）','deaths-40-44','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A420901','死亡数（40～44歳）（男）','deaths-40-44-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A420902','死亡数（40～44歳）（女）','deaths-40-44-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A4210','死亡数（45～49歳）','deaths-45-49','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A421001','死亡数（45～49歳）（男）','deaths-45-49-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A421002','死亡数（45～49歳）（女）','deaths-45-49-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A4211','死亡数（50～54歳）','deaths-50-54','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A421101','死亡数（50～54歳）（男）','deaths-50-54-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A421102','死亡数（50～54歳）（女）','deaths-50-54-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A4212','死亡数（55～59歳）','deaths-55-59','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A421201','死亡数（55～59歳）（男）','deaths-55-59-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A421202','死亡数（55～59歳）（女）','deaths-55-59-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A4213','死亡数（60～64歳）','deaths-60-64','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A421301','死亡数（60～64歳）（男）','deaths-60-64-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A421302','死亡数（60～64歳）（女）','deaths-60-64-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A4214','死亡数（65～69歳）','deaths-65-69','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A421401','死亡数（65～69歳）（男）','deaths-65-69-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A421402','死亡数（65～69歳）（女）','deaths-65-69-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A4215','死亡数（70～74歳）','deaths-70-74','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A421501','死亡数（70～74歳）（男）','deaths-70-74-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A421502','死亡数（70～74歳）（女）','deaths-70-74-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A4216','死亡数（75～79歳）','deaths-75-79','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A421601','死亡数（75～79歳）（男）','deaths-75-79-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A421602','死亡数（75～79歳）（女）','deaths-75-79-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A4217','死亡数（80～84歳）','deaths-80-84','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A421701','死亡数（80～84歳）（男）','deaths-80-84-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A421702','死亡数（80～84歳）（女）','deaths-80-84-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A4218','死亡数（85～89歳）','deaths-85-89','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A421801','死亡数（85～89歳）（男）','deaths-85-89-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A421802','死亡数（85～89歳）（女）','deaths-85-89-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A4219','死亡数（90～94歳）','deaths-90-94','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A421901','死亡数（90～94歳）（男）','deaths-90-94-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A421902','死亡数（90～94歳）（女）','deaths-90-94-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A4220','死亡数（95～99歳）','deaths-95-99','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A422001','死亡数（95～99歳）（男）','deaths-95-99-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A422002','死亡数（95～99歳）（女）','deaths-95-99-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A4221','死亡数（100歳以上）','deaths-100-plus','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A422101','死亡数（100歳以上）（男）','deaths-100-plus-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A422102','死亡数（100歳以上）（女）','deaths-100-plus-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A4231','死亡数（65歳以上）','deaths-65-plus','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A423101','死亡数（65歳以上）（男）','deaths-65-plus-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A423102','死亡数（65歳以上）（女）','deaths-65-plus-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A424001','年齢調整死亡率（男）（昭和60年モデル人口）','age-adjusted-mortality-rate-woman','‐','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A424002','年齢調整死亡率（女）（昭和60年モデル人口）','age-adjusted-mortality-female-1985-model','‐','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A424011','年齢調整死亡率（男）（平成27年モデル人口）','age-adjusted-mortality-rate-man','‐','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A424012','年齢調整死亡率（女）（平成27年モデル人口）','age-adjusted-mortality-rate-woman','‐','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A4270','死産数','stillbirths','胎','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A427001','自然死産数','natural-stillbirths','胎','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A4271','死産数（妊娠満22週以後）','stillbirths-after-22-weeks','胎','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A4280','新生児死亡数','neonatal-deaths','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A4281','乳児死亡数','infant-deaths','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A4301','標準化死亡率〔日本人〕','standardized-mortality-japanese','‰','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A4401','自然増減率','natural-increase-rate','‰','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A5101','転入者数（日本人移動者）','japanese-movers-in','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A510101','転入者数（日本人移動者）（男）','japanese-movers-in-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A510102','転入者数（日本人移動者）（女）','japanese-movers-in-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A5102','転出者数（日本人移動者）','japanese-movers-out','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A510201','転出者数（日本人移動者）（男）','japanese-movers-out-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A510202','転出者数（日本人移動者）（女）','japanese-movers-out-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A5103','転入者数','movers-in','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A510301','転入者数（男）','movers-in-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A510302','転入者数（女）','movers-in-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A5104','転出者数','movers-out','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A510401','転出者数（男）','movers-out-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A510402','転出者数（女）','movers-out-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A5201','入国者数（日本人）','japanese-entries','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A520101','入国者数（日本人）（男）','japanese-entries-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A520102','入国者数（日本人）（女）','japanese-entries-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A5202','出国者数（日本人）','japanese-departures','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A520201','出国者数（日本人）（男）','japanese-departures-male','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A520202','出国者数（日本人）（女）','japanese-departures-female','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A5301','社会増減率','social-increase-rate','‰','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A5302','社会増減数','social-increase','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
INSERT INTO "estat_ranking_mappings" VALUES('0000010101','A6101','従業も通学もしていない人口','not-working-or-studying','人','prefecture',0,'2025-11-02T03:17:35.359Z','2025-11-02T03:17:35.359Z');
CREATE TABLE ranking_items (
  ranking_key TEXT NOT NULL,
  area_type TEXT NOT NULL,  
  label TEXT NOT NULL,
  ranking_name TEXT NOT NULL,
  annotation TEXT,
  unit TEXT NOT NULL,
  group_key TEXT,
  display_order_in_group INTEGER DEFAULT 0,
  map_color_scheme TEXT DEFAULT 'interpolateBlues',
  map_diverging_midpoint TEXT DEFAULT 'zero',
  ranking_direction TEXT DEFAULT 'desc',
  conversion_factor REAL DEFAULT 1,
  decimal_places INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (ranking_key, area_type),
  CHECK (area_type IN ('prefecture', 'city', 'national')),
  FOREIGN KEY (group_key) REFERENCES ranking_groups(group_key)
);
INSERT INTO "ranking_items" VALUES('aging-index','prefecture','老年化指数','老年化指数',NULL,'‐','aging-index',0,'interpolateBlues','zero','desc',1,0,1,'2025-11-02 03:17:14','2025-11-02 03:17:14');
INSERT INTO "ranking_items" VALUES('agricultural-income-ratio','prefecture','農業所得割合','農業所得割合',NULL,'％','agricultural-income-ratio',0,'interpolateBlues','zero','desc',1,0,1,'2025-11-02 03:17:14','2025-11-02 03:17:14');
INSERT INTO "ranking_items" VALUES('agricultural-output-per-employed-person','prefecture','就業者1人当たり農業産出額（販売農家）','就業者1人当たり農業産出額（販売農家）',NULL,'万円','agricultural-output-per-employed-person',0,'interpolateBlues','zero','desc',1,0,1,'2025-11-02 03:17:14','2025-11-02 03:17:14');
INSERT INTO "ranking_items" VALUES('annual-precipitation','prefecture','降水量（年間）','降水量（年間）',NULL,'mm','annual-precipitation',0,'interpolateBlues','zero','desc',1,0,1,'2025-11-02 03:17:14','2025-11-02 03:17:14');
INSERT INTO "ranking_items" VALUES('annual-sales-amount-per-employee','prefecture','商業年間商品販売額（卸売業＋小売業）（従業者1人当たり）','商業年間商品販売額（卸売業＋小売業）（従業者1人当たり）',NULL,'万円','annual-sales-amount-per-employee',0,'interpolateBlues','zero','desc',1,0,1,'2025-11-02 03:17:14','2025-11-02 03:17:14');
INSERT INTO "ranking_items" VALUES('average-persons-per-general-household','prefecture','一般世帯の平均人員','一般世帯の平均人員',NULL,'人','average-persons-per-general-household',0,'interpolateBlues','zero','desc',1,0,1,'2025-11-02 03:17:14','2025-11-02 03:17:14');
INSERT INTO "ranking_items" VALUES('average-relative-humidity','prefecture','年平均相対湿度','年平均相対湿度',NULL,'％','average-relative-humidity',0,'interpolateBlues','zero','desc',1,0,1,'2025-11-02 03:17:14','2025-11-02 03:17:14');
INSERT INTO "ranking_items" VALUES('average-temperature','prefecture','年平均気温','年平均気温',NULL,'ﾟC','average-temperature',0,'interpolateBlues','zero','desc',1,0,1,'2025-11-02 03:17:14','2025-11-02 03:17:14');
INSERT INTO "ranking_items" VALUES('bank-deposit-balance-per-person','prefecture','国内銀行預金残高（人口1人当たり）','国内銀行預金残高（人口1人当たり）',NULL,'万円','bank-deposit-balance-per-person',0,'interpolateBlues','zero','desc',1,0,1,'2025-11-02 03:17:14','2025-11-02 03:17:14');
INSERT INTO "ranking_items" VALUES('block-park-count-per-100km2','prefecture','街区公園数（可住地面積100km2当たり）','街区公園数（可住地面積100km2当たり）',NULL,'所','block-park-count-per-100km2',0,'interpolateBlues','zero','desc',1,0,1,'2025-11-02 03:17:14','2025-11-02 03:17:14');
INSERT INTO "ranking_items" VALUES('building-fire-count-per-100-thousand-people','prefecture','火災出火件数（人口10万人当たり）','火災出火件数（人口10万人当たり）',NULL,'件','building-fire-count-per-100-thousand-people',0,'interpolateBlues','zero','desc',1,0,1,'2025-11-02 03:17:14','2025-11-02 03:17:14');
INSERT INTO "ranking_items" VALUES('city-gas-sales-volume','prefecture','都市ガス販売量','都市ガス販売量',NULL,'万ＭＪ','city-gas-sales-volume',0,'interpolateBlues','zero','desc',1,0,1,'2025-11-02 03:17:14','2025-11-02 03:17:14');
INSERT INTO "ranking_items" VALUES('city-gas-supply-area-household-ratio','prefecture','都市ガス供給区域内世帯比率','都市ガス供給区域内世帯比率',NULL,'％','city-gas-supply-area-household-ratio',0,'interpolateBlues','zero','desc',1,0,1,'2025-11-02 03:17:14','2025-11-02 03:17:14');
INSERT INTO "ranking_items" VALUES('complainant-rate-per-1000','prefecture','有訴者率（人口千人当たり）','有訴者率（人口千人当たり）',NULL,'‐','complainant-rate-per-1000',0,'interpolateBlues','zero','desc',1,0,1,'2025-11-02 03:17:14','2025-11-02 03:17:14');
INSERT INTO "ranking_items" VALUES('criminal-arrest-rate','prefecture','刑法犯検挙率','刑法犯検挙率',NULL,'％','criminal-arrest-rate',0,'interpolateBlues','zero','desc',1,0,1,'2025-11-02 03:17:14','2025-11-02 03:17:14');
INSERT INTO "ranking_items" VALUES('criminal-recognition-count-of-serious-crime-rate','prefecture','刑法犯認知件数に占める凶悪犯の割合','刑法犯認知件数に占める凶悪犯の割合',NULL,'％','criminal-recognition-count-of-serious-crime-rate',0,'interpolateBlues','zero','desc',1,0,1,'2025-11-02 03:17:14','2025-11-02 03:17:14');
INSERT INTO "ranking_items" VALUES('crude-birth-rate','prefecture','粗出生率（人口千人当たり）','粗出生率（人口千人当たり）',NULL,'‐','crude-birth-rate',0,'interpolateBlues','zero','desc',1,0,1,'2025-11-02 03:17:14','2025-11-02 03:17:14');
INSERT INTO "ranking_items" VALUES('crude-death-rate','prefecture','粗死亡率（人口千人当たり）','粗死亡率（人口千人当たり）',NULL,'‐','crude-death-rate',0,'interpolateBlues','zero','desc',1,0,1,'2025-11-02 03:17:14','2025-11-02 03:17:14');
INSERT INTO "ranking_items" VALUES('cultivated-land-area-ratio','prefecture','耕地面積比率','耕地面積比率',NULL,'％','cultivated-land-area-ratio',0,'interpolateBlues','zero','desc',1,0,1,'2025-11-02 03:17:14','2025-11-02 03:17:14');
INSERT INTO "ranking_items" VALUES('day-time-population-ratio','prefecture','昼夜間人口比率','昼夜間人口比率',NULL,'％','day-time-population-ratio',0,'interpolateBlues','zero','desc',1,0,1,'2025-11-02 03:17:14','2025-11-02 03:17:14');
INSERT INTO "ranking_items" VALUES('densely-inhabited-district-population-density','prefecture','人口集中地区人口密度（人口集中地区面積１km2当たり）','人口集中地区人口密度（人口集中地区面積１km2当たり）',NULL,'人','densely-inhabited-district-population-density',0,'interpolateBlues','zero','desc',1,0,1,'2025-11-02 03:17:14','2025-11-02 03:17:14');
INSERT INTO "ranking_items" VALUES('densely-inhabited-district-population-ratio','prefecture','人口集中地区人口比率','人口集中地区人口比率',NULL,'％','densely-inhabited-district-population-ratio',0,'interpolateBlues','zero','desc',1,0,1,'2025-11-02 03:17:14','2025-11-02 03:17:14');
INSERT INTO "ranking_items" VALUES('densely-populated-area-change-rate','prefecture','人口集中地区面積の変化率','人口集中地区面積の変化率',NULL,'％','densely-populated-area-change-rate',0,'interpolateBlues','zero','desc',1,0,1,'2025-11-02 03:17:14','2025-11-02 03:17:14');
INSERT INTO "ranking_items" VALUES('densely-populated-area-ratio','prefecture','人口集中地区面積比率','人口集中地区面積比率',NULL,'％','densely-populated-area-ratio',0,'interpolateBlues','zero','desc',1,0,1,'2025-11-02 03:17:14','2025-11-02 03:17:14');
INSERT INTO "ranking_items" VALUES('dependent-population-index','prefecture','従属人口指数','従属人口指数',NULL,'‐','dependent-population-index',0,'interpolateBlues','zero','desc',1,0,1,'2025-11-02 03:17:14','2025-11-02 03:17:14');
INSERT INTO "ranking_items" VALUES('deposit-balance-per-person','prefecture','預貯金残高（人口1人当たり）','預貯金残高（人口1人当たり）',NULL,'万円','deposit-balance-per-person',0,'interpolateBlues','zero','desc',1,0,1,'2025-11-02 03:17:14','2025-11-02 03:17:14');
INSERT INTO "ranking_items" VALUES('divorces-per-total-population','prefecture','離婚率（人口千人当たり）','離婚率（人口千人当たり）',NULL,'‐','divorces-per-total-population',0,'interpolateBlues','zero','desc',1,0,1,'2025-11-02 03:17:14','2025-11-02 03:17:14');
INSERT INTO "ranking_items" VALUES('dual-income-household-ratio','prefecture','共働き世帯割合','共働き世帯割合',NULL,'％','dual-income-household-ratio',0,'interpolateBlues','zero','desc',1,0,1,'2025-11-02 03:17:14','2025-11-02 03:17:14');
INSERT INTO "ranking_items" VALUES('electricity-generation-capacity','prefecture','発電電力量','発電電力量',NULL,'Ｍｗｈ','electricity-generation-capacity',0,'interpolateBlues','zero','desc',1,0,1,'2025-11-02 03:17:14','2025-11-02 03:17:14');
INSERT INTO "ranking_items" VALUES('elementary-school-count-per-100k-6-11','prefecture','小学校数（6～11歳人口10万人当たり）','小学校数（6～11歳人口10万人当たり）',NULL,'校','elementary-school-count-per-100k-6-11',0,'interpolateBlues','zero','desc',1,0,1,'2025-11-02 03:17:14','2025-11-02 03:17:14');
INSERT INTO "ranking_items" VALUES('elementary-school-students-per-teacher','prefecture','小学校児童数（教員1人当たり）','小学校児童数（教員1人当たり）',NULL,'人','elementary-school-students-per-teacher',0,'interpolateBlues','zero','desc',1,0,1,'2025-11-02 03:17:14','2025-11-02 03:17:14');
INSERT INTO "ranking_items" VALUES('employed-people-ratio','prefecture','就業者比率','就業者比率',NULL,'％','employed-people-ratio',0,'interpolateBlues','zero','desc',1,0,1,'2025-11-02 03:17:14','2025-11-02 03:17:14');
INSERT INTO "ranking_items" VALUES('employee-ratio','prefecture','雇用者比率','雇用者比率',NULL,'％','employee-ratio',0,'interpolateBlues','zero','desc',1,0,1,'2025-11-02 03:17:14','2025-11-02 03:17:14');
INSERT INTO "ranking_items" VALUES('employment-insurance-receipt-rate','prefecture','雇用保険受給率','雇用保険受給率',NULL,'％','employment-insurance-receipt-rate',0,'interpolateBlues','zero','desc',1,0,1,'2025-11-02 03:17:14','2025-11-02 03:17:14');
INSERT INTO "ranking_items" VALUES('total-population','city','総人口','総人口',NULL,'人','total-population',0,'interpolateBlues','zero','desc',1,0,1,'2025-11-02 03:17:14','2025-11-02 03:17:14');
CREATE TABLE ranking_groups (
  group_key TEXT PRIMARY KEY,
  group_name TEXT NOT NULL,
  label TEXT,
  display_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "ranking_groups" VALUES('aging-index','老年化指数','老年化指数',0,'2025-11-02 03:17:13','2025-11-02 03:17:13');
INSERT INTO "ranking_groups" VALUES('agricultural-income-ratio','農業所得割合','農業所得割合',0,'2025-11-02 03:17:13','2025-11-02 03:17:13');
INSERT INTO "ranking_groups" VALUES('agricultural-output-per-employed-person','就業者1人当たり農業産出額（販売農家）','就業者1人当たり農業産出額（販売農家）',0,'2025-11-02 03:17:13','2025-11-02 03:17:13');
INSERT INTO "ranking_groups" VALUES('annual-precipitation','降水量（年間）','降水量（年間）',0,'2025-11-02 03:17:13','2025-11-02 03:17:13');
INSERT INTO "ranking_groups" VALUES('annual-sales-amount-per-employee','商業年間商品販売額（卸売業＋小売業）（従業者1人当たり）','商業年間商品販売額（卸売業＋小売業）（従業者1人当たり）',0,'2025-11-02 03:17:13','2025-11-02 03:17:13');
INSERT INTO "ranking_groups" VALUES('average-persons-per-general-household','一般世帯の平均人員','一般世帯の平均人員',0,'2025-11-02 03:17:13','2025-11-02 03:17:13');
INSERT INTO "ranking_groups" VALUES('average-relative-humidity','年平均相対湿度','年平均相対湿度',0,'2025-11-02 03:17:13','2025-11-02 03:17:13');
INSERT INTO "ranking_groups" VALUES('average-temperature','年平均気温','年平均気温',0,'2025-11-02 03:17:13','2025-11-02 03:17:13');
INSERT INTO "ranking_groups" VALUES('bank-deposit-balance-per-person','国内銀行預金残高（人口1人当たり）','国内銀行預金残高（人口1人当たり）',0,'2025-11-02 03:17:13','2025-11-02 03:17:13');
INSERT INTO "ranking_groups" VALUES('block-park-count-per-100km2','街区公園数（可住地面積100km2当たり）','街区公園数（可住地面積100km2当たり）',0,'2025-11-02 03:17:13','2025-11-02 03:17:13');
INSERT INTO "ranking_groups" VALUES('building-fire-count-per-100-thousand-people','火災出火件数（人口10万人当たり）','火災出火件数（人口10万人当たり）',0,'2025-11-02 03:17:13','2025-11-02 03:17:13');
INSERT INTO "ranking_groups" VALUES('city-gas-sales-volume','都市ガス販売量','都市ガス販売量',0,'2025-11-02 03:17:13','2025-11-02 03:17:13');
INSERT INTO "ranking_groups" VALUES('city-gas-supply-area-household-ratio','都市ガス供給区域内世帯比率','都市ガス供給区域内世帯比率',0,'2025-11-02 03:17:13','2025-11-02 03:17:13');
INSERT INTO "ranking_groups" VALUES('complainant-rate-per-1000','有訴者率（人口千人当たり）','有訴者率（人口千人当たり）',0,'2025-11-02 03:17:13','2025-11-02 03:17:13');
INSERT INTO "ranking_groups" VALUES('criminal-arrest-rate','刑法犯検挙率','刑法犯検挙率',0,'2025-11-02 03:17:13','2025-11-02 03:17:13');
INSERT INTO "ranking_groups" VALUES('criminal-recognition-count-of-serious-crime-rate','刑法犯認知件数に占める凶悪犯の割合','刑法犯認知件数に占める凶悪犯の割合',0,'2025-11-02 03:17:13','2025-11-02 03:17:13');
INSERT INTO "ranking_groups" VALUES('crude-birth-rate','粗出生率（人口千人当たり）','粗出生率（人口千人当たり）',0,'2025-11-02 03:17:13','2025-11-02 03:17:13');
INSERT INTO "ranking_groups" VALUES('crude-death-rate','粗死亡率（人口千人当たり）','粗死亡率（人口千人当たり）',0,'2025-11-02 03:17:13','2025-11-02 03:17:13');
INSERT INTO "ranking_groups" VALUES('cultivated-land-area-ratio','耕地面積比率','null',0,'2025-11-02 03:17:13','2025-11-02 03:17:13');
INSERT INTO "ranking_groups" VALUES('day-time-population-ratio','昼夜間人口比率','null',0,'2025-11-02 03:17:13','2025-11-02 03:17:13');
INSERT INTO "ranking_groups" VALUES('densely-inhabited-district-population-density','人口集中地区人口密度（人口集中地区面積１km2当たり）','null',0,'2025-11-02 03:17:13','2025-11-02 03:17:13');
INSERT INTO "ranking_groups" VALUES('densely-inhabited-district-population-ratio','人口集中地区人口比率','null',0,'2025-11-02 03:17:13','2025-11-02 03:17:13');
INSERT INTO "ranking_groups" VALUES('densely-populated-area-change-rate','人口集中地区面積の変化率','null',0,'2025-11-02 03:17:13','2025-11-02 03:17:13');
INSERT INTO "ranking_groups" VALUES('densely-populated-area-ratio','人口集中地区面積比率','null',0,'2025-11-02 03:17:13','2025-11-02 03:17:13');
INSERT INTO "ranking_groups" VALUES('dependent-population-index','従属人口指数','null',0,'2025-11-02 03:17:13','2025-11-02 03:17:13');
INSERT INTO "ranking_groups" VALUES('deposit-balance-per-person','預貯金残高（人口1人当たり）','null',0,'2025-11-02 03:17:13','2025-11-02 03:17:13');
INSERT INTO "ranking_groups" VALUES('divorces-per-total-population','離婚率（人口千人当たり）','null',0,'2025-11-02 03:17:13','2025-11-02 03:17:13');
INSERT INTO "ranking_groups" VALUES('dual-income-household-ratio','共働き世帯割合','null',0,'2025-11-02 03:17:13','2025-11-02 03:17:13');
INSERT INTO "ranking_groups" VALUES('electricity-generation-capacity','発電電力量','null',0,'2025-11-02 03:17:13','2025-11-02 03:17:13');
INSERT INTO "ranking_groups" VALUES('elementary-school-count-per-100k-6-11','小学校数（6～11歳人口10万人当たり）','null',0,'2025-11-02 03:17:13','2025-11-02 03:17:13');
INSERT INTO "ranking_groups" VALUES('elementary-school-students-per-teacher','小学校児童数（教員1人当たり）','null',0,'2025-11-02 03:17:13','2025-11-02 03:17:13');
INSERT INTO "ranking_groups" VALUES('employed-people-ratio','就業者比率','null',0,'2025-11-02 03:17:13','2025-11-02 03:17:13');
INSERT INTO "ranking_groups" VALUES('employee-ratio','雇用者比率','null',0,'2025-11-02 03:17:13','2025-11-02 03:17:13');
INSERT INTO "ranking_groups" VALUES('employment-insurance-receipt-rate','雇用保険受給率','null',0,'2025-11-02 03:17:13','2025-11-02 03:17:13');
INSERT INTO "ranking_groups" VALUES('total-population','総人口','null',0,'2025-11-02 03:17:13','2025-11-02 03:17:13');
CREATE TABLE ranking_group_subcategories (
  group_key TEXT NOT NULL,
  subcategory_id TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (group_key, subcategory_id),
  FOREIGN KEY (group_key) REFERENCES ranking_groups(group_key) ON DELETE CASCADE,
  FOREIGN KEY (subcategory_id) REFERENCES subcategories(subcategory_key) ON DELETE CASCADE
);
INSERT INTO "ranking_group_subcategories" VALUES('aging-index','population-composition',0,'2025-11-02 03:17:13');
INSERT INTO "ranking_group_subcategories" VALUES('agricultural-income-ratio','agricultural-household',0,'2025-11-02 03:17:13');
INSERT INTO "ranking_group_subcategories" VALUES('agricultural-output-per-employed-person','agricultural-household',0,'2025-11-02 03:17:13');
INSERT INTO "ranking_group_subcategories" VALUES('annual-precipitation','weather-climate',0,'2025-11-02 03:17:13');
INSERT INTO "ranking_group_subcategories" VALUES('annual-sales-amount-per-employee','commerce-service-industry',0,'2025-11-02 03:17:13');
INSERT INTO "ranking_group_subcategories" VALUES('average-persons-per-general-household','households',0,'2025-11-02 03:17:13');
INSERT INTO "ranking_group_subcategories" VALUES('average-relative-humidity','weather-climate',0,'2025-11-02 03:17:13');
INSERT INTO "ranking_group_subcategories" VALUES('average-temperature','weather-climate',0,'2025-11-02 03:17:13');
INSERT INTO "ranking_group_subcategories" VALUES('bank-deposit-balance-per-person','household-economy',0,'2025-11-02 03:17:13');
INSERT INTO "ranking_group_subcategories" VALUES('block-park-count-per-100km2','land-area',0,'2025-11-02 03:17:13');
INSERT INTO "ranking_group_subcategories" VALUES('building-fire-count-per-100-thousand-people','fire-insurance',0,'2025-11-02 03:17:13');
INSERT INTO "ranking_group_subcategories" VALUES('building-fire-count-per-100-thousand-people','basic-population',1,'2025-11-02 03:17:13');
INSERT INTO "ranking_group_subcategories" VALUES('city-gas-sales-volume','infrastructure-energy',0,'2025-11-02 03:17:13');
INSERT INTO "ranking_group_subcategories" VALUES('city-gas-supply-area-household-ratio','infrastructure-energy',0,'2025-11-02 03:17:13');
INSERT INTO "ranking_group_subcategories" VALUES('complainant-rate-per-1000','health-care',0,'2025-11-02 03:17:13');
INSERT INTO "ranking_group_subcategories" VALUES('criminal-arrest-rate','police-crime',0,'2025-11-02 03:17:13');
INSERT INTO "ranking_group_subcategories" VALUES('criminal-recognition-count-of-serious-crime-rate','police-crime',0,'2025-11-02 03:17:13');
INSERT INTO "ranking_group_subcategories" VALUES('crude-birth-rate','birth-death',0,'2025-11-02 03:17:13');
INSERT INTO "ranking_group_subcategories" VALUES('crude-death-rate','birth-death',0,'2025-11-02 03:17:13');
INSERT INTO "ranking_group_subcategories" VALUES('cultivated-land-area-ratio','uncategorized',0,'2025-11-02 03:17:13');
INSERT INTO "ranking_group_subcategories" VALUES('day-time-population-ratio','uncategorized',0,'2025-11-02 03:17:13');
INSERT INTO "ranking_group_subcategories" VALUES('densely-inhabited-district-population-density','uncategorized',0,'2025-11-02 03:17:13');
INSERT INTO "ranking_group_subcategories" VALUES('densely-inhabited-district-population-ratio','uncategorized',0,'2025-11-02 03:17:13');
INSERT INTO "ranking_group_subcategories" VALUES('densely-populated-area-change-rate','uncategorized',0,'2025-11-02 03:17:13');
INSERT INTO "ranking_group_subcategories" VALUES('densely-populated-area-ratio','uncategorized',0,'2025-11-02 03:17:13');
INSERT INTO "ranking_group_subcategories" VALUES('dependent-population-index','uncategorized',0,'2025-11-02 03:17:13');
INSERT INTO "ranking_group_subcategories" VALUES('deposit-balance-per-person','uncategorized',0,'2025-11-02 03:17:13');
INSERT INTO "ranking_group_subcategories" VALUES('divorces-per-total-population','uncategorized',0,'2025-11-02 03:17:13');
INSERT INTO "ranking_group_subcategories" VALUES('dual-income-household-ratio','uncategorized',0,'2025-11-02 03:17:13');
INSERT INTO "ranking_group_subcategories" VALUES('electricity-generation-capacity','uncategorized',0,'2025-11-02 03:17:13');
INSERT INTO "ranking_group_subcategories" VALUES('elementary-school-count-per-100k-6-11','uncategorized',0,'2025-11-02 03:17:13');
INSERT INTO "ranking_group_subcategories" VALUES('elementary-school-students-per-teacher','uncategorized',0,'2025-11-02 03:17:13');
INSERT INTO "ranking_group_subcategories" VALUES('employed-people-ratio','uncategorized',0,'2025-11-02 03:17:13');
INSERT INTO "ranking_group_subcategories" VALUES('employee-ratio','uncategorized',0,'2025-11-02 03:17:13');
INSERT INTO "ranking_group_subcategories" VALUES('employment-insurance-receipt-rate','uncategorized',0,'2025-11-02 03:17:13');
INSERT INTO "ranking_group_subcategories" VALUES('total-population','uncategorized',0,'2025-11-02 03:17:13');
CREATE TABLE dashboard_configs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subcategory_id TEXT NOT NULL,
  area_type TEXT NOT NULL CHECK(area_type IN ('national', 'prefecture')),
  layout_type TEXT NOT NULL DEFAULT 'grid' CHECK(layout_type IN ('grid', 'stacked', 'custom')),
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(subcategory_id, area_type)
);
INSERT INTO "dashboard_configs" VALUES(1,'land-area','national','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(2,'land-area','prefecture','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(3,'land-use','national','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(4,'land-use','prefecture','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(5,'natural-environment','national','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(6,'natural-environment','prefecture','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(7,'weather-climate','national','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(8,'weather-climate','prefecture','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(9,'basic-population','national','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(10,'basic-population','prefecture','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(11,'population-movement','national','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(12,'population-movement','prefecture','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(13,'population-composition','national','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(14,'population-composition','prefecture','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(15,'marriage','national','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(16,'marriage','prefecture','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(17,'households','national','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(18,'households','prefecture','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(19,'birth-death','national','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(20,'birth-death','prefecture','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(21,'wages-working-conditions','national','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(22,'wages-working-conditions','prefecture','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(23,'labor-force-structure','national','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(24,'labor-force-structure','prefecture','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(25,'industrial-structure','national','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(26,'industrial-structure','prefecture','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(27,'commuting-employment','national','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(28,'commuting-employment','prefecture','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(29,'labor-disputes','national','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(30,'labor-disputes','prefecture','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(31,'job-seeking-placement','national','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(32,'job-seeking-placement','prefecture','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(33,'industry-occupation','national','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(34,'industry-occupation','prefecture','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(35,'employment-type','national','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(36,'employment-type','prefecture','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(37,'agricultural-household','national','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(38,'agricultural-household','prefecture','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(39,'manufacturing','national','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(40,'manufacturing','prefecture','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(41,'commerce-service-industry','national','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(42,'commerce-service-industry','prefecture','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(43,'commercial-facilities','national','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(44,'commercial-facilities','prefecture','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(45,'worker-household-income','national','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(46,'worker-household-income','prefecture','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(47,'household-economy','national','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(48,'household-economy','prefecture','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(49,'business-scale','national','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(50,'business-scale','prefecture','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(51,'business-activity','national','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(52,'business-activity','prefecture','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(53,'gross-product-economic-indicators','national','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(54,'gross-product-economic-indicators','prefecture','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(55,'consumer-price-difference-index','national','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(56,'consumer-price-difference-index','prefecture','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(57,'living-environment','national','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(58,'living-environment','prefecture','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(59,'housing-ownership','national','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(60,'housing-ownership','prefecture','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(61,'housing-structure','national','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(62,'housing-structure','prefecture','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(63,'housing-facilities','national','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(64,'housing-facilities','prefecture','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(65,'construction-manufacturing','national','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(66,'construction-manufacturing','prefecture','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(67,'welfare-facilities','national','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(68,'welfare-facilities','prefecture','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(69,'housing-statistics','national','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(70,'housing-statistics','prefecture','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(71,'water-supply-sewerage','national','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(72,'water-supply-sewerage','prefecture','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(73,'waste-management','national','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(74,'waste-management','prefecture','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(75,'industrial-water','national','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(76,'industrial-water','prefecture','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(77,'infrastructure-energy','national','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(78,'infrastructure-energy','prefecture','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(79,'tourism-accommodation','national','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(80,'tourism-accommodation','prefecture','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(81,'kindergarten','national','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(82,'kindergarten','prefecture','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(83,'elementary-school','national','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(84,'elementary-school','prefecture','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(85,'junior-high-school','national','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(86,'junior-high-school','prefecture','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(87,'high-school','national','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(88,'high-school','prefecture','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(89,'college-university','national','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(90,'college-university','prefecture','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(91,'cultural-facilities','national','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(92,'cultural-facilities','prefecture','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(93,'sports-facilities','national','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(94,'sports-facilities','prefecture','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(95,'social-activities','national','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(96,'social-activities','prefecture','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(97,'childcare-early-education','national','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(98,'childcare-early-education','prefecture','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(99,'compulsory-education','national','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(100,'compulsory-education','prefecture','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(101,'fiscal-indicators','national','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(102,'fiscal-indicators','prefecture','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(103,'staff-assembly-election','national','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(104,'staff-assembly-election','prefecture','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(105,'tax-revenue','national','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(106,'tax-revenue','prefecture','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(107,'investment','national','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(108,'investment','prefecture','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(109,'revenue','national','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(110,'revenue','prefecture','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(111,'expenditure','national','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(112,'expenditure','prefecture','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(113,'fire-emergency','national','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(114,'fire-emergency','prefecture','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(115,'fire-insurance','national','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(116,'fire-insurance','prefecture','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(117,'police-crime','national','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(118,'police-crime','prefecture','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(119,'traffic-accidents','national','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(120,'traffic-accidents','prefecture','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(121,'pollution-environment','national','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(122,'pollution-environment','prefecture','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(123,'card','national','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(124,'card','prefecture','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(125,'death-statistics','national','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(126,'death-statistics','prefecture','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(127,'public-assistance-welfare','national','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(128,'public-assistance-welfare','prefecture','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(129,'health-care','national','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(130,'health-care','prefecture','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(131,'foreign-population','national','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(132,'foreign-population','prefecture','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(133,'foreigners','national','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(134,'foreigners','prefecture','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(135,'roads','national','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
INSERT INTO "dashboard_configs" VALUES(136,'roads','prefecture','grid',1,1,'2025-11-02 03:17:15','2025-11-02 03:17:15');
CREATE TABLE dashboard_widgets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dashboard_config_id INTEGER NOT NULL,
  widget_type TEXT NOT NULL CHECK(widget_type IN ('metric', 'line-chart', 'bar-chart', 'area-chart', 'table')),
  widget_key TEXT NOT NULL,
  title TEXT NOT NULL,
  config TEXT,
  data_source_type TEXT NOT NULL CHECK(data_source_type IN ('ranking', 'estat', 'mock', 'custom')),
  data_source_key TEXT NOT NULL,
  grid_col_span INTEGER NOT NULL DEFAULT 1,
  grid_row_span INTEGER NOT NULL DEFAULT 1,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dashboard_config_id) REFERENCES dashboard_configs(id) ON DELETE CASCADE,
  UNIQUE(dashboard_config_id, widget_key)
);
CREATE TABLE widget_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  widget_type TEXT NOT NULL,
  default_config TEXT,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "widget_templates" VALUES(1,'metric-default','デフォルトメトリックカード','metric','{"size": "large"}',NULL,'2025-11-02 03:17:14','2025-11-02 03:17:14');
INSERT INTO "widget_templates" VALUES(2,'metric-small','小メトリックカード','metric','{"size": "small"}',NULL,'2025-11-02 03:17:14','2025-11-02 03:17:14');
INSERT INTO "widget_templates" VALUES(3,'line-default','デフォルト折れ線グラフ','line-chart','{"height": 300}',NULL,'2025-11-02 03:17:14','2025-11-02 03:17:14');
INSERT INTO "widget_templates" VALUES(4,'line-tall','高折れ線グラフ','line-chart','{"height": 400}',NULL,'2025-11-02 03:17:14','2025-11-02 03:17:14');
INSERT INTO "widget_templates" VALUES(5,'bar-default','デフォルト棒グラフ','bar-chart','{"height": 300}',NULL,'2025-11-02 03:17:14','2025-11-02 03:17:14');
INSERT INTO "widget_templates" VALUES(6,'bar-wide','広棒グラフ','bar-chart','{"height": 300, "horizontal": true}',NULL,'2025-11-02 03:17:14','2025-11-02 03:17:14');
INSERT INTO "widget_templates" VALUES(7,'area-default','デフォルトエリアチャート','area-chart','{"height": 300}',NULL,'2025-11-02 03:17:14','2025-11-02 03:17:14');
INSERT INTO "widget_templates" VALUES(8,'area-stacked','積層エリアチャート','area-chart','{"height": 300, "stacked": true}',NULL,'2025-11-02 03:17:14','2025-11-02 03:17:14');
CREATE TABLE d1_migrations(
		id         INTEGER PRIMARY KEY AUTOINCREMENT,
		name       TEXT UNIQUE,
		applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
DELETE FROM sqlite_sequence;
INSERT INTO "sqlite_sequence" VALUES('widget_templates',8);
INSERT INTO "sqlite_sequence" VALUES('dashboard_configs',136);
CREATE INDEX idx_categories_display_order ON categories(display_order);
CREATE INDEX idx_subcategories_category_key ON subcategories(category_key);
CREATE INDEX idx_subcategories_display_order ON subcategories(display_order);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE UNIQUE INDEX idx_accounts_provider ON accounts(provider, providerAccountId);
CREATE INDEX idx_sessions_userId ON sessions(userId);
CREATE INDEX idx_sessions_sessionToken ON sessions(sessionToken);
CREATE INDEX idx_estat_metainfo_stat_name ON estat_metainfo(stat_name);
CREATE INDEX idx_estat_metainfo_title ON estat_metainfo(title);
CREATE INDEX idx_estat_metainfo_area_type ON estat_metainfo(area_type);
CREATE INDEX idx_estat_metainfo_updated_at ON estat_metainfo(updated_at);
CREATE INDEX idx_estat_ranking_mappings_stats_data_id ON estat_ranking_mappings(stats_data_id);
CREATE INDEX idx_estat_ranking_mappings_is_ranking ON estat_ranking_mappings(is_ranking);
CREATE INDEX idx_estat_ranking_mappings_item_code ON estat_ranking_mappings(item_code);
CREATE INDEX idx_estat_ranking_mappings_area_type ON estat_ranking_mappings(area_type);
CREATE INDEX idx_ranking_items_active ON ranking_items(is_active);
CREATE INDEX idx_ranking_items_group_key ON ranking_items(group_key);
CREATE INDEX idx_ranking_items_area_type ON ranking_items(area_type);
CREATE INDEX idx_ranking_group_subcategories_group ON ranking_group_subcategories(group_key);
CREATE INDEX idx_ranking_group_subcategories_subcategory ON ranking_group_subcategories(subcategory_id);
CREATE INDEX idx_ranking_group_subcategories_display_order ON ranking_group_subcategories(subcategory_id, display_order);
CREATE INDEX idx_dashboard_configs_subcategory ON dashboard_configs(subcategory_id, area_type);
CREATE INDEX idx_dashboard_configs_active ON dashboard_configs(is_active);
CREATE INDEX idx_dashboard_widgets_config ON dashboard_widgets(dashboard_config_id);
CREATE INDEX idx_dashboard_widgets_order ON dashboard_widgets(dashboard_config_id, display_order);
CREATE INDEX idx_dashboard_widgets_visible ON dashboard_widgets(is_visible);
CREATE INDEX idx_widget_templates_key ON widget_templates(template_key);
CREATE INDEX idx_widget_templates_type ON widget_templates(widget_type);
CREATE VIEW v_estat_metainfo_summary AS
SELECT 
  area_type,
  COUNT(*) as count,
  MAX(updated_at) as last_updated
FROM estat_metainfo
GROUP BY area_type;
CREATE VIEW v_user_activity AS
SELECT 
  u.username,
  u.email,
  u.last_login,
  0 as action_count
FROM users u
GROUP BY u.id, u.username, u.email, u.last_login
ORDER BY u.last_login DESC;