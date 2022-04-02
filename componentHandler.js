let componentHandler;
if (window.componentHandler) componentHandler = window.componentHandler;
else componentHandler = await (await fetch("./componentHandler.js")).text();

let components;
if (window.components) components = window.components;

/**
 * Generates a component generator based on an url
 * @param {String} url The component url
 * @returns The component generator
 */
export const load = (url) => {
  return async function () {
    return await generateIframe({ url, args: arguments });
  };
};

/**
 * Uses components.json to fetch a full UI library
 * @param {String} url The folder url
 * @returns An object with component generators
 */
export const loadPack = async (url) => {
  let packInfo = JSON.parse(
    await (await fetch(url + "/components.json")).text()
  );

  let result = {};

  for (let i of Object.keys(packInfo.components)) {
    result[i] = load(packInfo.components[i].url);
  }

  return result;
};

/**
 * Loads a module template and returns its class
 * @param {Object} options Additional options. Must provide the location of module
 * @return {Module} The module as class
 */
export const generateIframe = async (options) => {
  let iframe = document.createElement("iframe");
  iframe.src = options.url;
  iframe.style.border = "none";

  iframe.onload = () => {
    iframe.contentWindow.componentHandler = componentHandler;
    iframe.contentWindow.isComponent = true;
    iframe.contentWindow.args = options.args;
    iframe.contentWindow.setDimensions = (width, height) => {
      iframe.width = width;
      iframe.height = height;
    };
    iframe.contentWindow.reportComponentApi = (api) => {
      returnObj.component = api;
      returnObj.onInit();
      initResolve && initResolve();
    };

    let contentWrap = iframe.contentDocument.createElement("div");
    contentWrap.id = "componentWrap";
    for (let i of iframe.contentDocument.body.childNodes) {
      contentWrap.appendChild(i);
    }
    iframe.contentDocument.body.appendChild(contentWrap);

    let script = iframe.contentDocument.createElement("script");
    script.type = "module";
    script.text = componentHandler;
    iframe.contentDocument.documentElement.appendChild(script);
  };
  let initResolve;

  let returnObj = {
    element: iframe,
    component: {},
    onInit: () => {},
    init: async () => {
      await new Promise((r) => (initResolve = r));
    },
  };

  return returnObj;
};

export const startup = async () => {
  window.load = load;

  let handler = document.getElementById("handler");
  if (!handler) throw new Error("Cant find handler " + window.location);
  let importObject = await import(handler.src);
  await importObject.create(...window.args);

  let components = document.getElementsByClassName("component");
  for (let i of components) {
    let attributes = {};
    i.getAttributeNames().forEach(
      (value) => (attributes[value] = i.getAttribute(value))
    );
    let component =
      i.getAttribute("component") && components
        ? components[i.getAttribute("component")]
        : load(i.getAttribute("src"));
    let res = await component(attributes);
    i.appendChild(res.element);
    await res.init();
  }

  let calculatedStyle = getComputedStyle(
    document.getElementById("componentWrap")
  );
  window.setDimensions(
    calculatedStyle.width.split("px")[0],
    calculatedStyle.height.split("px")[0]
  );

  document.body.style.overflow = "hidden";
  document.body.style.margin = "0";

  window.reportComponentApi(importObject);
};

if (window.isComponent) startup();
