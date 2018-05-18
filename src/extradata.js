// https://developer.mozilla.org/en-US/docs/Web/Events
const possibleEventList = [
  "input",
  "change",
  "submit",
  "reset",
  "keydown",
  "keypress",
  "keyup",
  "mouseenter",
  "mouseover",
  "mousemove",
  "mousedown",
  "mouseup",
  "auxclick",
  "click",
  "dblclick",
  "contextmenu",
  "wheel",
  "mouseleave",
  "mouseout",
  "select",
  "dragstart",
  "drag",
  "dragend",
  "dragenter",
  "dragover",
  "dragleave",
  "drop",
  "durationchange",
  "loadedmetadata",
  "loadeddata",
  "canplay",
  "canplaythrough",
  "ended",
  "emptied",
  "stalled",
  "suspend",
  "play",
  "playing",
  "pause",
  "waiting",
  "seeking",
  "seeked",
  "ratechange",
  "timeupdate",
  "volumechange",
  "complete",
  "audioprocess"
];

// https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes
const possibleAttributeList = [
  "accept",
  "accept-charset",
  "accesskey",
  "action",
  "align",
  "alt",
  "async",
  "autocapitalize",
  "autocomplete",
  "autofocus",
  "autoplay",
  "bgcolor",
  "border",
  "buffered",
  "challenge",
  "charset",
  "checked",
  "cite",
  "class",
  "code",
  "codebase",
  "color",
  "cols",
  "colspan",
  "content",
  "http-equiv",
  "name",
  "contenteditable",
  "contextmenu",
  "controls",
  "coords",
  "crossorigin",
  "data",
  "data-*",
  "datetime",
  "default",
  "defer",
  "dir",
  "dirname",
  "disabled",
  "download",
  "draggable",
  "dropzone",
  "enctype",
  "method",
  "for",
  "form",
  "formaction",
  "headers",
  "height",
  "hidden",
  "high",
  "href",
  "hreflang",
  "http-equiv",
  "icon",
  "id",
  "integrity",
  "ismap",
  "itemprop",
  "keytype",
  "kind",
  "label",
  "lang",
  "language",
  "list",
  "loop",
  "low",
  "manifest",
  "max",
  "maxlength",
  "minlength",
  "media",
  "method",
  "GET",
  "POST",
  "min",
  "multiple",
  "email",
  "file",
  "muted",
  "name",
  "novalidate",
  "open",
  "optimum",
  "pattern",
  "ping",
  "placeholder",
  "poster",
  "preload",
  "radiogroup",
  "readonly",
  "rel",
  "required",
  "reversed",
  "rows",
  "rowspan",
  "sandbox",
  "scope",
  "scoped",
  "seamless",
  "selected",
  "shape",
  "size",
  "sizes",
  "slot",
  "span",
  "spellcheck",
  "src",
  "srcdoc",
  "srclang",
  "srcset",
  "start",
  "step",
  "style",
  "summary",
  "tabindex",
  "target",
  "title",
  "translate",
  "text",
  "type",
  "usemap",
  "value",
  "width",
  "wrap",
  // Custom lucidum attributes
  "lucidumid",
  "loopfor"
];