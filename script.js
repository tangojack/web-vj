let ws = new WebSocket("wss://tangosocket.onrender.com:443");
// let ws = new WebSocket("ws://localhost:5001");


const pane = new Tweakpane.Pane();

let project = {}; //Contains TD's Data format to be sent back
let projectSchema = {};
let projectTypes = {}; // Contains TD's Data types
let projectParams = {}; // Holds state for Tweakpane UI
let projectParamsLookup = {}; // Contains the association between a TD param and the UI params

let updatingUI = false; //keeps track of user input to throttle messages
let timeOutID = null; //time out for throtteling messages

// Handles updating the state used for TD componenets
function updateState(name, componentType, params, value, stateChanges) {
  if (componentType === "XY") {
    params[name + "x"][0] = value["x"];
    stateChanges[name + "x"] = params[name + "x"];
    params[name + "y"][0] = value["y"];
    stateChanges[name + "y"] = params[name + "y"];
  } else if (componentType === "XYZ") {
    params[name + "x"][0] = value["x"];
    stateChanges[name + "x"] = params[name + "x"];
    params[name + "y"][0] = value["y"];
    stateChanges[name + "y"] = params[name + "y"];
    params[name + "z"][0] = value["z"];
    stateChanges[name + "z"] = params[name + "z"];
  } else if (componentType === "XYZW") {
    params[name + "x"][0] = value["x"];
    stateChanges[name + "x"] = params[name + "x"];
    params[name + "y"][0] = value["y"];
    stateChanges[name + "y"] = params[name + "y"];
    params[name + "z"][0] = value["z"];
    stateChanges[name + "z"] = params[name + "z"];
    params[name + "w"][0] = value["w"];
    stateChanges[name + "w"] = params[name + "w"];
  } else if (componentType === "RGB") {
    params[name + "r"][0] = value["r"];
    stateChanges[name + "r"] = params[name + "r"];
    params[name + "g"][0] = value["g"];
    stateChanges[name + "g"] = params[name + "g"];
    params[name + "b"][0] = value["b"];
    stateChanges[name + "b"] = params[name + "b"];
  } else if (componentType === "RGBA") {
    params[name + "r"][0] = value["r"];
    stateChanges[name + "r"] = params[name + "r"];
    params[name + "g"][0] = value["g"];
    stateChanges[name + "g"] = params[name + "g"];
    params[name + "b"][0] = value["b"];
    stateChanges[name + "b"] = params[name + "b"];
    params[name + "a"][0] = value["a"];
    stateChanges[name + "a"] = params[name + "a"];
  } else if (
    componentType === "Float2" ||
    componentType === "Float3" ||
    componentType === "Float4" ||
    componentType === "Int2" ||
    componentType === "Int3" ||
    componentType === "Int4"
  ) {
    let size = parseFloat(componentType.slice(-1));
    let rename = ["x", "y", "z", "w"];
    for (let i = 1; i <= size; i++) {
      params[name + i][0] = value[rename[i - 1]];
      stateChanges[name + i] = params[name + i];
    }
  } else if (componentType === "UV") {
    params[name + "u"][0] = value["x"];
    stateChanges[name + "u"] = params[name + "u"];
    params[name + "v"][0] = value["y"];
    stateChanges[name + "v"] = params[name + "v"];
  } else if (componentType === "UVW") {
    params[name + "u"][0] = value["x"];
    stateChanges[name + "u"] = params[name + "u"];
    params[name + "v"][0] = value["y"];
    stateChanges[name + "v"] = params[name + "v"];
    params[name + "w"][0] = value["z"];
    stateChanges[name + "w"] = params[name + "w"];
  } else if (componentType == "WH") {
    params[name + "w"][0] = value["x"];
    stateChanges[name + "w"] = params[name + "w"];
    params[name + "h"][0] = value["y"];
    stateChanges[name + "h"] = params[name + "h"];
  }
}

// retrieves data and ui settings for a provided element
function parseData(componentType, size, info, par, name, useMinMax) {
  let data = {};
  let dataParams = {};
  let value = info[name];
  // try {
  //   dataParams['disabled'] = true//info[name].readOnly && !info[name].enabled;
  // } catch (e) {

  // }
  if (
    componentType === "XY" ||
    componentType === "XYZ" ||
    componentType === "XYZW" ||
    componentType === "Float2" ||
    componentType === "Float3" ||
    componentType === "UV" ||
    componentType === "UVW" ||
    componentType === "WH"
  ) {
    let rename = ["x", "y", "z", "w"];
    let tdDataName = rename;
    if (componentType === "UV" || componentType === "UVW") {
      tdDataName = ["u", "v", "w"];
    } else if (componentType === "WH") {
      tdDataName = ["w", "h"];
    }
    for (let i = 0; i < componentType.length; i++) {
      let currName = rename[i];
      data[currName] = info[name + tdDataName[i]][0];
      if(useMinMax) {
        if (currName === "y") {
          dataParams[currName] = {
            inverted: true,
            min: par.normMin[i - 1],
            max: par.normMax[i - 1],
          };
        } else {
          dataParams[currName] = {
            min: par.normMin[i - 1],
            max: par.normMax[i - 1],
          };
        }
      } else {
        if (currName === "y") {
          dataParams[currName] = {
            inverted: true,
          };
        }
      }
    }
    return { data, dataParams };
  } else if (componentType === "RGB" || componentType === "RGBA") {
    let rename = ["r", "g", "b", "a"];
    dataParams["color"] = { type: "float" };
    for (let i = 0; i < componentType.length; i++) {
      let currName = rename[i];
      data[currName] = info[name + rename[i]][0];
    }
    return { data, dataParams };
  } else if (componentType === "Float" || componentType === "Int") {
    if (size == 1) {
      if(useMinMax) {
        dataParams["min"] = par.normMin[0];
        dataParams["max"] = par.normMax[0];
      }
      return { data: value[0], dataParams };
    } else {
      let rename = ["x", "y", "z", "w"];
      for (let i = 1; i <= size; i++) {
        let currInfo = info[name + i][0];
        let currName = rename[i - 1];
        data[currName] = currInfo;
        if(useMinMax) {
          if (currName === "y") {
            dataParams[currName] = {
              inverted: true,
              min: par.normMin[i - 1],
              max: par.normMax[i - 1],
            };
          } else {
            dataParams[currName] = {
              min: par.normMin[i - 1],
              max: par.normMax[i - 1],
            };
          }
        } else {
          if (currName === "y") {
            dataParams[currName] = {
              inverted: true,
            };
          }
        }
        if (componentType === "Int") {
          dataParams[currName]["step"] = 1;
        }
      }
      return { data, dataParams };
    }
  }
  return { data: value[0], dataParams: {} };
}

//data
function updateGui(schema, newInfo, componentName, params, useMinMax) {
  for (const [key, val] of Object.entries(newInfo)) {
    let componentTypes = projectTypes[componentName];
    let { componentType, size, info, par, name } =
      projectParamsLookup[componentName][key];
    let output = parseData(componentType, size, newInfo, par, name, useMinMax);
    if (output && "data" in output) {
      let data = output.data;
      params[name] = data;
    }
  }
  
  //Updates all the elements
  // for (const [page, parameter] of Object.entries(schema)) {
  //   for (const [name, par] of Object.entries(parameter)) {
  //     let componentType = par.style;
  //     if(componentType == 'Toggle' && par.size >=2 || name === 'resizew'
  //       || name === 'resizeh') {
  //       continue;
  //     }
  //     console.log('update', name, componentType, par.size, info, par)
  //     let output = parseData(componentType, par.size, info, par, name);
  //     if(output && 'data' in output){
  //       let data = output.data;
  //       params[name] = data;
  //     }
  //   }
  // }
  pane.refresh();
}

function initGUI(schema, info, componentName, params, expanded, useMinMax) {
  if (componentName in project) return;
  const f1 = pane.addFolder({
    title: componentName,
    expanded,
  });
  project[componentName] = info; //store the TD data
  projectSchema[componentName] = schema;
  projectTypes[componentName] = {};
  projectParamsLookup[componentName] = {};
  let componentTypes = projectTypes[componentName];

  let tabNames = Object.keys(schema).map((page) => ({ title: page }));
  const tabs = f1.addTab({
    pages: tabNames,
  });

  let pageIndex = 0;
  for (const [page, parameter] of Object.entries(schema)) {
    for (const [name, par] of Object.entries(parameter)) {
      let componentType = par.style;
      if (
        (componentType == "Toggle" && par.size >= 2) ||
        name === "resizew" ||
        name === "resizeh" ||
        name === "repositionx" ||
        name === "repositiony" ||
        name === "margin"
      ) {
        continue;
      }
      projectParamsLookup[componentName][name] = {
        componentType, size: par.size, info, par, name,
      };
      let { dataParams, data } = parseData(componentType, par.size, info, par, name, useMinMax);
      params[name] = data;
      componentTypes[name] = componentType;
      if (componentType === "Float" || componentType === "Int") {
        if (par.size == 1) {
          dataParams = { min: dataParams["min"], max: dataParams["max"] };
          let currParams = { min: dataParams["min"], max: dataParams["max"] };
          if (componentType === "Int") {
            currParams["step"] = 1;
          }
          tabs.pages[pageIndex].addInput(params, name, currParams);
        } else {
          componentTypes[name] = componentType + par.size;
          tabs.pages[pageIndex].addInput(params, name, dataParams);
        }
      } else if (componentType === "Pulse" || componentType === "Momentary") {
        let btn = tabs.pages[pageIndex].addButton({
          title: name,
          label: "Pulse",
        });
        btn.on("click", () => {
          project[componentName][name][0] = true;
          if (componentType === "Pulse") {
            project[componentName][name][0] = 1;
          }
          sendUpdatedTDState(ws, project[componentName], componentName, [name]);
        });
      } else if (componentType === "Menu" || componentType === "StrMenu") {
        let options = {};
        par.menuLabels.forEach((label, index) => {
          options[label] = par.menuNames[index];
        });
        tabs.pages[pageIndex].addInput(params, name, { options });
      } else {
        tabs.pages[pageIndex].addInput(params, name, dataParams);
      }
    }
    pageIndex += 1;
    f1.on("change", (ev) => {
      updatingUI = true;
      let params = project[componentName];
      let value = ev.value;
      let key = ev.presetKey;
      let stateChanges = {};
      if (key in params) {
        params[key][0] = value;
        stateChanges[key] = params[key];
      } else if (key in projectTypes[componentName]) {
        let type = projectTypes[componentName][key];
        updateState(key, type, params, value, stateChanges);
      }
      clearTimeout(timeOutID);
      timeOutID = setTimeout(() => {
        updatingUI = false;
      }, 100);

      sendUpdatedTDState(ws, stateChanges, componentName);
    });
  }
}

function sendUpdatedTDState(ws, info, componentName, pulse=[]) {
  ws.send(
    JSON.stringify({
      GUIUpdate: true,
      info,
      componentName,
      pulse
    })
  );
}

ws.addEventListener("open", (event) => {
  console.log("Socket connection open");
  ws.send("pong");
  ws.send(JSON.stringify({ getComponentData: true }));
});

ws.addEventListener("message", (message) => {
  if (message && message.data) {
    if (message.data === "ping") {
      console.log("got ping");
      ws.send("pong");
      return;
    }
    let data = JSON.parse(message.data);
    if (data) {
      if ("componentName" in data && "info" in data) {
        let componentName = data["componentName"];
        let openFolder = data["uiParams"]["openFolder"];
        let useMinMax = data["uiParams"]["useMinMax"];
        if (componentName in project) {
          if (!updatingUI) {
            //prevent feedback loop
            updateGui(
              projectSchema[componentName],
              data["info"],
              componentName,
              projectParams[componentName],
              openFolder,
              useMinMax
            );
          }
        } else {
          projectParams[componentName] = {};
          initGUI(
            data["schema"],
            data["info"],
            componentName,
            projectParams[componentName],
            openFolder, 
            useMinMax
          );
        }
      }
    }
  }
});

ws.addEventListener("error", (error) => {
  console.error("Error in the connection", error);
  alert("error connecting socket server", error);
});

ws.addEventListener("close", (event) => {
  console.log("Socket connection closed");
  alert("closing socket server");
});
