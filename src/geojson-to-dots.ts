// @ts-ignore
import GeoJsonGeometriesLookup from "geojson-geometries-lookup";
// @ts-ignore
import {createSVGWindow} from "svgdom";
// @ts-ignore
import { SVG, registerWindow } from '@svgdotjs/svg.js'

import fs from "fs";

const jsonData = fs.readFileSync('../data/ne_10m_admin_0_countries.json', {encoding: 'utf-8'});

const geojson = JSON.parse(jsonData);


const allCountryMap: {[key:string]: number} = {};
geojson.features.map((value: any, index: number)=>{
    allCountryMap[value.properties.SOVEREIGNT] = 1;
});

const glookup = new GeoJsonGeometriesLookup(geojson);

const window = createSVGWindow();
const document = window.document;
registerWindow(window, document);



interface CountryPoint {
    x: number;
    y: number;
    countryName: string;
}

interface PointCountries {
    x: number;
    y: number;
    country: string[];
}

const result1v1Point: PointCountries[] = [],
    countryMap1x1: {[key:string]: number} = {},
    missingCountry1x1: string[] = [],
    missingCountryPoint1x1: CountryPoint[] = [];
for(let x=-180; x<180; x++) {
    for(let y=-90; y<90; y++) {
        const result = glookup.getContainers({type: "Point", coordinates: [x, y]});
        if(result.features.length > 0) {
            const country = result.features.map((value: any, index: number)=>{
                return value.properties.SOVEREIGNT
            });
            countryMap1x1[country[0]] = 1;
            if('Antarctica' === country[0])
                continue;
            result1v1Point.push({x, y, country});
        }
    }
}

Object.keys(allCountryMap).forEach((countryName)=>{
    if(!countryMap1x1[countryName])
        missingCountry1x1.push(countryName);
});


function polygonAvgPoint(polygonPoints: any[], countryName: string): CountryPoint {
    const sumPoint = polygonPoints.reduce((accValue, currentValue)=>{
        accValue.x += currentValue[0];
        accValue.y += currentValue[1];

        return accValue;
    }, {x: 0, y: 0});
    const avgPoint = {x: Math.round(sumPoint.x / polygonPoints.length), y: Math.round(sumPoint.y / polygonPoints.length)};
    return {x: avgPoint.x, y: avgPoint.y, countryName};
}

function appendIfNotExists(point: CountryPoint, target: CountryPoint[]) {
    for(let i=0; i<target.length; i++) {
        const tp = target[i];
        if(tp.x === point.x && tp.y === point.y && tp.countryName === point.countryName){
            return;
        }
    }
    target.push(point);
}

geojson.features.forEach((countryInfo: any)=>{
    const countryName = countryInfo.properties.SOVEREIGNT;
    if(missingCountry1x1.indexOf(countryName) != -1) {
        if(countryInfo.geometry.type === 'Polygon') {
            const polygonPoints: any[] = countryInfo.geometry.coordinates[0];
            appendIfNotExists(polygonAvgPoint(polygonPoints, countryName), missingCountryPoint1x1)
        } else if(countryInfo.geometry.type === 'MultiPolygon') {
            countryInfo.geometry.coordinates.forEach((points: any)=>{
                appendIfNotExists(polygonAvgPoint(points[0], countryName), missingCountryPoint1x1);
            });
        }
    }
});

// add/merge mission country point
missingCountryPoint1x1.forEach((point: CountryPoint)=>{
    let found = false;
    for(let i=0; i<result1v1Point.length; i++) {
        const pc = result1v1Point[i];
        if(pc.x === point.x && pc.y === point.y) {
            if(pc.country.indexOf(point.countryName) === -1) {
                pc.country.push(point.countryName);
                found = true;
            } else {
                found = true;
            }
        }
    }

    if(!found) {
        result1v1Point.push({
            x: point.x,
            y: point.y,
            country: [point.countryName]
        });
    }
});

const draw1x1 = SVG().size(360, 150);
result1v1Point.forEach((point)=>{
    draw1x1.circle(0.8).attr({cx: point.x+180, cy: -point.y+90})
});
const svgContent1x1 = draw1x1.svg();

fs.writeFileSync('../data/ne_10m_admin_0_countries_1_1x1.svg', svgContent1x1);
fs.writeFileSync('../data/ne_10m_admin_0_countries_1_1x1.json', JSON.stringify(result1v1Point, null, 4));

const result1v4Point = [], countryMap1x4: {[key:string]: number} = {};
for(let x=-180; x<180; x+=2) {
    for(let y=-90; y<90; y+=2) {
        const result = glookup.getContainers({type: "Point", coordinates: [x, y]});
        if(result.features.length > 0) {
            const country = result.features.map((value: any, index: number)=>{
                return value.properties.SOVEREIGNT
            });
            countryMap1x4[country[1]] = 1;
            if('Antarctica' === country[0])
                continue;
            result1v4Point.push({x, y, country});
        }
    }
}
//
// Object.keys(allCountryMap).forEach((countryName)=>{
//     if(!countryMap1x4[countryName])
//         console.log(countryName);
// });

const draw1x4 = SVG().size(360, 150);
result1v4Point.forEach((point)=>{
    draw1x4.circle(1.6).attr({cx: point.x+180, cy: -point.y+90});
});
const svgContent1x4 = draw1x4.svg();

fs.writeFileSync('../data/ne_10m_admin_0_countries_1_2x2.svg', svgContent1x4);
fs.writeFileSync('../data/ne_10m_admin_0_countries_1_2x2.json', JSON.stringify(result1v4Point, null, 4));
