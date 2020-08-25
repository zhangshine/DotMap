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
var provinceJsonData = fs_1.default.readFileSync('../data/ne_10m_admin_1_states_provinces.json', { encoding: 'utf-8' });
var provinceGeoJson = JSON.parse(provinceJsonData);
var glookup = new geojson_geometries_lookup_1.default(provinceGeoJson);
function polygonAvgPoint(polygonPoints, provinceInfo, step) {
    var sumPoint = polygonPoints.reduce(function (accValue, currentValue) {
        accValue.x += currentValue[0];
        accValue.y += currentValue[1];
        return accValue;
    }, { x: 0, y: 0 });
    var avgPoint = {
        x: Math.round(sumPoint.x / polygonPoints.length / step) * step,
        y: Math.round(sumPoint.y / polygonPoints.length / step) * step
    };
    return { x: avgPoint.x, y: avgPoint.y, provinces: [provinceInfo] };
}
function appendIfNotExists(point, target) {
    var _loop_1 = function (i) {
        var tp = target[i];
        if (tp.x === point.x && tp.y === point.y) {
            var existed_1 = false;
            tp.provinces.forEach(function (pi) {
                if (pi.adm1_code === point.provinces[0].adm1_code)
                    existed_1 = true;
            });
            if (existed_1)
                return { value: void 0 };
        }
    };
    for (var i = 0; i < target.length; i++) {
        var state_1 = _loop_1(i);
        if (typeof state_1 === "object")
            return state_1.value;
    }
    target.push(point);
}
function extractProvinceInfo(properties) {
    var adm1_code = properties.adm1_code, name = properties.name, name_local = properties.name_local, woe_label = properties.woe_label, admin = properties.admin;
    return {
        adm1_code: adm1_code,
        name: name,
        name_local: name_local,
        label: woe_label ? woe_label : admin
    };
}
function calculateProvinceDotData(step) {
    var adm1CodeMap = {}, result = [], missingProvincePoint = [];
    for (var x = -180; x < 180; x += step) {
        for (var y = -90; y < 90; y += step) {
            var containerResult = glookup.getContainers({ type: "Point", coordinates: [x, y] });
            if (containerResult.features.length <= 0)
                continue;
            var provinces = containerResult.features.map(function (provinceInfo) {
                return extractProvinceInfo(provinceInfo.properties);
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
    provinceGeoJson.features.forEach(function (provinceInfo) {
        var pi = extractProvinceInfo(provinceInfo.properties);
        if (pi.name === 'Antarctica')
            return;
        if (adm1CodeMap[pi.adm1_code]) {
            return;
        }
        var _a = provinceInfo.geometry, type = _a.type, coordinates = _a.coordinates;
        if (type === 'Polygon') {
            var polygonPoints = coordinates[0];
            appendIfNotExists(polygonAvgPoint(polygonPoints, pi, step), missingProvincePoint);
        }
        else if (type === 'MultiPolygon') {
            coordinates.forEach(function (points) {
                appendIfNotExists(polygonAvgPoint(points[0], pi, step), missingProvincePoint);
            });
        }
    });
    missingProvincePoint.forEach(function (point) {
        var found = false;
        var _loop_2 = function (i) {
            var pp = result[i];
            if (pp.x !== point.x || pp.y !== point.y)
                return "continue";
            found = true;
            var existed = false;
            pp.provinces.forEach(function (pi) {
                if (pi.adm1_code === point.provinces[0].adm1_code)
                    existed = true;
            });
            if (!existed)
                pp.provinces.push(point.provinces[0]);
        };
        for (var i = 0; i < result.length; i++) {
            _loop_2(i);
        }
        if (!found) {
            result.push(point);
        }
    });
    return result;
}
var dot1x1MapData = calculateProvinceDotData(1);
fs_1.default.writeFileSync('../data/ne_10m_admin_1_states_provinces_1_1x1.json', JSON.stringify(dot1x1MapData, null, 4));
var window = svgdom_1.createSVGWindow();
var document = window.document;
svg_js_1.registerWindow(window, document);
var draw1x1 = svg_js_1.SVG().size(360, 180);
dot1x1MapData.forEach(function (point) {
    draw1x1.circle(0.8).attr({ cx: point.x + 180, cy: -point.y + 90 });
});
var svgContent1x1 = draw1x1.svg();
fs_1.default.writeFileSync('../data/ne_10m_admin_1_states_provinces_1_1x1.svg', svgContent1x1);
var dot1x4MapData = calculateProvinceDotData(2);
fs_1.default.writeFileSync('../data/ne_10m_admin_1_states_provinces_1_2x2.json', JSON.stringify(dot1x4MapData, null, 4));
var draw1x4 = svg_js_1.SVG().size(360, 180);
dot1x4MapData.forEach(function (point) {
    draw1x4.circle(1.6).attr({ cx: point.x + 180, cy: -point.y + 90 });
});
var svgContent1x4 = draw1x4.svg();
fs_1.default.writeFileSync('../data/ne_10m_admin_1_states_provinces_1_2x2.svg', svgContent1x4);
var provinceLocation2 = {};
dot1x4MapData.forEach(function (point) {
    point.provinces.forEach(function (pi) {
        if (pi.adm1_code in provinceLocation2) {
            provinceLocation2[pi.adm1_code].locations.push({ x: point.x, y: point.y });
        }
        else {
            provinceLocation2[pi.adm1_code] = {
                province: pi,
                locations: [{ x: point.x, y: point.y }]
            };
        }
    });
});
fs_1.default.writeFileSync('../data/ne_10m_admin_1_states_provinces_1_2x2_locations.json', JSON.stringify(Object.values(provinceLocation2), null, 4));
