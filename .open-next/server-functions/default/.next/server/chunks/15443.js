"use strict";exports.id=15443,exports.ids=[15443],exports.modules={15443:(a,b,c)=>{c.d(b,{P:()=>j});var d=c(77684);function e(){return{environment:function(){let a=process.env.NEXT_PUBLIC_ENV||"production";return"production"===a||"staging"===a||"development"===a?a:"development"}()}}process.env.MOCK_DATA_PATH;var f=c(76099);function g(a){return{rankingKey:a.ranking_key,areaType:a.area_type||"prefecture",label:a.label,name:a.ranking_name,annotation:a.annotation,unit:a.unit,mapColorScheme:a.map_color_scheme,mapDivergingMidpoint:a.map_diverging_midpoint,rankingDirection:a.ranking_direction,conversionFactor:a.conversion_factor,decimalPlaces:a.decimal_places,isActive:a.is_active,groupKey:a.group_key||void 0,displayOrderInGroup:a.display_order_in_group}}let h={getRankingItemsBySubcategory:`
    SELECT 
      rgs.subcategory_id,
      rg.group_key,
      rg.group_name,
      rg.label as group_label,
      rg.display_order as group_display_order,
      ri.ranking_key,
      ri.area_type,
      ri.label,
      ri.unit,
      ri.ranking_name,
      ri.is_active,
      ri.group_key,
      ri.display_order_in_group,
      ri.map_color_scheme,
      ri.map_diverging_midpoint,
      ri.ranking_direction,
      ri.conversion_factor,
      ri.decimal_places,
      ri.created_at,
      ri.updated_at,
      ri.annotation
    FROM ranking_group_subcategories rgs
    INNER JOIN ranking_groups rg ON rgs.group_key = rg.group_key
    LEFT JOIN ranking_items ri ON rg.group_key = ri.group_key AND ri.is_active = 1
    WHERE rgs.subcategory_id = ?
    ORDER BY rgs.display_order, rg.display_order, ri.display_order_in_group
  `,getRankingItemById:`
    SELECT * FROM ranking_items WHERE ranking_key = ?
  `,getRankingItemByKey:`
    SELECT * FROM ranking_items WHERE ranking_key = ? AND is_active = 1
  `,updateRankingItem:`
    UPDATE ranking_items 
    SET 
      label = ?,
      ranking_name = ?,
      annotation = ?,
      unit = ?,
      is_active = ?,
      map_color_scheme = ?,
      map_diverging_midpoint = ?,
      ranking_direction = ?,
      conversion_factor = ?,
      decimal_places = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE ranking_key = ? AND area_type = ?
  `,deleteRankingItem:`
    UPDATE ranking_items 
    SET 
      is_active = 0,
      updated_at = CURRENT_TIMESTAMP
    WHERE ranking_key = ? AND area_type = ?
  `,updateRankingItemOrder:`
    UPDATE ranking_items 
    SET 
      display_order_in_group = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE ranking_key = ? AND area_type = ?
  `,updateRankingItemGroup:`
    UPDATE ranking_items 
    SET 
      group_key = ?,
      display_order_in_group = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE ranking_key = ? AND area_type = ?
  `},i={getAllGroups:`
    SELECT 
      rg.*,
      COUNT(ri.ranking_key) as item_count
    FROM ranking_groups rg
    LEFT JOIN ranking_items ri ON rg.group_key = ri.group_key AND ri.is_active = 1
    GROUP BY rg.group_key
    ORDER BY rg.display_order
  `,getGroupByKey:`
    SELECT * FROM ranking_groups WHERE group_key = ?
  `,createGroup:`
    INSERT INTO ranking_groups 
    (group_key, group_name, label, display_order)
    VALUES (?, ?, ?, ?)
  `,updateGroup:`
    UPDATE ranking_groups 
    SET 
      group_name = ?, 
      label = ?,
      display_order = ?, 
      updated_at = CURRENT_TIMESTAMP
    WHERE group_key = ?
  `,deleteGroup:`
    DELETE FROM ranking_groups WHERE group_key = ?
  `,updateGroupOrder:`
    UPDATE ranking_groups SET display_order = ? WHERE group_key = ?
  `,assignItemToGroup:`
    UPDATE ranking_items 
    SET 
      group_key = ?, 
      display_order_in_group = ?, 
      updated_at = CURRENT_TIMESTAMP
    WHERE ranking_key = ?
  `,removeItemFromGroup:`
    UPDATE ranking_items 
    SET 
      group_key = NULL, 
      display_order_in_group = 0, 
      updated_at = CURRENT_TIMESTAMP
    WHERE ranking_key = ?
  `,getGroupSubcategories:`
    SELECT * FROM ranking_group_subcategories
    WHERE group_key = ?
    ORDER BY display_order, created_at
  `,addSubcategoryToGroup:`
    INSERT INTO ranking_group_subcategories
    (group_key, subcategory_id, display_order)
    VALUES (?, ?, ?)
    ON CONFLICT(group_key, subcategory_id) DO NOTHING
  `,removeSubcategoryFromGroup:`
    DELETE FROM ranking_group_subcategories
    WHERE group_key = ? AND subcategory_id = ?
  `,deleteAllGroupSubcategories:`
    DELETE FROM ranking_group_subcategories
    WHERE group_key = ?
  `};class j{constructor(a){this.db=a}static async create(){let a=e();return console.log(`[${a.environment}] Creating RankingRepository with database provider`),new j((0,f.qK)())}async fetchRankingItems(a){let b=e(),{limit:c=10}=a||{};try{return console.log(`[${b.environment}] Fetching ranking items from database...`),(await this.db.prepare(`SELECT * FROM ranking_items LIMIT ${c}`).all()).results}catch(a){return console.error("Failed to fetch ranking items:",a),[]}}async fetchRankingValues(a){return console.warn("[DEPRECATED] fetchRankingValues() は使用されません。R2 ストレージを使用してください。"),[]}async getRankingItemsBySubcategory(a){try{let b=await (0,d.OR)(a);if(!b)return null;let c={id:b.subcategoryKey,categoryId:b.categoryKey,name:b.subcategoryName,subcategoryName:b.subcategoryKey,categoryName:b.categoryKey,defaultRankingKey:""},e=await this.db.prepare(h.getRankingItemsBySubcategory).bind(a).all();if(!e.success)throw Error("Database query failed");let f=e.results;if(0===f.length)return null;let i=f.find(a=>1===a.is_default),j=i?.ranking_key||f[0]?.ranking_key,k={id:c.id,categoryId:c.categoryId,name:c.name,description:c.description,defaultRankingKey:j||""},l=f.filter(a=>a.ranking_key).map(a=>{let b={ranking_key:a.ranking_key,area_type:a.area_type||"prefecture",label:a.label,ranking_name:a.ranking_name,annotation:a.annotation,unit:a.unit,map_color_scheme:a.map_color_scheme,map_diverging_midpoint:a.map_diverging_midpoint,ranking_direction:a.ranking_direction,conversion_factor:a.conversion_factor,decimal_places:a.decimal_places,is_active:a.is_active,group_key:a.group_key||null,display_order_in_group:a.display_order_in_group||0,created_at:a.created_at,updated_at:a.updated_at};return g(b)});return{subcategory:k,rankingItems:l}}catch(a){throw console.error("Failed to get ranking items by subcategory:",a),a}}async getRankingItemByKeyAndAreaType(a,b){try{let c=await this.db.prepare(`SELECT * FROM ranking_items 
          WHERE ranking_key = ? AND area_type = ? AND is_active = 1`).bind(a,b).first();if(!c)return null;return g(c)}catch(a){throw console.error("Failed to get ranking item by key and area type:",a),a}}async getRankingItemByKey(a){try{let b=await this.db.prepare(`SELECT * FROM ranking_items 
          WHERE ranking_key = ? AND is_active = 1
          ORDER BY 
            CASE area_type 
              WHEN 'prefecture' THEN 1
              WHEN 'city' THEN 2
              WHEN 'national' THEN 3
            END
          LIMIT 1`).bind(a).first();if(!b)return null;return g(b)}catch(a){throw console.error("Failed to get ranking item by key:",a),a}}async updateRankingItem(a,b,c){try{let d=[],e=[];if(void 0!==c.label&&(d.push("label = ?"),e.push(c.label)),void 0!==c.name&&(d.push("ranking_name = ?"),e.push(c.name)),void 0!==c.annotation&&(d.push("annotation = ?"),e.push(c.annotation||null)),void 0!==c.unit&&(d.push("unit = ?"),e.push(c.unit)),void 0!==c.isActive&&(d.push("is_active = ?"),e.push(+!!c.isActive)),void 0!==c.mapColorScheme&&(d.push("map_color_scheme = ?"),e.push(c.mapColorScheme)),void 0!==c.mapDivergingMidpoint&&(d.push("map_diverging_midpoint = ?"),e.push(c.mapDivergingMidpoint)),void 0!==c.rankingDirection&&(d.push("ranking_direction = ?"),e.push(c.rankingDirection)),void 0!==c.conversionFactor&&(d.push("conversion_factor = ?"),e.push(c.conversionFactor)),void 0!==c.decimalPlaces&&(d.push("decimal_places = ?"),e.push(c.decimalPlaces)),0===d.length)throw Error("No fields to update");d.push("updated_at = CURRENT_TIMESTAMP");let f=`
        UPDATE ranking_items
        SET ${d.join(", ")}
        WHERE ranking_key = ? AND area_type = ?
      `;return e.push(a,b),(await this.db.prepare(f).bind(...e).run()).success}catch(a){throw console.error("Failed to update ranking item:",a),a}}async deleteRankingItem(a,b){try{return(await this.db.prepare(h.deleteRankingItem).bind(a,b).run()).success}catch(a){throw console.error("Failed to delete ranking item:",a),a}}async updateRankingItemOrder(a,b,c){try{return(await this.db.prepare(h.updateRankingItemOrder).bind(c,a,b).run()).success}catch(a){throw console.error("Failed to update ranking item order:",a),a}}async getRankingGroupsBySubcategory(a){try{let b=await (0,d.OR)(a);if(!b)return console.error(`[RankingRepository] サブカテゴリが見つかりません: ${a}`),null;console.log(`[RankingRepository] サブカテゴリが見つかりました:`,{subcategoryId:a,foundSubcategory:b}),console.log(`[RankingRepository] データベースクエリを実行: subcategoryId=${a}`);let c=await this.db.prepare(`
          SELECT DISTINCT rg.*
          FROM ranking_groups rg
          INNER JOIN ranking_group_subcategories rgs ON rg.group_key = rgs.group_key
          WHERE rgs.subcategory_id = ?
          ORDER BY rgs.display_order, rg.display_order
        `).bind(a).all();console.log(`[RankingRepository] グループ取得結果:`,{count:c.results?.length||0,groups:c.results});let e=[];for(let a of c.results){let b=((await this.db.prepare(`
            SELECT ri.*
            FROM ranking_items ri
            WHERE ri.group_key = ? AND ri.is_active = 1
            ORDER BY ri.display_order_in_group
          `).bind(a.group_key).all()).results||[]).map(a=>g(a)).filter(a=>null!==a),c=await this.getGroupSubcategories(a.group_key);e.push({groupKey:a.group_key,subcategoryIds:c,name:a.group_name,label:a.label||void 0,displayOrder:a.display_order,items:b})}let f=((await this.db.prepare(`
          SELECT ri.*
          FROM ranking_items ri
          WHERE ri.group_key IS NULL AND ri.is_active = 1
          ORDER BY ri.display_order_in_group
        `).bind().all()).results||[]).map(a=>g(a)).filter(a=>null!==a);return{subcategory:b,groups:e,ungroupedItems:f}}catch(a){throw console.error("Failed to get ranking groups by subcategory:",a),a}}async getAllRankingItems(){try{return((await this.db.prepare(`
          SELECT * FROM ranking_items
          ORDER BY created_at DESC
        `).all()).results||[]).map(a=>g(a)).filter(a=>null!==a)}catch(a){throw console.error("Failed to get all ranking items:",a),a}}async getRankingItemById(a){return this.getRankingItemByKey(String(a))}async createRankingItem(a){try{let b=await this.db.prepare(`
          INSERT INTO ranking_items 
          (
            ranking_key, area_type, label, ranking_name, annotation, unit,
            map_color_scheme, map_diverging_midpoint, ranking_direction,
            conversion_factor, decimal_places, is_active,
            created_at, updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          RETURNING *
        `).bind(a.rankingKey,a.areaType,a.label,a.ranking_name,a.annotation||null,a.unit,a.mapColorScheme,a.mapDivergingMidpoint,a.rankingDirection,a.conversionFactor,a.decimalPlaces).first();if(!b)throw Error("Failed to create ranking item");return g(b)}catch(a){throw console.error("Failed to create ranking item:",a),a}}async getGroupSubcategories(a){try{return((await this.db.prepare(i.getGroupSubcategories).bind(a).all()).results||[]).map(a=>a.subcategory_id)}catch(b){return console.error(`Failed to get subcategories for group ${a}:`,b),[]}}async getAllRankingGroups(){try{let a=await this.db.prepare(i.getAllGroups).all(),b=(await this.getAllRankingItems()).filter(a=>a.groupKey);return await Promise.all((a.results||[]).map(async a=>{let c=b.filter(b=>b.groupKey===a.group_key),d=await this.getGroupSubcategories(a.group_key);return{groupKey:a.group_key,subcategoryIds:d,name:a.group_name,label:a.label||void 0,displayOrder:a.display_order,items:c.sort((a,b)=>(a.displayOrderInGroup||0)-(b.displayOrderInGroup||0))}}))}catch(a){throw console.error("Failed to get all ranking groups:",a),a}}async getRankingGroupByKey(a){try{let b=await this.db.prepare(i.getGroupByKey).bind(a).first();if(!b)return null;let c=(await this.getAllRankingItems()).filter(b=>b.groupKey===a).sort((a,b)=>(a.displayOrderInGroup||0)-(b.displayOrderInGroup||0)),d=await this.getGroupSubcategories(a);return{groupKey:b.group_key,subcategoryIds:d,name:b.group_name,label:b.label||void 0,displayOrder:b.display_order,items:c}}catch(a){throw console.error("Failed to get ranking group by key:",a),a}}async createRankingGroup(a){try{if(await this.db.prepare(i.createGroup).bind(a.groupKey,a.group_name,a.label||null,a.displayOrder).run(),a.subcategoryIds&&a.subcategoryIds.length>0)for(let b=0;b<a.subcategoryIds.length;b++){let c=a.subcategoryIds[b];await this.db.prepare(i.addSubcategoryToGroup).bind(a.groupKey,c,b).run()}return a.groupKey}catch(a){throw console.error("Failed to create ranking group:",a),a}}async updateRankingGroup(a,b){try{let c=await this.getRankingGroupByKey(a);if(!c)throw Error("Ranking group not found");if(await this.db.prepare(i.updateGroup).bind(b.group_name??c.name,b.label??c.label??null,b.displayOrder??c.displayOrder,a).run(),void 0!==b.subcategoryIds&&(await this.db.prepare(i.deleteAllGroupSubcategories).bind(a).run(),b.subcategoryIds.length>0))for(let c=0;c<b.subcategoryIds.length;c++){let d=b.subcategoryIds[c];await this.db.prepare(i.addSubcategoryToGroup).bind(a,d,c).run()}}catch(a){throw console.error("Failed to update ranking group:",a),a}}async deleteRankingGroup(a){try{await this.db.prepare(`UPDATE ranking_items 
           SET group_key = NULL, display_order_in_group = 0, updated_at = CURRENT_TIMESTAMP
           WHERE group_key = ?`).bind(a).run(),await this.db.prepare(i.deleteGroup).bind(a).run()}catch(a){throw console.error("Failed to delete ranking group:",a),a}}async updateGroupDisplayOrder(a,b){try{await this.db.prepare(i.updateGroupOrder).bind(b,a).run()}catch(a){throw console.error("Failed to update group display order:",a),a}}async assignItemsToGroup(a,b,c){try{for(let d=0;d<b.length;d++)await this.db.prepare(i.assignItemToGroup).bind(a,c[d],b[d]).run()}catch(a){throw console.error("Failed to assign items to group:",a),a}}async removeItemsFromGroup(a){try{for(let b of a)await this.db.prepare(i.removeItemFromGroup).bind(b).run()}catch(a){throw console.error("Failed to remove items from group:",a),a}}async updateItemDisplayOrderInGroup(a,b,c){try{await this.db.prepare(h.updateRankingItemOrder).bind(c,a,b).run()}catch(a){throw console.error("Failed to update item display order in group:",a),a}}}}};