"use client";
import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { fetchPrefectureTopology } from "@/features/gis/geoshape/services/geoshape-service";
import { convertTopoJsonToGeoJson } from "@/features/gis/geoshape/utils/topojson-converter";

interface PrefectureMapProps {
  areaCode: string; // 例: "02000"（青森県）
  width?: number;
  height?: number;
}

export const PrefectureMap: React.FC<PrefectureMapProps> = ({ areaCode, width = 400, height = 400 }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [objectKeys, setObjectKeys] = useState<string[]>([]);
  const [featureCount, setFeatureCount] = useState<number>(0);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    
    async function drawMap() {
      try {
        const prefCode2 = areaCode.substring(0, 2);
        const isNational = areaCode === "00000";
        const topojson = await fetchPrefectureTopology();
        const keys = Object.keys(topojson.objects || {});
        setObjectKeys(keys);
        const objectKey = keys[0];
        // GeoJSON化
        const geojson = convertTopoJsonToGeoJson(topojson, objectKey);
        let features: any[] = [];
        if (Array.isArray(geojson.features)) {
          features = isNational 
            ? geojson.features 
            : geojson.features.filter((f:any)=>f?.properties?.N03_007 === prefCode2);
        }
        const hasFeatures = Array.isArray(features) && features.length > 0;
        setFeatureCount(hasFeatures ? features.length : 0);
        setDebugInfo(hasFeatures ? features[0]?.properties : null);

        if (!hasFeatures) {
          setError(`${isNational ? "全国地物" : `都道府県コード: ${prefCode2}`} に該当するfeatureが見つかりません (sampleProps=${JSON.stringify(geojson.features?.[0]?.properties)})`);
          setLoading(false);
          return;
        }
        if (cancelled) return;
        // d3: 描画
        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const geo = { ...geojson, features };
        const proj = d3.geoMercator().fitSize([width, height], geo);
        const pathGen = d3.geoPath().projection(proj);

        svg
          .selectAll("path")
          .data(features)
          .enter()
          .append("path")
          .attr("d", pathGen)
          .attr("fill", "#aee")
          .attr("stroke", "#333");

        setLoading(false);
      } catch (e: any) {
        if (!cancelled) {
          setError(e.message || "地図データの取得・描画に失敗しました");
          setLoading(false);
        }
      }
    }
    drawMap();
    return () => { cancelled = true; };
  }, [areaCode, width, height]);

  if (loading) return <div>地図読み込み中...</div>;
  if (error) return (
    <div style={{color:'red'}}>
      地図エラー: {error} <br/>
      <small>objectKeys: [{objectKeys.join(", ")}] featureCount: {featureCount} <br/> debugProps: {debugInfo ? JSON.stringify(debugInfo) : "null"}</small>
    </div>
  );

  // features(地図地物)がある場合だけSVG描画
  const hasFeatures = featureCount > 0 && debugInfo;
  return (
    <div>
      {hasFeatures ? (
        <svg ref={svgRef} width={width} height={height} aria-label="都道府県地図" role="img" />
      ) : (
        <div style={{color:'red'}}>地図データがありません</div>
      )}
      <div style={{fontSize:'10px',color:'#888'}}>objectKeys: [{objectKeys.join(", ")}] featureCount: {featureCount} <br/> debugProps: {debugInfo ? JSON.stringify(debugInfo) : "null"}</div>
    </div>
  );
};
