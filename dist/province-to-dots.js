"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-ignore
var geojson_geometries_lookup_1 = __importDefault(require("geojson-geometries-lookup"));
var fs_1 = __importDefault(require("fs"));
var provinceJsonData = fs_1.default.readFileSync('../data/ne_10m_admin_1_states_provinces.json', { encoding: 'utf-8' });
var provinceGeoJson = JSON.parse(provinceJsonData);
var glookup = new geojson_geometries_lookup_1.default(provinceGeoJson);
function calculateProvinceDotData(step) {
    var adm1CodeMap = {}, result = [];
    for (var x = -180; x < 180; x += step) {
        for (var y = -90; y < 90; y += step) {
            var containerResult = glookup.getContainers({ type: "Point", coordinates: [x, y] });
            if (containerResult.features.length <= 0)
                continue;
            var provinces = containerResult.features.map(function (provinceInfo) {
                var _a = provinceInfo.properties, adm1_code = _a.adm1_code, name = _a.name, name_local = _a.name_local, woe_label = _a.woe_label;
                return { adm1_code: adm1_code, name: name, name_local: name_local, woe_label: woe_label };
            });
            provinces = provinces.filter(function (provinceInfo) { return provinceInfo.name !== 'Antarctica'; });
            if (provinces.length <= 0)
                continue;
            provinces.forEach(function (provinceInfo) {
                adm1CodeMap[provinceInfo.adm1_code] = 1;
            });
            result.push({
                x: x, y: y, provinces: provinces
            });
        }
    }
    return result;
}
var dot1x1MapData = calculateProvinceDotData(1);
fs_1.default.writeFileSync('../data/ne_10m_admin_1_states_provinces_1_1x1.json', JSON.stringify(dot1x1MapData, null, 4));
