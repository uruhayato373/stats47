#!/usr/bin/env python3
"""
全てのサブカテゴリのダッシュボードコンポーネントを生成
"""

import json
import os
from pathlib import Path

def subcategory_to_component_name(subcategory: str) -> str:
    """サブカテゴリIDをコンポーネント名に変換"""
    return ''.join(word.capitalize() for word in subcategory.split('-'))

def create_dashboard_component(
    category_id: str,
    subcategory_id: str,
    subcategory_name: str,
    component_type: str,
    category_name: str
) -> tuple[str, str, str]:
    """ダッシュボードコンポーネントの内容を生成"""
    component_name = subcategory_to_component_name(subcategory_id) + component_type
    
    level_name_map = {
        'NationalDashboard': ('全国', '全国レベル'),
        'PrefectureDashboard': ('都道府県', '都道府県レベル'),
        'CityDashboard': ('市区町村', '市区町村レベル'),
    }
    level_name, level_desc = level_name_map[component_type]
    
    code_display = ''
    newline = '\n'
    if component_type == 'PrefectureDashboard':
        code_display = '          <p className="text-muted-foreground">' + newline + '            都道府県コード: {areaCode}' + newline + '          </p>'
    elif component_type == 'CityDashboard':
        code_display = '          <p className="text-muted-foreground">' + newline + '            市区町村コード: {areaCode}' + newline + '          </p>'
    
    data_func_prefix = 'National' if component_type == 'NationalDashboard' else 'Prefecture' if component_type == 'PrefectureDashboard' else 'City'
    data_func_name = f'get{data_func_prefix}{subcategory_to_component_name(subcategory_id)}Data'
    
    content_parts = [
        f'/**',
        f' * {category_name} > {subcategory_name} > {level_name}ダッシュボード',
        f' * {level_desc}の{subcategory_name}統計を表示',
        f' */',
        '',
        'import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/ui/card";',
        '',
        'import { DashboardLayout } from "../../shared/DashboardLayout";',
        '',
        'import type { DashboardProps } from "../../../types/dashboard";',
        '',
        f'/**',
        f' * {subcategory_name}{level_name}ダッシュボード',
        f' */',
        f'export async function {component_name}(' + '{',
        '  category,',
        '  subcategory,',
        '  areaCode,',
        '  areaType,',
        '  areaLevel,',
        '}: DashboardProps) {',
        f'  // TODO: 実際のデータ取得処理を実装',
        f'  // const data = await {data_func_name}(areaCode);',
        '',
        '  return (',
        '    <DashboardLayout columns={12} gap="1rem">',
        '      <Card className="col-span-12">',
        '        <CardHeader>',
        f'          <CardTitle>{level_name}の{subcategory_name}</CardTitle>',
        '        </CardHeader>',
        '        <CardContent>',
    ]
    
    if code_display:
        content_parts.append(code_display)
    
    content_parts.extend([
        '          <p className="text-muted-foreground">',
        f'            {level_desc}の{subcategory_name}統計データを表示します。',
        '          </p>',
        '          {/* TODO: 実際のデータ表示を実装 */}',
        '        </CardContent>',
        '      </Card>',
        '    </DashboardLayout>',
        '  );',
        '}',
    ])
    
    content = '\n'.join(content_parts)
    return component_name, content

def main():
    """メイン処理"""
    # categories.jsonを読み込み
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    categories_path = project_root / 'src' / 'config' / 'categories.json'
    
    with open(categories_path, 'r', encoding='utf-8') as f:
        categories = json.load(f)
    
    base_dir = project_root / 'src' / 'features' / 'dashboard' / 'components'
    
    created_files = []
    index_exports = {}
    
    for category in categories:
        category_id = category['id']
        category_name = category['name']
        index_exports[category_id] = {}
        
        for subcategory in category['subcategories']:
            subcategory_id = subcategory['id']
            subcategory_name = subcategory['name']
            
            # land-areaは既に存在するのでスキップ
            if category_id == 'landweather' and subcategory_id == 'land-area':
                continue
            
            subcategory_dir = base_dir / category_id / subcategory_id
            subcategory_dir.mkdir(parents=True, exist_ok=True)
            
            components = []
            for component_type in ['NationalDashboard', 'PrefectureDashboard', 'CityDashboard']:
                component_name, content = create_dashboard_component(
                    category_id,
                    subcategory_id,
                    subcategory_name,
                    component_type,
                    category_name
                )
                
                file_path = subcategory_dir / f'{component_name}.tsx'
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                created_files.append(file_path)
                components.append(component_name)
            
            # index.tsを作成
            index_content = '\n'.join(
                f'export {{ {comp} }} from "./{comp}";'
                for comp in components
            ) + '\n'
            
            index_path = subcategory_dir / 'index.ts'
            with open(index_path, 'w', encoding='utf-8') as f:
                f.write(index_content)
            created_files.append(index_path)
            
            index_exports[category_id][subcategory_id] = components
    
    print(f'✅ {len(created_files)} 個のファイルを作成しました')
    print(f'\n作成されたファイル数: {len(created_files)}')
    print(f'\nカテゴリ数: {len(categories)}')
    print(f'サブカテゴリ数: {sum(len(cat["subcategories"]) for cat in categories)}')

if __name__ == '__main__':
    main()

