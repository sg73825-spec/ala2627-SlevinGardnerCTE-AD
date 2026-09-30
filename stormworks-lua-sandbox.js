const editor = document.querySelector('#lua-editor');
const runButton = document.querySelector('#lua-run');
const resetButton = document.querySelector('#lua-reset');
const output = document.querySelector('#lua-output');
const numberInput = document.querySelector('#sim-input-number');

const starterScript = `function onTick()
    local value = input.getNumber(1)
    output.setNumber(1, value * 100)
    print("Value:", value)
end

function onDraw()
    screen.setColor(220, 220, 180)
    screen.drawText(2, 2, "LEVEL")
end`;

resetButton?.addEventListener('click', () => {
  editor.value = starterScript;
  output.textContent = 'Example loaded. Press Run Script.';
});

runButton?.addEventListener('click', () => {
  const sample = Number(numberInput.value);
  if (!Number.isFinite(sample)) {
    output.textContent = 'Enter a valid number for input channel 1.';
    return;
  }

  runButton.disabled = true;
  output.textContent = 'Running…';
  const frame = document.createElement('iframe');
  frame.setAttribute('sandbox', 'allow-scripts');
  frame.title = 'Isolated Lua test environment';
  frame.hidden = true;
  frame.srcdoc = `<!doctype html><script src="https://cdn.jsdelivr.net/npm/fengari-web@0.1.4/dist/fengari-web.js"><\/script>
    <script>
      window.addEventListener('message', (event) => {
        if (event.source !== parent || event.data.type !== 'run-lua') return;
        const { code, sample } = event.data;
        const prefix = \`local __log = {}
          print = function(...)
            local parts = {}
            for i = 1, select("#", ...) do parts[i] = tostring(select(i, ...)) end
            table.insert(__log, table.concat(parts, "\\t"))
          end
          local __inputs = { [1] = \${sample} }
          local __outputs = {}
          input = { getNumber = function(i) return __inputs[i] or 0 end, getBool = function(i) return false end }
          output = {
            setNumber = function(i, v) __outputs["number " .. i] = v end,
            setBool = function(i, v) __outputs["bool " .. i] = v end
          }
          screen = {
            setColor = function(r, g, b) table.insert(__log, "screen color: " .. r .. ", " .. g .. ", " .. b) end,
            drawClear = function() table.insert(__log, "screen cleared") end,
            drawText = function(x, y, text) table.insert(__log, "screen text (" .. x .. ", " .. y .. "): " .. text) end,
            drawRect = function() table.insert(__log, "screen outline rectangle") end,
            drawRectF = function() table.insert(__log, "screen filled rectangle") end,
            getWidth = function() return 32 end, getHeight = function() return 32 end
          }
        \`;
        const suffix = \`
          if type(onTick) == "function" then onTick() end
          if type(onDraw) == "function" then onDraw() end
          local result = {}
          for name, value in pairs(__outputs) do table.insert(result, name .. " = " .. tostring(value)) end
          for _, line in ipairs(__log) do table.insert(result, line) end
          if #result == 0 then table.insert(result, "Script ran; no output or screen calls to show.") end
          return table.concat(result, "\\n")
        \`;
        try {
          const result = fengari.load(prefix + code + suffix, 'stormworks-test')();
          parent.postMessage({ type: 'lua-result', result }, '*');
        } catch (error) {
          parent.postMessage({ type: 'lua-result', error: String(error) }, '*');
        }
      });
      window.addEventListener('load', () => parent.postMessage({ type: 'lua-ready' }, '*'));
    <\/script>`;
  document.body.append(frame);
  let finished = false;
  const timeout = window.setTimeout(() => {
    finished = true;
    frame.remove();
    output.textContent = 'Stopped: script ran for more than 3 seconds. Check for a loop that never ends.';
    runButton.disabled = false;
  }, 3000);

  const onLuaMessage = (event) => {
    if (event.source !== frame.contentWindow || !['lua-ready', 'lua-result'].includes(event.data?.type)) return;
    if (event.data.type === 'lua-ready') {
      frame.contentWindow.postMessage({ type: 'run-lua', code: editor.value, sample }, '*');
      return;
    }
    if (finished) return;
    window.clearTimeout(timeout);
    window.removeEventListener('message', onLuaMessage);
    frame.remove();
    output.textContent = event.data.error ? `Lua error: ${event.data.error}` : event.data.result;
    runButton.disabled = false;
  };
  window.addEventListener('message', onLuaMessage);
});
