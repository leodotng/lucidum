// Matches mustache syntax interpolation check
const interpolationReg = /({{.*?}})/;
// Matches mustache syntax interpolation check when there is multiple entries
const globalInterpolationReg = /({{.*?}})/g;
// Matches both properties and functions in interpolation matches
const innerInterpolationReg = /[\w\.]+/;
// Matches only properties in interpolation matches
const innerDataPropInterpolationReg = /\b\w.+\b(?!(\(\)))/;
// Matches only functions in interpolation matches
const innerFunctionInterpolationReg = /\w+\(\)/;
// Regex to get individual properties from computed function
const dataReg = /([.a-zA-Z])+/g;
// Used to create a new identifier for unique elements
let currentLucidumId = 0;
// Lucidum :)
class Lucidum {
  constructor(constructorData) {
    // Redefines 'this' to another reference
    let root = this;
    // Defines data reference
    // Using https://github.com/ElliotNB/observable-slim
    this.data = ObservableSlim.create(constructorData.data, true, function (changes) {
      const changedPropName = changes[0].currentPath;
      const changedPropNewValue = changes[0].newValue;
      const changedPropOldValue = changes[0].previousValue;
      // console.log(`${changedPropName} changed from ${changedPropOldValue} to ${changedPropNewValue}`);
      // Renders page with updated property value
      if (root.watchersPropList) {
        // Executes watch function for property if it is being watched
        if (root.watchersPropList.includes(changedPropName)) {
          let watcherIndex = root.watchers.findIndex(function (el) {
            return el.prop;
          });
          root.watchers[watcherIndex].fn.apply(root.data, [changedPropNewValue, changedPropOldValue]);
        }
      }
      // Checks if changed property is a property that is bound to elements
      if (root.bindValPropList.includes(changedPropName)) {
        const bindValElements = document.querySelectorAll(
          `${root.appContainerElement} *[bindval^='${changedPropName}']`
        );
        bindValElements.forEach((el) => (el.value = changedPropNewValue));
      }
      // Checks if changed property effects a property that is looped through
      let reEvaluatedPropName = changedPropName.replace(/.\d.\w.*/g, "");
      if (root.loopForPropList.includes(reEvaluatedPropName)) {
        root.updateLoopElements(reEvaluatedPropName);
      }
      if (!root.loopForPropList.includes(changedPropName)) root.render(changedPropName);
    });
    // Defines methods reference
    this.methods = constructorData.methods || {};
    // Defines interpolation elements list
    this.interpolationElements = {};
    // Defines components reference
    this.components = constructorData.components || {};
    // Run created hook if exists
    if (constructorData.onCreate) constructorData.onCreate.call(this.data);
    if (constructorData.watch) {
      // Root watchers definition
      this.watchers = constructorData.watch;
      // Stores all properties that are watched
      this.watchersPropList = [];
      // Creates list of properties being watched
      this.compileWatchersPropList();
      // Defines app container element
    }
    this.appContainerElement = constructorData.el || "#app";
    if (!document.querySelector(this.appContainerElement))
      console.error("There was no app container found with the selector:", this.appContainerElement);
    // Computes all interpolated properties
    this.computeInterpolatedFunctions();
    // Computes all interpolated properties
    this.computeInterpolatedProperties();
    // Stores list of value bound properties for easy checking
    this.bindValPropList = [];
    // Stores all conditional properties and their elements
    this.ifShowCases = {};
    // Stores list of conditional properties for easy checking
    this.ifShowPropList = [];
    // Defines current evaluation of conditional check
    this.currentConditionalEval = false;
    // Initial Render
    for (const prop in this.interpolationElements) root.render(prop);
    // Defines list of list/loop elements and their properties
    this.loopForElements = {};
    // Defines list of properties for list/loop elements
    this.loopForPropList = [];
    // Initial computation of elements with looping properties
    this.computeLoopProperties();
    // Initial computation of elements with custom attributes
    this.computeCustomAttributes();
    // Initial computation of conditional elements
    this.compileIfShowPropList();
    // Checks each property in list and updates elements accordingly
    this.ifShowPropList.forEach((prop) => this.updateConditionalElements(prop));
  }
  // Computes elements containing interpolation function references
  computeInterpolatedFunctions() {
    const root = this;
    const appElements = document.querySelectorAll(`${root.appContainerElement} *`);
    appElements.forEach((el) => {
      const elementContent = el.innerHTML;
      const interpolationMatch = elementContent.match(interpolationReg);
      if (interpolationMatch !== null) {
        const allMatches = uniq(elementContent.match(globalInterpolationReg));
        allMatches.forEach((entry) => {
          let interpolationFunctionName = entry.match(innerFunctionInterpolationReg);
          if (interpolationFunctionName !== null) {
            interpolationFunctionName = interpolationFunctionName[0].match(/\w+/)[0];
            if (root.methods[interpolationFunctionName])
              el.innerHTML = el.innerHTML.replace(entry, root.methods[interpolationFunctionName]());
            else console.error(`No function with name: '${interpolationFunctionName}' exists.`);
          }
        });
      }
    });
  }
  // Computes elements containing interpolation references
  computeInterpolatedProperties() {
    const root = this;
    const appElements = document.querySelectorAll(`${root.appContainerElement} *`);
    appElements.forEach((el) => {
      const elementContent = el.innerHTML;
      const interpolationMatch = elementContent.match(interpolationReg);
      if (interpolationMatch !== null) {
        const allMatches = uniq(elementContent.match(globalInterpolationReg));
        allMatches.forEach((entry) => {
          let interpolationDataName = entry.match(innerDataPropInterpolationReg);
          if (interpolationDataName !== null) {
            interpolationDataName = interpolationDataName[0];
            if (resolveObjVal(root.data, interpolationDataName) !== undefined) {
              let newLucidumId;
              if (el.attributes.lucidumid) newLucidumId = Number(el.attributes.lucidumid.value);
              else newLucidumId = ++currentLucidumId;
              el.setAttribute("lucidumid", newLucidumId);
              if (!this.interpolationElements[interpolationDataName])
                this.interpolationElements[interpolationDataName] = [];
              this.interpolationElements[interpolationDataName].push({
                lucidumid: newLucidumId,
                elContent: el.outerHTML
              });
            } else {
              if (el.parent && !el.parent.children[0].attributes.loopfor)
                console.error(`No property with name: '${interpolationDataName}' exists.`);
            }
          }
        });
      }
    });
  }
  // Computes elements which loop through items or a specific amount of times
  computeLoopProperties() {
    const root = this;
    const appElements = document.querySelectorAll(`${root.appContainerElement} *`);
    appElements.forEach((el) => {
      const loopAttr = el.attributes.loopfor;
      if (loopAttr) {
        let props = loopAttr.value.replace(/\s\s+/gi, " ").trim();
        if (props.match(/( in | of )/)) {
          let newLucidumId = ++currentLucidumId;
          el.setAttribute("lucidumid", newLucidumId);
          props = props.split(/( in | of )/);
          if (props[1].trim() === "in") {
            let subProps = props[0].match(/\w.\S*\b/g);
            if (subProps.length > 1) {
              root.loopForPropList.push(props[2]);
              root.loopForElements[props[2]] = {
                mainElId: newLucidumId,
                otherElIds: [],
                originalContent: el.innerHTML
              };
              let newList = resolveObjVal(root.data, props[2]);
              let valueReg = new RegExp(`\{\{${subProps[1]}.*?\}\}`);
              let indexReg = new RegExp(`\{\{${subProps[0]}\}\}`, "g");
              if (newList.length > 0) {
                el.style.display = "";
                for (let i = newList.length - 1; i > 0; i--) {
                  let newEl = el.cloneNode(true);
                  while (valueReg.exec(newEl.innerHTML)) {
                    let itemMatch = newEl.innerHTML.match(valueReg)[0].match(innerInterpolationReg)[0];
                    itemMatch = itemMatch.split(`${itemMatch.split(".")[0]}.`)[1];
                    if (itemMatch === undefined) {
                      newEl.innerHTML = newEl.innerHTML.replace(valueReg, newList[i]);
                    } else {
                      let listData = resolveObjVal(root.data, `${props[2]}`);
                      newEl.innerHTML = newEl.innerHTML.replace(valueReg, listData[i][itemMatch]);
                    }
                  }
                  newEl.innerHTML = newEl.innerHTML.replace(indexReg, i + 1);
                  newLucidumId = ++currentLucidumId;
                  newEl.removeAttribute("loopfor");
                  root.loopForElements[props[2]].otherElIds.push(newLucidumId);
                  newEl.setAttribute("lucidumid", newLucidumId);
                  insertAfterEl(el, newEl);
                }
                while (valueReg.exec(el.innerHTML)) {
                  let itemMatch = el.innerHTML.match(valueReg)[0].match(innerInterpolationReg)[0];
                  itemMatch = itemMatch.split(`${itemMatch.split(".")[0]}.`)[1];
                  if (itemMatch === undefined) {
                    el.innerHTML = el.innerHTML.replace(valueReg, newList[0]);
                  } else {
                    let listData = resolveObjVal(root.data, `${props[2]}`);
                    el.innerHTML = el.innerHTML.replace(valueReg, listData[0][itemMatch]);
                  }
                }
                el.innerHTML = el.innerHTML.replace(indexReg, 1);
              } else el.style.display = "none";
            } else {
              // only with value
            }
          } else {
            console.log("its a object loop");
          }
        } else {
          console.error(`Invalid loopfor attribute at element:`, el, `Please specify either 'in' or 'of'`);
        }
      }
    });
  }
  // Computes updated loop elements
  updateLoopElements(changedProp) {
    const root = this;
    for (let i = root.ifShowCases[changedProp].length - 1; i > -1; i--) {
      if (document.querySelector(`${root.appContainerElement} *[lucidumid="${root.ifShowCases[changedProp][i].lucidumid}"]`)) root.ifShowCases[changedProp].splice(i, 1);
    }
    root.loopForElements[changedProp].otherElIds.forEach((id) => {
      document.querySelector(`${root.appContainerElement} *[lucidumid="${id}"]`).remove();
    });
    root.loopForElements[changedProp].otherElIds = [];
    const el = document.querySelector(
      `${root.appContainerElement} *[lucidumid="${root.loopForElements[changedProp].mainElId}"]`
    );
    el.innerHTML = root.loopForElements[changedProp].originalContent;
    const loopAttr = el.attributes.loopfor;
    if (loopAttr) {
      let props = loopAttr.value.replace(/\s\s+/gi, " ").trim();
      if (props.match(/( in | of )/)) {
        props = props.split(/( in | of )/);
        if (props[1].trim() === "in") {
          let subProps = props[0].match(/\w.\S*\b/g);
          if (subProps.length > 1) {
            let newList = resolveObjVal(root.data, props[2]);
            let valueReg = new RegExp(`\{\{${subProps[1]}.*?\}\}`);
            let indexReg = new RegExp(`\{\{${subProps[0]}\}\}`, "g");
            if (newList.length > 0) {
              el.style.display = "";
              for (let i = newList.length - 1; i > 0; i--) {
                let newEl = el.cloneNode(true);
                while (valueReg.exec(newEl.innerHTML)) {
                  let itemMatch = newEl.innerHTML.match(valueReg)[0].match(innerInterpolationReg)[0];
                  itemMatch = itemMatch.split(`${itemMatch.split(".")[0]}.`)[1];
                  if (itemMatch === undefined) {
                    newEl.innerHTML = newEl.innerHTML.replace(valueReg, newList[i]);
                  } else {
                    let listData = resolveObjVal(root.data, `${props[2]}`);
                    newEl.innerHTML = newEl.innerHTML.replace(valueReg, listData[i][itemMatch]);
                  }
                }
                newEl.innerHTML = newEl.innerHTML.replace(indexReg, i + 1);
                let newLucidumId = ++currentLucidumId;
                newEl.removeAttribute("loopfor");
                root.loopForElements[props[2]].otherElIds.push(newLucidumId);
                newEl.setAttribute("lucidumid", newLucidumId);
                insertAfterEl(el, newEl);
              }
              while (valueReg.exec(el.innerHTML)) {
                let itemMatch = el.innerHTML.match(valueReg)[0].match(innerInterpolationReg)[0];
                itemMatch = itemMatch.split(`${itemMatch.split(".")[0]}.`)[1];
                if (itemMatch === undefined) {
                  el.innerHTML = el.innerHTML.replace(valueReg, newList[0]);
                } else {
                  let listData = resolveObjVal(root.data, `${props[2]}`);
                  el.innerHTML = el.innerHTML.replace(valueReg, listData[0][itemMatch]);
                }
              }
              el.innerHTML = el.innerHTML.replace(indexReg, 1);
            } else el.style.display = "none";
          } else {
            // only with value
          }
        } else {
          console.log("its a object loop");
        }
      } else {
        console.error(`Invalid loopfor attribute at element:`, el, `Please specify either 'in' or 'of'`);
      }
    }
    root.computeCustomAttributes();
  }
  // Parses code into usuable code for the other functions
  computeCustomFunctions(funcData) {
    const root = this;
    const unparsedCodeVariables = funcData.match(dataReg);
    unparsedCodeVariables.forEach((val) => {
      if (resolveObjVal(root.data, val) !== undefined) funcData = funcData.replace(val, `root.data.${val}`);
      if (root.methods[val]) funcData = funcData.replace(`${val}()`, `root.methods['${val}'].call(root.data)`);
    });
    return funcData;
  }
  // Computes custom attributes for elements
  computeCustomAttributes() {
    const root = this;
    const appElements = document.querySelectorAll(`${root.appContainerElement} *`);
    appElements.forEach((el) => {
      const attrs = Array.from(el.attributes);
      attrs.forEach((atr) => {
        if (atr.name.substr(0, 1) === "@") {
          // Compute custom events
          const parsedAttrEventName = atr.name.substr(1);
          const parsedAttrEventVal = atr.value;
          if (possibleEventList.includes(parsedAttrEventName)) {
            const finalEvaluation = root.computeCustomFunctions(parsedAttrEventVal);
            el.addEventListener(parsedAttrEventName, function () {
              Function(`"use strict"; const root = this; ${finalEvaluation};`).call(root);
            });
            el.removeAttribute(`@${parsedAttrEventName}`);
          } else console.error(`Event ${parsedAttrEventName} does not exist.`);
        } else if (atr.name === "bindval") {
          const props = el.attributes.bindval.value.replace(/\s\s+/gi, " ").trim();
          const dataVal = props.split(" ")[0];
          const eventType = props.split(" ")[1];
          const dataType = typeof resolveObjVal(root.data, dataVal);
          el.value = resolveObjVal(root.data, dataVal);
          const finalEvaluation = root.computeCustomFunctions(dataVal);
          if (eventType === "@input" || eventType === undefined) {
            el.addEventListener("input", function (e) {
              let newValue = e.target.value;
              if (dataType === "number") newValue = Number(newValue);
              else newValue = `'${newValue}'`;
              Function(`"use strict"; const root = this; ${finalEvaluation} = ${newValue};`).call(root);
            });
          } else {
            el.addEventListener("change", function (e) {
              let newValue = e.target.value;
              if (dataType === "number") newValue = Number(newValue);
              else newValue = `'${newValue}'`;
              Function(`"use strict"; const root = this; ${finalEvaluation} = ${newValue};`).call(root);
            });
          }
          if (!root.bindValPropList.includes(dataVal)) root.bindValPropList.push(dataVal);
        } else if (atr.name === "showif") {
          const rawEval = el.attributes.showif.value;
          const evaluatedProps = rawEval.split(" ");
          const arrayEval = evaluatedProps[0].match(/\w.*\B.(?=\[) ?/g);
          if (arrayEval !== null) evaluatedProps[0] = arrayEval[0];
          if (resolveObjVal(root.data, evaluatedProps[0]) !== undefined) {
            if (root.ifShowCases[evaluatedProps[0]] === undefined) root.ifShowCases[evaluatedProps[0]] = [];
            let lucidumid = ++currentLucidumId;
            let elseLucidumId = -1;
            let findingElseEl = true;
            let nextSibling = el.nextElementSibling;
            while (findingElseEl) {
              if (nextSibling !== null) {
                if (nextSibling.hasAttribute("showelse")) {
                  findingElseEl = false;
                  elseLucidumId = ++currentLucidumId;
                  nextSibling.setAttribute("lucidumid", elseLucidumId);
                  nextSibling.removeAttribute("showelse");
                } else nextSibling = nextSibling.nextElementSibling; // have not found matching else element yet
              } else findingElseEl = false; // no more/other sibling elements
            }
            root.ifShowCases[evaluatedProps[0]].push({
              lucidumid,
              elseLucidumId,
              condition: rawEval
            });
            el.setAttribute("lucidumid", lucidumid);
          }
          // el.removeAttribute("showif");
        } else {
          if (/(data-)\w+/g.exec(atr.name) !== null) return;
          if (!possibleAttributeList.includes(atr.name)) console.error(`Attribute ${atr.name} does not exist.`);
        }
      });
    });
  }
  // Computes if changed property should update conditional rendering
  updateConditionalElements(changedProp) {
    const root = this;
    if (changedProp.split(".").length > 1) changedProp = changedProp.replace(/.\d.\w.*/g, "");
    if (root.ifShowPropList.includes(changedProp)) {
      root.ifShowCases[changedProp].forEach((isc) => {
        // Selects main conditional element
        let conditionalElement = document.querySelector(`[lucidumid="${isc.lucidumid}"]`);
        // Selects secondary conditional element if it exists
        let elseElement;
        if (isc.elseLucidumId !== undefined) elseElement = document.querySelector(`[lucidumid="${isc.elseLucidumId}"]`);
        // Checks to make sure element still exists
        // Should never have this error, but I suppose it is possible
        if (conditionalElement === null) {
          console.error("Element that had a conditional was removed and can not be found now.");
          return false;
        }
        // Evaluates conditional to be able to reference main data
        let newEvaluation = root.computeCustomFunctions(isc.condition);
        // Evaluates conditional
        Function(
          `"use strict"; const root = this; if(${newEvaluation}){root.currentConditionalEval=true;}else{root.currentConditionalEval=false;}`
        ).call(root);
        // Swaps display values between the one (or two) element(s) depending on the return of the conditional
        if (root.currentConditionalEval === true) {
          conditionalElement.style.display = "";
          if (elseElement) elseElement.style.display = "none";
        } else if (root.currentConditionalEval === false) {
          conditionalElement.style.display = "none";
          if (elseElement) elseElement.style.display = "";
        }
      });
    }
  }
  // Compiles list of conditional keys to check
  compileIfShowPropList() {
    const root = this;
    // Pushes each property from the conditional cases to an array to later check
    for (const key in root.ifShowCases) root.ifShowPropList.push(key);
  }
  // Compiles list of watched properties
  compileWatchersPropList() {
    const root = this;
    // Pushes each property from the watchers into an array to later check
    root.watchers.forEach((entry) => root.watchersPropList.push(entry.prop));
  }
  // Render the new changes
  render(changedProp) {
    const root = this;
    const updatedElements = root.interpolationElements[changedProp];
    if (updatedElements) {
      updatedElements.forEach((el) => {
        const selectedElement = document.querySelector(`${root.appContainerElement} *[lucidumid="${el.lucidumid}"]`);
        let temp = el.elContent;
        while (interpolationReg.exec(temp)) {
          const match = interpolationReg.exec(temp);
          const templateItem = innerInterpolationReg.exec(match[0])[0];
          const propVal = resolveObjVal(root.data, templateItem);
          temp = temp.replace(match[0], propVal);
        }
        selectedElement.outerHTML = temp;
      });
    }
    root.updateConditionalElements(changedProp);
  }
}
// Polyfill for Array.includes
// https://tc39.github.io/ecma262/#sec-array.prototype.includes
if (!Array.prototype.includes) {
  Object.defineProperty(Array.prototype, "includes", {
    value: function (searchElement, fromIndex) {
      if (this == null) {
        throw new TypeError('"this" is null or not defined');
      }
      // 1. Let O be ? ToObject(this value).
      var o = Object(this);
      // 2. Let len be ? ToLength(? Get(O, "length")).
      var len = o.length >>> 0;
      if (len === 0) {
        return false;
      }
      // 4. Let n be ? ToInteger(fromIndex).
      //    (If fromIndex is undefined, this step produces the value 0.)
      var n = fromIndex | 0;
      // 5. If n ≥ 0, then
      //  a. Let k be n.
      // 6. Else n < 0,
      //  a. Let k be len + n.
      //  b. If k < 0, let k be 0.
      var k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

      function sameValueZero(x, y) {
        return x === y || (typeof x === "number" && typeof y === "number" && isNaN(x) && isNaN(y));
      }
      while (k < len) {
        // a. Let elementK be the result of ? Get(O, ! ToString(k)).
        // b. If SameValueZero(searchElement, elementK) is true, return true.
        if (sameValueZero(o[k], searchElement)) {
          return true;
        }
        k++;
      }
      return false;
    }
  });
}
// Returns all unique elements in an array
// https://stackoverflow.com/a/9229821
const uniq = (a) => {
  let seen = {};
  let out = [];
  let len = a.length;
  let j = 0;
  for (let i = 0; i < len; i++) {
    let item = a[i];
    if (seen[item] !== 1) {
      seen[item] = 1;
      out[j++] = item;
    }
  }
  return out;
};
// Returns an object from a multi-level string path
const resolveObjVal = (obj, path) => {
  path = path.split(".");
  while (path.length) {
    if (typeof obj !== "object") return undefined;
    // Shifts path until final object path value is found
    obj = obj[path.shift()];
  }
  return obj;
};
// Inserts an element after another one
const insertAfterEl = (referenceNode, newNode) => {
  referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
};
// Polyfill for Nodelist.forEach
// https://developer.mozilla.org/en-US/docs/Web/API/NodeList/forEach
if (window.NodeList && !NodeList.prototype.forEach) {
  NodeList.prototype.forEach = function (callback, thisArg) {
    thisArg = thisArg || window;
    for (let i = 0; i < this.length; i++) callback.call(thisArg, this[i], i, this);
  };
}