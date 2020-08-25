// @ts-ignore
import GeoJsonGeometriesLookup from "geojson-geometries-lookup";
// @ts-ignore
import {createSVGWindow} from "svgdom";
// @ts-ignore
import { SVG, registerWindow } from '@svgdotjs/svg.js'

import fs from "fs";
import {Location} from "./common";

const jsonData = fs.readFileSync('../data/ne_10m_populated_places.json', {encoding: 'utf-8'});

const placeGeoJson = JSON.parse(jsonData);

interface PlaceLocation {
    name: string;
    name_ascii: string;
    location: Location;
}

function roundPoint(x: number, y: number, step: number): {x: number, y: number} {
    return {
        x: Math.round(x / step) * step,
        y: Math.round(y / step) * step
    }
}

const result: PlaceLocation[] = placeGeoJson.features.map((placeInfo: any)=>{
    const {NAME: name, NAMEASCII: name_ascii, LATITUDE: x, LONGITUDE: y} = placeInfo.properties;
    return {
        name,
        name_ascii,
        location: roundPoint(x, y, 1)
    }
});

fs.writeFileSync('../data/ne_10m_populated_places_location_1x1.json', JSON.stringify(result, null, 4));

const result2: PlaceLocation[] = placeGeoJson.features.map((placeInfo: any)=>{
    const {NAME: name, NAMEASCII: name_ascii, LATITUDE: y, LONGITUDE: x} = placeInfo.properties;
    return {
        name,
        name_ascii,
        location: roundPoint(x, y, 2)
    }
});

fs.writeFileSync('../data/ne_10m_populated_places_location_2x2.json', JSON.stringify(result2, null, 4));
