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
var glookup = new geojson_geometries_lookup_1.default(geojson);
var window = svgdom_1.createSVGWindow();
var document = window.document;
svg_js_1.registerWindow(window, document);
var draw1x1 = svg_js_1.SVG().size(360, 150);
var result1v1Point = [];
for (var x = -180; x < 180; x++) {
    for (var y = -90; y < 90; y++) {
        var result = glookup.getContainers({ type: "Point", coordinates: [x, y] });
        if (result.features.length > 0) {
            var country = result.features.map(function (value, index) {
                return value.properties.SOVEREIGNT;
            });
            if ('Antarctica' === country[0])
                continue;
            draw1x1.circle(0.8).move(x + 180 - .4, -y + 90 - .4);
            result1v1Point.push({ x: x, y: y, country: country });
        }
    }
}
var svgContent1x1 = draw1x1.svg();
fs_1.default.writeFileSync('../data/ne_10m_admin_0_countries_1_1x1.svg', svgContent1x1);
fs_1.default.writeFileSync('../data/ne_10m_admin_0_countries_1_1x1.json', JSON.stringify(result1v1Point, null, 4));
var draw1x4 = svg_js_1.SVG().size(360, 150);
var result1v4Point = [];
for (var x = -180; x < 180; x += 2) {
    for (var y = -90; y < 90; y += 2) {
        var result = glookup.getContainers({ type: "Point", coordinates: [x, y] });
        if (result.features.length > 0) {
            var country = result.features.map(function (value, index) {
                return value.properties.SOVEREIGNT;
            });
            if ('Antarctica' === country[0])
                continue;
            draw1x4.circle(1.6).move(x + 180 - .8, -y + 90 - .8);
            result1v4Point.push({ x: x, y: y, country: country });
        }
    }
}
var svgContent1x4 = draw1x4.svg();
fs_1.default.writeFileSync('../data/ne_10m_admin_0_countries_1_2x2.svg', svgContent1x4);
fs_1.default.writeFileSync('../data/ne_10m_admin_0_countries_1_2x2.json', JSON.stringify(result1v4Point, null, 4));
