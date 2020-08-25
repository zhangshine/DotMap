// @ts-ignore
import GeoJsonGeometriesLookup from "geojson-geometries-lookup";
// @ts-ignore
import {createSVGWindow} from "svgdom";
// @ts-ignore
import { SVG, registerWindow } from '@svgdotjs/svg.js'

import fs from "fs";

const provinceJsonData = fs.readFileSync('../data/ne_10m_admin_1_states_provinces.json', {encoding: 'utf-8'});
const provinceGeoJson = JSON.parse(provinceJsonData);
const glookup = new GeoJsonGeometriesLookup(provinceGeoJson);

interface ProvinceInfo {
    adm1_code: string;
    name: string;
    name_local: string;
    woe_label: string;
}

interface PointProvince {
    x: number;
    y: number;
    provinces: ProvinceInfo[];
}


function calculateProvinceDotData(step: number) {
    const adm1CodeMap: {[key: string]: number} = {},
        result: PointProvince[] = [];

    for(let x=-180; x<180; x+=step) {
        for(let y=-90; y<90; y+=step) {
            const containerResult = glookup.getContainers({type: "Point", coordinates: [x, y]});
            if(containerResult.features.length <= 0)
                continue;

            let provinces: ProvinceInfo[] = containerResult.features.map((provinceInfo: any): ProvinceInfo=>{
                const {adm1_code, name, name_local, woe_label} = provinceInfo.properties;
                return {adm1_code, name, name_local, woe_label}
            });

            provinces = provinces.filter((provinceInfo: ProvinceInfo)=>provinceInfo.name !== 'Antarctica');

            if(provinces.length <= 0)
                continue;

            provinces.forEach((provinceInfo: ProvinceInfo)=>{
                adm1CodeMap[provinceInfo.adm1_code] = 1;
            });

            result.push({
                x, y, provinces
            });
        }
    }

    return result;
}

const dot1x1MapData = calculateProvinceDotData(1);
fs.writeFileSync('../data/ne_10m_admin_1_states_provinces_1_1x1.json', JSON.stringify(dot1x1MapData, null, 4));
