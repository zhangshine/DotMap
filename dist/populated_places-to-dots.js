"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = __importDefault(require("fs"));
var jsonData = fs_1.default.readFileSync('../data/ne_10m_populated_places.json', { encoding: 'utf-8' });
var placeGeoJson = JSON.parse(jsonData);
function roundPoint(x, y, step) {
    return {
        x: Math.round(x / step) * step,
        y: Math.round(y / step) * step
    };
}
var result = placeGeoJson.features.map(function (placeInfo) {
    var _a = placeInfo.properties, name = _a.NAME, name_ascii = _a.NAMEASCII, x = _a.LATITUDE, y = _a.LONGITUDE;
    return {
        name: name,
        name_ascii: name_ascii,
        location: roundPoint(x, y, 1)
    };
});
fs_1.default.writeFileSync('../data/ne_10m_populated_places_location_1x1.json', JSON.stringify(result, null, 4));
var result2 = placeGeoJson.features.map(function (placeInfo) {
    var _a = placeInfo.properties, name = _a.NAME, name_ascii = _a.NAMEASCII, y = _a.LATITUDE, x = _a.LONGITUDE;
    return {
        name: name,
        name_ascii: name_ascii,
        location: roundPoint(x, y, 2)
    };
});
fs_1.default.writeFileSync('../data/ne_10m_populated_places_location_2x2.json', JSON.stringify(result2, null, 4));
