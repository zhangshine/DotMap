"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-ignore
var geojson_geometries_lookup_1 = __importDefault(require("geojson-geometries-lookup"));
// @ts-ignore
var svgdom_1 = require("svgdom");
// @ts-ignore
var svg_js_1 = require("@svgdotjs/svg.js");
var fs_1 = __importDefault(require("fs"));
var jsonData = fs_1.default.readFileSync('../data/ne_10m_admin_0_countries.json', { encoding: 'utf-8' });
var geojson = JSON.parse(jsonData);
var allCountryMap = {};
geojson.features.map(function (value, index) {
    allCountryMap[value.properties.SOVEREIGNT] = 1;
});
var glookup = new geojson_geometries_lookup_1.default(geojson);
var window = svgdom_1.createSVGWindow();
var document = window.document;
svg_js_1.registerWindow(window, document);
var result1v1Point = [], countryMap1x1 = {}, missingCountry1x1 = [], missingCountryPoint1x1 = [];
for (var x = -180; x < 180; x++) {
    for (var y = -90; y < 90; y++) {
        var result = glookup.getContainers({ type: "Point", coordinates: [x, y] });
        if (result.features.length > 0) {
            var country = result.features.map(function (value, index) {
                return value.properties.SOVEREIGNT;
            });
            countryMap1x1[country[0]] = 1;
            if ('Antarctica' === country[0])
                continue;
            result1v1Point.push({ x: x, y: y, country: country });
        }
    }
}
Object.keys(allCountryMap).forEach(function (countryName) {
    if (!countryMap1x1[countryName])
        missingCountry1x1.push(countryName);
});
function polygonAvgPoint(polygonPoints, countryName) {
    var sumPoint = polygonPoints.reduce(function (accValue, currentValue) {
        accValue.x += currentValue[0];
        accValue.y += currentValue[1];
        return accValue;
    }, { x: 0, y: 0 });
    var avgPoint = { x: Math.round(sumPoint.x / polygonPoints.length), y: Math.round(sumPoint.y / polygonPoints.length) };
    return { x: avgPoint.x, y: avgPoint.y, countryName: countryName };
}
function appendIfNotExists(point, target) {
    for (var i = 0; i < target.length; i++) {
        var tp = target[i];
        if (tp.x === point.x && tp.y === point.y && tp.countryName === point.countryName) {
            return;
        }
    }
    target.push(point);
}
geojson.features.forEach(function (countryInfo) {
    var countryName = countryInfo.properties.SOVEREIGNT;
    if (missingCountry1x1.indexOf(countryName) != -1) {
        if (countryInfo.geometry.type === 'Polygon') {
            var polygonPoints = countryInfo.geometry.coordinates[0];
            appendIfNotExists(polygonAvgPoint(polygonPoints, countryName), missingCountryPoint1x1);
        }
        else if (countryInfo.geometry.type === 'MultiPolygon') {
            countryInfo.geometry.coordinates.forEach(function (points) {
                appendIfNotExists(polygonAvgPoint(points[0], countryName), missingCountryPoint1x1);
            });
        }
    }
});
// add/merge mission country point
missingCountryPoint1x1.forEach(function (point) {
    var found = false;
    for (var i = 0; i < result1v1Point.length; i++) {
        var pc = result1v1Point[i];
        if (pc.x === point.x && pc.y === point.y) {
            if (pc.country.indexOf(point.countryName) === -1) {
                pc.country.push(point.countryName);
                found = true;
            }
            else {
                found = true;
            }
        }
    }
    if (!found) {
        result1v1Point.push({
            x: point.x,
            y: point.y,
            country: [point.countryName]
        });
    }
});
var draw1x1 = svg_js_1.SVG().size(360, 150);
result1v1Point.forEach(function (point) {
    draw1x1.circle(0.8).attr({ cx: point.x + 180, cy: -point.y + 90 });
});
var svgContent1x1 = draw1x1.svg();
fs_1.default.writeFileSync('../data/ne_10m_admin_0_countries_1_1x1.svg', svgContent1x1);
fs_1.default.writeFileSync('../data/ne_10m_admin_0_countries_1_1x1.json', JSON.stringify(result1v1Point, null, 4));
var result1v4Point = [], countryMap1x4 = {};
for (var x = -180; x < 180; x += 2) {
    for (var y = -90; y < 90; y += 2) {
        var result = glookup.getContainers({ type: "Point", coordinates: [x, y] });
        if (result.features.length > 0) {
            var country = result.features.map(function (value, index) {
                return value.properties.SOVEREIGNT;
            });
            countryMap1x4[country[1]] = 1;
            if ('Antarctica' === country[0])
                continue;
            result1v4Point.push({ x: x, y: y, country: country });
        }
    }
}
//
// Object.keys(allCountryMap).forEach((countryName)=>{
//     if(!countryMap1x4[countryName])
//         console.log(countryName);
// });
var draw1x4 = svg_js_1.SVG().size(360, 150);
result1v4Point.forEach(function (point) {
    draw1x4.circle(1.6).attr({ cx: point.x + 180, cy: -point.y + 90 });
});
var svgContent1x4 = draw1x4.svg();
fs_1.default.writeFileSync('../data/ne_10m_admin_0_countries_1_2x2.svg', svgContent1x4);
fs_1.default.writeFileSync('../data/ne_10m_admin_0_countries_1_2x2.json', JSON.stringify(result1v4Point, null, 4));
