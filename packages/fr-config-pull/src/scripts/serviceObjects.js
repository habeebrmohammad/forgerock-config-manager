const fs = require("fs");
const {
  restGet,
  logRestError,
} = require("../../../fr-config-common/src/restClient.js");
const {
  saveJsonToFile,
  escapePlaceholders,
} = require("../../../fr-config-common/src/utils.js");
const { AuthzTypes } = require("../../../fr-config-common/src/constants.js");
const EXPORT_SUBDIR = "service-objects";
const _ = require("lodash");

async function exportConfig(exportDir, objectsConfigFile, tenantUrl, token) {
  try {
    var systemObjects = JSON.parse(fs.readFileSync(objectsConfigFile, "utf8"));
    for (const objectType of Object.keys(systemObjects)) {
      for (const systemObject of systemObjects[objectType]) {
        const idmEndpoint = `${tenantUrl}/openidm/managed/${objectType}`;

        const response = await restGet(
          idmEndpoint,
          {
            _queryFilter: `${systemObject.searchField} eq "${systemObject.searchValue}"`,
            _fields: systemObject.fields.join(","),
          },
          token
        );

        if (response.data.resultCount != 1) {
          console.error(
            `Unexpected result from search: ${response.data.resultCount} entries found for ${objectType} - ${systemObject.searchValue}`
          );
          process.exit(1);
        }
        let attributes = escapePlaceholders(response.data.result[0]);

        const mergedAttributes = _.merge(attributes, systemObject.overrides);
        const targetDir = `${exportDir}/${EXPORT_SUBDIR}/${objectType}`;
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        const fileName = `${targetDir}/${systemObject.searchValue}.json`;
        saveJsonToFile(mergedAttributes, fileName);
      }
    }
  } catch (err) {
    logRestError(err);
  }
}

module.exports.exportConfig = exportConfig;
