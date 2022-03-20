let componentHandler;
if (window.componentHandler) componentHandler = componentHandler;
else componentHandler = await (await fetch("./componentHandler.js")).text();

/**
 * Loads a module template and returns its class
 * @param {Object} options Additional options. Must provide the location of module
 * @return {Module} The module as class
 */
export const load = async (options) => {
  let iframe = document.createElement("iframe");
  iframe.src = options.url;
  iframe.style.border = "none";
  document.body.appendChild(iframe);
  while (!iframe.contentDocument) {
    console.log(iframe);
    await new Promise((r) => setTimeout(r, 1000));
  }

  iframe.contentWindow.componentHandler = componentHandler;

  let script = document.createElement("script");
  script.type = "module";
  script.innerText = componentHandler;
  iframe.contentDocument.documentElement.appendChild(script);

  document.body.appendChild(iframe);
  return iframe;
  const code = await (await fetch(options.url)).text();
  let parsed = options.lib.parse(code);
  /* let handler;
  for (let i in parsed)
    if (
      parsed[i].type == "html" &&
      parsed[i].tag == "script" &&
      parsed[i].attributes
    ) {
      let isHandler = false;
      for (let x of parsed[i].attributes)
        if (x.attribute == "id" && x.value == "handler") isHandler = true;
      if (isHandler) handler = parsed.splice(i, 1)[0];
    }
  if (!handler) throw new Error("Cant find handler script in " + options.url);
  let src;
  for (let i of handler.attributes) if (i.attribute == "src") src = i.value;
  let urlSplit = options.url.split("/");
  urlSplit.pop();
  urlSplit.push(src);
  let srcUrl = urlSplit.join("/"); */
  parsed.push({
    type: "html",
    tag: "script",
    attributes: [{ attribute: "type", value: "html" }],
    innerHTML: [{ type: "text", text: componentHandler }],
  });

  let build = options.lib.build(parsed);

  let doc = document.implementation.createHTMLDocument("component");
  doc.removeChild(doc.documentElement);
  let html = doc.createElement("html");
  build.forEach((elem) => {
    try {
      html.appendChild(elem);
    } catch (e) {
      console.log(e);
    }
  });

  console.log(html);
  //document.body.appendChild(html);
  //let frame = document.createElement("iframe");
  //frame.src = "about:blank";
  let frame = document.getElementById("empty");
  while (!frame.contentDocument) {
    console.log(frame);
    await new Promise((r) => setTimeout(r, 1000));
  }

  frame.style.border = "none";
  frame.contentDocument.replaceChild(
    html,
    frame.contentDocument.documentElement
  );

  return frame;
};
