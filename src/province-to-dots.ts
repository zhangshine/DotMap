// @ts-ignore
import GeoJsonGeometriesLookup from "geojson-geometries-lookup";
// @ts-ignore
import {createSVGWindow} from "svgdom";
// @ts-ignore
import {registerWindow, SVG} from '@svgdotjs/svg.js'

import fs from "fs";

const provinceJsonData = fs.readFileSync('../data/ne_10m_admin_1_states_provinces.json', {encoding: 'utf-8'});
const provinceGeoJson = JSON.parse(provinceJsonData);
const glookup = new GeoJsonGeometriesLookup(provinceGeoJson);

interface ProvinceInfo {
    adm1_code: string;
    name: string;
    name_local: string;
    label: string;
}

interface PointProvince {
    x: number;
    y: number;
    provinces: ProvinceInfo[];
}

function polygonAvgPoint(polygonPoints: any[], provinceInfo: ProvinceInfo, step: number): PointProvince {
    const sumPoint = polygonPoints.reduce((accValue, currentValue)=>{
        accValue.x += currentValue[0];
        accValue.y += currentValue[1];

        return accValue;
    }, {x: 0, y: 0});
    const avgPoint = {
        x: Math.round(sumPoint.x / polygonPoints.length / step) * step,
        y: Math.round(sumPoint.y / polygonPoints.length / step) * step
    };
    return {x: avgPoint.x, y: avgPoint.y, provinces: [provinceInfo]};
}

function appendIfNotExists(point: PointProvince, target: PointProvince[]) {
    for(let i=0; i<target.length; i++) {
        const tp = target[i];
        if(tp.x === point.x && tp.y === point.y){
            let existed = false;
            tp.provinces.forEach((pi: ProvinceInfo)=>{
                if(pi.adm1_code === point.provinces[0].adm1_code)
                    existed = true;
            });
            if(existed)
                return;
        }
    }
    target.push(point);
}

function extractProvinceInfo(properties: any): ProvinceInfo {
    const {adm1_code, name, name_local, woe_label, admin} = properties;
    return {
        adm1_code,
        name,
        name_local,
        label: woe_label ? woe_label : admin
    };
}

function calculateProvinceDotData(step: number) {
    const adm1CodeMap: {[key: string]: number} = {},
        result: PointProvince[] = [],
        missingProvincePoint: PointProvince[] = [];

    for(let x=-180; x<180; x+=step) {
        for(let y=-90; y<90; y+=step) {
            const containerResult = glookup.getContainers({type: "Point", coordinates: [x, y]});
            if(containerResult.features.length <= 0)
                continue;

            let provinces: ProvinceInfo[] = containerResult.features.map((provinceInfo: any): ProvinceInfo=>{
                return extractProvinceInfo(provinceInfo.properties);
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

    provinceGeoJson.features.forEach((provinceInfo: any)=>{
        const pi = extractProvinceInfo(provinceInfo.properties);
        if(pi.name === 'Antarctica')
            return;

        if (adm1CodeMap[pi.adm1_code]) {
            return;
        }

        const {type, coordinates} = provinceInfo.geometry;
        if(type === 'Polygon') {
            const polygonPoints: any[] = coordinates[0];
            appendIfNotExists(polygonAvgPoint(polygonPoints, pi, step), missingProvincePoint);
        } else if(type === 'MultiPolygon') {
            coordinates.forEach((points: any)=>{
                appendIfNotExists(polygonAvgPoint(points[0], pi, step), missingProvincePoint);
            });
        }
    });

    missingProvincePoint.forEach((point: PointProvince)=>{
        let found = false;
        for(let i=0; i<result.length; i++) {
            const pp = result[i];
            if(pp.x !== point.x || pp.y !== point.y)
                continue;

            found = true;
            let existed = false;
            pp.provinces.forEach((pi)=>{
                if(pi.adm1_code === point.provinces[0].adm1_code)
                    existed = true;
            });
            if(!existed)
                pp.provinces.push(point.provinces[0]);
        }

        if(!found) {
            result.push(point);
        }
    });

    return result;
}

const dot1x1MapData = calculateProvinceDotData(1);
fs.writeFileSync('../data/ne_10m_admin_1_states_provinces_1_1x1.json', JSON.stringify(dot1x1MapData, null, 4));

const window = createSVGWindow();
const document = window.document;
registerWindow(window, document);

const draw1x1 = SVG().size(360, 180);
dot1x1MapData.forEach((point)=>{
    draw1x1.circle(0.8).attr({cx: point.x+180, cy: -point.y+90})
});
const svgContent1x1 = draw1x1.svg();
fs.writeFileSync('../data/ne_10m_admin_1_states_provinces_1_1x1.svg', svgContent1x1);

const dot1x4MapData = calculateProvinceDotData(2);
fs.writeFileSync('../data/ne_10m_admin_1_states_provinces_1_2x2.json', JSON.stringify(dot1x4MapData, null, 4));
const draw1x4 = SVG().size(360, 180);
dot1x4MapData.forEach((point)=>{
    draw1x4.circle(1.6).attr({cx: point.x+180, cy: -point.y+90})
});
const svgContent1x4 = draw1x4.svg();
fs.writeFileSync('../data/ne_10m_admin_1_states_provinces_1_2x2.svg', svgContent1x4);
