"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AreaMapTiles = void 0;
/**
 * Enumeration of different tile types for area maps
 */
var AreaMapTiles;
(function (AreaMapTiles) {
    /** Water tile */
    AreaMapTiles[AreaMapTiles["Water"] = 0] = "Water";
    /** Beach sand tile */
    AreaMapTiles[AreaMapTiles["BeachSand"] = 1] = "BeachSand";
    /** Dirt ground tile */
    AreaMapTiles[AreaMapTiles["DirtGround"] = 2] = "DirtGround";
    /** Grass ground tile */
    AreaMapTiles[AreaMapTiles["GrassGround"] = 3] = "GrassGround";
    /** Rocks tile */
    AreaMapTiles[AreaMapTiles["Rocks"] = 4] = "Rocks";
    /** Dirt path tile */
    AreaMapTiles[AreaMapTiles["DirtPath"] = 5] = "DirtPath";
    /** Cobble path tile */
    AreaMapTiles[AreaMapTiles["CobblePath"] = 6] = "CobblePath";
    /** Snow tile */
    AreaMapTiles[AreaMapTiles["Snow"] = 7] = "Snow";
})(AreaMapTiles || (exports.AreaMapTiles = AreaMapTiles = {}));
