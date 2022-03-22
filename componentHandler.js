let componentHandler;
if (window.componentHandler) componentHandler = componentHandler;
else componentHandler = await (await fetch("./componentHandler.js")).text();

console.log("yes i do exist");

/**
 * Loads a module template and returns its class
 * @param {Object} options Additional options. Must provide the location of module
 * @return {Module} The module as class
 */
export const load = async (options) => {
  let wrap = document.createElement("div");
  let iframe = document.createElement("iframe");
  iframe.src = options.url;
  iframe.style.border = "none";

  //iframe.style.display = "none";
  wrap.appendChild(iframe);
  document.documentElement.appendChild(wrap);
  await new Promise((r) => (iframe.onload = r));

  iframe.contentWindow.componentHandler = componentHandler;
  iframe.contentWindow.isComponent = true;
  iframe.contentWindow.args = options.args;
  iframe.contentWindow.setDimension = (width, height) => {
    iframe.width = width;
    iframe.height = height;
  };

  let r;

  iframe.contentWindow.loaded = () => {
    r();
  };

  let script = iframe.contentDocument.createElement("script");
  script.type = "module";
  script.text = componentHandler;
  iframe.contentDocument.documentElement.appendChild(script);

  await new Promise((resolve) => (r = resolve));

  await new Promise((r) => setTimeout(r, 2000));

  //document.documentElement.removeChild(iframe);
  iframe.style.display = "unset";

  return { iframe: wrap };
};

export const startup = async () => {
  window.load = load;

  console.log("ich kann nicht mehr");

  let handler = document.getElementById("handler");
  if (!handler) throw new Error("Cant find handler " + window.location);

  let importObject = await import(handler.src);

  importObject.changeName("test 5.0");

  window.loaded();
};

if (window.isComponent) startup();
