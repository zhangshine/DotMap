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
geojson.features.map(function (value) {
    allCountryMap[value.properties.NAME] = 1;
});
var glookup = new geojson_geometries_lookup_1.default(geojson);
var window = svgdom_1.createSVGWindow();
var document = window.document;
svg_js_1.registerWindow(window, document);
function polygonAvgPoint(polygonPoints, countryName, step) {
    var sumPoint = polygonPoints.reduce(function (accValue, currentValue) {
        accValue.x += currentValue[0];
        accValue.y += currentValue[1];
        return accValue;
    }, { x: 0, y: 0 });
    var avgPoint = {
        x: Math.round(sumPoint.x / polygonPoints.length / step) * step,
        y: Math.round(sumPoint.y / polygonPoints.length / step) * step
    };
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
function calculateDotData(step) {
    var countryMap = {}, result = [], missingCountry = [], missingCountryPoint = [];
    for (var x = -180; x < 180; x += step) {
        for (var y = -90; y < 90; y += step) {
            var containerResult = glookup.getContainers({ type: "Point", coordinates: [x, y] });
            if (containerResult.features.length > 0) {
                var country = containerResult.features.map(function (value, index) {
                    return value.properties.NAME;
                });
                countryMap[country[0]] = 1;
                if ('Antarctica' === country[0])
                    continue;
                result.push({ x: x, y: y, country: country });
            }
        }
    }
    Object.keys(allCountryMap).forEach(function (countryName) {
        if (!countryMap[countryName])
            missingCountry.push(countryName);
    });
    geojson.features.forEach(function (countryInfo) {
        var countryName = countryInfo.properties.NAME;
        if (missingCountry.indexOf(countryName) !== -1) {
            if (countryInfo.geometry.type === 'Polygon') {
                var polygonPoints = countryInfo.geometry.coordinates[0];
                appendIfNotExists(polygonAvgPoint(polygonPoints, countryName, step), missingCountryPoint);
            }
            else if (countryInfo.geometry.type === 'MultiPolygon') {
                countryInfo.geometry.coordinates.forEach(function (points) {
                    appendIfNotExists(polygonAvgPoint(points[0], countryName, step), missingCountryPoint);
                });
            }
        }
    });
    // add/merge mission country point
    missingCountryPoint.forEach(function (point) {
        var found = false;
        for (var i = 0; i < result.length; i++) {
            var pc = result[i];
            if (pc.x === point.x && pc.y === point.y) {
                if (pc.country.indexOf(point.countryName) === -1) {
                    pc.country.push(point.countryName);
                }
                found = true;
            }
        }
        if (!found) {
            result.push({
                x: point.x,
                y: point.y,
                country: [point.countryName]
            });
        }
    });
    return result;
}
var dot1x1MapData = calculateDotData(1);
var draw1x1 = svg_js_1.SVG().size(360, 150);
dot1x1MapData.forEach(function (point) {
    draw1x1.circle(0.8).attr({ cx: point.x + 180, cy: -point.y + 90 });
});
var svgContent1x1 = draw1x1.svg();
fs_1.default.writeFileSync('../data/ne_10m_admin_0_countries_1_1x1.svg', svgContent1x1);
fs_1.default.writeFileSync('../data/ne_10m_admin_0_countries_1_1x1.json', JSON.stringify(dot1x1MapData, null, 4));
var placeLocations = {};
dot1x1MapData.forEach(function (point) {
    var location = { x: point.x, y: point.y };
    point.country.forEach(function (countryName) {
        if (countryName in placeLocations) {
            placeLocations[countryName].push(location);
        }
        else {
            placeLocations[countryName] = [location];
        }
    });
});
fs_1.default.writeFileSync('../data/ne_10m_admin_0_countries_1_1x1_country_locations.json', JSON.stringify(placeLocations, null, 4));
var dot1x4MapData = calculateDotData(2);
var draw1x4 = svg_js_1.SVG().size(360, 150);
dot1x4MapData.forEach(function (point) {
    draw1x4.circle(1.6).attr({ cx: point.x + 180, cy: -point.y + 90 });
});
var svgContent1x4 = draw1x4.svg();
fs_1.default.writeFileSync('../data/ne_10m_admin_0_countries_1_2x2.svg', svgContent1x4);
fs_1.default.writeFileSync('../data/ne_10m_admin_0_countries_1_2x2.json', JSON.stringify(dot1x4MapData, null, 4));
var placeLocations2 = {};
dot1x4MapData.forEach(function (point) {
    var location = { x: point.x, y: point.y };
    point.country.forEach(function (countryName) {
        if (countryName in placeLocations2) {
            placeLocations2[countryName].push(location);
        }
        else {
            placeLocations2[countryName] = [location];
        }
    });
});
fs_1.default.writeFileSync('../data/ne_10m_admin_0_countries_1_2x2_country_locations.json', JSON.stringify(placeLocations2, null, 4));
