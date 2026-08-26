"use strict";

const DISABLED_ERROR_CODE = "IMAGE_SIZE_PARSER_DISABLED";

function imageSizeDisabled() {
  const error = new Error(
    "image-size parsing is disabled because the upstream package has no patched release",
  );
  error.code = DISABLED_ERROR_CODE;
  throw error;
}

imageSizeDisabled.default = imageSizeDisabled;
imageSizeDisabled.imageSize = imageSizeDisabled;
imageSizeDisabled.disableFS = () => undefined;
imageSizeDisabled.disableTypes = () => undefined;
imageSizeDisabled.setConcurrency = () => undefined;
imageSizeDisabled.types = Object.freeze([]);

module.exports = imageSizeDisabled;
