"use strict";
// Compatibility exports for existing plain-node scripts; constants belong to the shared entry.
const { require: tsRequire } = require("tsx/cjs/api");
const { ESTAT_API, ESTAT_ENDPOINTS } = tsRequire("../../../../packages/estat-api/src/ingest.ts", __filename);
const ESTAT_API_BASE_URL = `${ESTAT_API.BASE_URL}/app/json`;
const ESTAT_STATS_LIST_URL = `${ESTAT_API.BASE_URL}${ESTAT_ENDPOINTS.GET_STATS_LIST}`;
const ESTAT_META_INFO_URL = `${ESTAT_API.BASE_URL}${ESTAT_ENDPOINTS.GET_META_INFO}`;
const ESTAT_STATS_DATA_URL = `${ESTAT_API.BASE_URL}${ESTAT_ENDPOINTS.GET_STATS_DATA}`;
module.exports = { ESTAT_API_BASE_URL, ESTAT_STATS_LIST_URL, ESTAT_META_INFO_URL, ESTAT_STATS_DATA_URL };
