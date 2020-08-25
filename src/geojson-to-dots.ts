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
geojson.features.map((value: any)=>{
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

function polygonAvgPoint(polygonPoints: any[], countryName: string, step: number): CountryPoint {
    const sumPoint = polygonPoints.reduce((accValue, currentValue)=>{
        accValue.x += currentValue[0];
        accValue.y += currentValue[1];

        return accValue;
    }, {x: 0, y: 0});
    const avgPoint = {
        x: Math.round(sumPoint.x / polygonPoints.length / step) * step,
        y: Math.round(sumPoint.y / polygonPoints.length / step) * step
    };
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

function calculateDotData(step: number): PointCountries[]{
    const countryMap: {[key:string]: number} = {},
        result: PointCountries[] = [],
        missingCountry: string[] = [],
        missingCountryPoint: CountryPoint[] = [];
    for(let x=-180; x<180; x+=step) {
        for(let y=-90; y<90; y+=step) {
            const containerResult = glookup.getContainers({type: "Point", coordinates: [x, y]});
            if(containerResult.features.length > 0) {
                const country = containerResult.features.map((value: any, index: number)=>{
                    return value.properties.SOVEREIGNT
                });
                countryMap[country[0]] = 1;
                if('Antarctica' === country[0])
                    continue;
                result.push({x, y, country});
            }
        }
    }

    Object.keys(allCountryMap).forEach((countryName)=>{
        if(!countryMap[countryName])
            missingCountry.push(countryName);
    });

    geojson.features.forEach((countryInfo: any)=>{
        const countryName = countryInfo.properties.SOVEREIGNT;
        if(missingCountry.indexOf(countryName) !== -1) {
            if(countryInfo.geometry.type === 'Polygon') {
                const polygonPoints: any[] = countryInfo.geometry.coordinates[0];
                appendIfNotExists(polygonAvgPoint(polygonPoints, countryName, step), missingCountryPoint)
            } else if(countryInfo.geometry.type === 'MultiPolygon') {
                countryInfo.geometry.coordinates.forEach((points: any)=>{
                    appendIfNotExists(polygonAvgPoint(points[0], countryName, step), missingCountryPoint);
                });
            }
        }
    });

    // add/merge mission country point
    missingCountryPoint.forEach((point: CountryPoint)=>{
        let found = false;
        for(let i=0; i<result.length; i++) {
            const pc = result[i];
            if(pc.x === point.x && pc.y === point.y) {
                if(pc.country.indexOf(point.countryName) === -1) {
                    pc.country.push(point.countryName);
                }
                found = true;
            }
        }

        if(!found) {
            result.push({
                x: point.x,
                y: point.y,
                country: [point.countryName]
            });
        }
    });

    return result;
}

const dot1x1MapData = calculateDotData(1);

const draw1x1 = SVG().size(360, 150);
dot1x1MapData.forEach((point)=>{
    draw1x1.circle(0.8).attr({cx: point.x+180, cy: -point.y+90})
});
const svgContent1x1 = draw1x1.svg();

fs.writeFileSync('../data/ne_10m_admin_0_countries_1_1x1.svg', svgContent1x1);
fs.writeFileSync('../data/ne_10m_admin_0_countries_1_1x1.json', JSON.stringify(dot1x1MapData, null, 4));

const dot1x4MapData = calculateDotData(2);

const draw1x4 = SVG().size(360, 150);
dot1x4MapData.forEach((point)=>{
    draw1x4.circle(1.6).attr({cx: point.x+180, cy: -point.y+90});
});
const svgContent1x4 = draw1x4.svg();

fs.writeFileSync('../data/ne_10m_admin_0_countries_1_2x2.svg', svgContent1x4);
fs.writeFileSync('../data/ne_10m_admin_0_countries_1_2x2.json', JSON.stringify(dot1x4MapData, null, 4));
