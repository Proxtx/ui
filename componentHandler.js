let componentHandler;
if (window.componentHandler) componentHandler = window.componentHandler;
else componentHandler = await (await fetch(import.meta.url)).text();

/**
 * Generates a component generator based on an url
 * @param {String} url The component url
 * @returns The component generator
 */
export const load = (url) => {
  return function () {
    return generateIframe({ url, args: arguments });
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
export const generateIframe = (options) => {
  let iframe = document.createElement("iframe");
  iframe.src = options.url;
  iframe.style.border = "none";

  iframe.onload = async () => {
    iframe.contentWindow.componentHandler = componentHandler;
    iframe.contentWindow.isComponent = true;
    iframe.contentWindow.args = options.args;
    iframe.contentWindow.setDimensions = (width, height) => {
      iframe.width = width;
      iframe.height = height;
      window.autoSetDimensions && window.autoSetDimensions();
    };
    iframe.contentWindow.reportComponentApi = async (api) => {
      returnObj.component = api;
      for (let i of initResolve) await i();
    };

    let contentWrap = iframe.contentDocument.createElement("div");
    contentWrap.id = "componentWrap";
    contentWrap.style.position = "absolute";
    for (let i of iframe.contentDocument.body.childNodes) {
      contentWrap.appendChild(i);
    }
    iframe.contentDocument.body.appendChild(contentWrap);

    for (let i of loadResolve) await i();

    let script = iframe.contentDocument.createElement("script");
    script.type = "module";
    script.text = componentHandler;
    iframe.contentDocument.documentElement.appendChild(script);
  };
  let initResolve = [];
  let loadResolve = [];

  let returnObj = {
    element: iframe,
    component: {},
    init: (job) => {
      initResolve.push(job);
    },
    load: (job) => {
      loadResolve.push(job);
    },
  };

  return returnObj;
};

/**
 * This function should run on component startup
 */
export const startup = async () => {
  window.load = load;

  let handler = document.getElementById("handler");
  if (!handler) throw new Error("Cant find handler " + window.location);
  let importObject = await import(handler.src);

  insertComponents();

  await importObject.create(...window.args);

  autoSetDimensions();
  window.autoSetDimensions = autoSetDimensions;
  new ResizeObserver(autoSetDimensions).observe(
    document.getElementById("componentWrap")
  );

  document.body.style.overflow = "hidden";
  document.body.style.margin = "0";

  window.reportComponentApi(importObject);
};

const autoSetDimensions = () => {
  let calculatedStyle = getComputedStyle(
    document.getElementById("componentWrap")
  );
  window.setDimensions(
    calculatedStyle.width.split("px")[0],
    calculatedStyle.height.split("px")[0]
  );
};

if (window.isComponent) startup();

/**
 * Automatically replaces elements with the class component with an actually component
 */
export const insertComponents = async () => {
  let components = document.getElementsByClassName("component");
  for (let i of components) {
    let attributes = {};
    i.getAttributeNames().forEach(
      (value) => (attributes[value] = i.getAttribute(value))
    );
    let res = await load(i.getAttribute("src"))(attributes);
    i.appendChild(res.element);
    await new Promise((r) => res.init(r));
  }
};
