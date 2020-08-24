// @ts-ignore
import GeoJsonGeometriesLookup from "geojson-geometries-lookup";
// @ts-ignore
import {createSVGWindow} from "svgdom";
// @ts-ignore
import { SVG, registerWindow } from '@svgdotjs/svg.js'

import fs from "fs";

const jsonData = fs.readFileSync('../data/ne_10m_admin_0_countries.json', {encoding: 'utf-8'});

const geojson = JSON.parse(jsonData);

const glookup = new GeoJsonGeometriesLookup(geojson);

const window = createSVGWindow();
const document = window.document;
registerWindow(window, document);

const draw1x1 = SVG().size(360, 150);

const result1v1Point = [];
for(let x=-180; x<180; x++) {
    for(let y=-90; y<90; y++) {
        const result = glookup.getContainers({type: "Point", coordinates: [x, y]});
        if(result.features.length > 0) {
            const country = result.features.map((value: any, index: number)=>{
                return value.properties.SOVEREIGNT
            });
            if('Antarctica' === country[0])
                continue;
            draw1x1.circle(0.8).move(x+180-.4, -y+90-.4);
            result1v1Point.push({x, y, country});
        }
    }
}

const svgContent1x1 = draw1x1.svg();

fs.writeFileSync('../data/ne_10m_admin_0_countries_1_1x1.svg', svgContent1x1);
fs.writeFileSync('../data/ne_10m_admin_0_countries_1_1x1.json', JSON.stringify(result1v1Point));

const draw1x4 = SVG().size(360, 150);

const result1v4Point = [];
for(let x=-180; x<180; x+=2) {
    for(let y=-90; y<90; y+=2) {
        const result = glookup.getContainers({type: "Point", coordinates: [x, y]});
        if(result.features.length > 0) {
            const country = result.features.map((value: any, index: number)=>{
                return value.properties.SOVEREIGNT
            });
            if('Antarctica' === country[0])
                continue;
            draw1x4.circle(1.6).move(x+180-.8, -y+90-.8);
            result1v4Point.push({x, y, country});
        }
    }
}

const svgContent1x4 = draw1x4.svg();

fs.writeFileSync('../data/ne_10m_admin_0_countries_1_2x2.svg', svgContent1x4);
fs.writeFileSync('../data/ne_10m_admin_0_countries_1_2x2.json', JSON.stringify(result1v4Point));
