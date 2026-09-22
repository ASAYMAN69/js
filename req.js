/**
 * Declarative HTTP Request Handler (req.js)
 * 
 * Automatically captures configurations declared in script tags (or global scope),
 * supporting multiple independent script blocks and endpoints on the same page.
 * Binds to submit buttons/forms, serializes QUERY and BODY inputs, executes 
 * GET/POST/PUT/PATCH/DELETE requests, and populates RESPONSE mappings into target DOM elements.
 */

// Define global HTTP method constants so unquoted METHOD = GET / POST works without ReferenceErrors
if (typeof window !== 'undefined') {
  window.GET = 'GET';
  window.POST = 'POST';
  window.PUT = 'PUT';
  window.PATCH = 'PATCH';
  window.DELETE = 'DELETE';
}

(function () {
  'use strict';

  /**
   * Helper to find an element by ID or CSS selector.
   * Handles "#myId", "myId", or complex selectors.
   */
  function getElement(selector) {
    if (!selector || typeof selector !== 'string') return null;
    selector = selector.trim();
    if (selector.startsWith('#') || selector.startsWith('.') || selector.startsWith('[') || selector.includes(' ')) {
      return document.querySelector(selector);
    }
    return document.getElementById(selector) || document.querySelector(selector);
  }

  /**
   * Helper to retrieve value from a DOM element (input, select, textarea, or text content).
   */
  function getElementValue(elem) {
    if (!elem) return '';
    const tagName = elem.tagName.toLowerCase();
    
    if (tagName === 'input') {
      const type = (elem.type || 'text').toLowerCase();
      if (type === 'checkbox') {
        return elem.checked ? (elem.value !== 'on' ? elem.value : true) : false;
      }
      if (type === 'radio') {
        return elem.checked ? elem.value : '';
      }
      return elem.value;
    }
    
    if (tagName === 'select' || tagName === 'textarea') {
      return elem.value;
    }
    
    return elem.textContent || elem.innerText || '';
  }

  /**
   * Helper to set value / content into a target DOM element.
   */
  function setElementValue(elem, val) {
    if (!elem) return;
    const tagName = elem.tagName.toLowerCase();
    
    if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
      elem.value = val !== undefined && val !== null ? val : '';
    } else {
      elem.textContent = val !== undefined && val !== null ? val : '';
    }
  }

  /**
   * Resolves nested property in object (e.g. "user.profile.name" or "name").
   */
  function getNestedValue(obj, path) {
    if (!obj || !path) return undefined;
    if (path in obj) return obj[path];
    const parts = path.split('.');
    let curr = obj;
    for (const part of parts) {
      if (curr === null || curr === undefined) return undefined;
      curr = curr[part];
    }
    return curr;
  }

  /**
   * Safely parses an object string representation into a JavaScript object.
   */
  function parseObjectString(rawObjStr) {
    if (!rawObjStr) return null;
    try {
      return JSON.parse(rawObjStr);
    } catch (e) {
      try {
        const formatted = rawObjStr
          .replace(/([{\s,])(\w+)\s*:/g, '$1"$2":') // Quote unquoted keys: key: -> "key":
          .replace(/:\s*#([a-zA-Z0-9_\-]+)/g, ':"#$1"') // Quote unquoted ids: :#id -> :"#id"
          .replace(/:\s*([a-zA-Z0-9_\-]+)(?=[,\}\s])/g, function (m, p1) { // Quote other unquoted values
            if (p1 === 'true' || p1 === 'false' || p1 === 'null' || !isNaN(p1)) return m;
            return ':"' + p1 + '"';
          })
          .replace(/,\s*\}/g, '}');
        return JSON.parse(formatted);
      } catch (e2) {
        try {
          return new Function('return ' + rawObjStr)();
        } catch (e3) {
          console.warn('[req.js] Failed to parse object:', rawObjStr);
          return null;
        }
      }
    }
  }

  /**
   * Extracts balanced object { ... } matching `varName = { ... }`
   */
  function extractObject(varName, text) {
    const markerRegex = new RegExp('(?:const|let|var)?\\s*' + varName + '\\s*=\\s*\\{', 'i');
    const match = text.match(markerRegex);
    if (!match) return null;

    const startIndex = match.index + match[0].length - 1; // start of '{'
    let braceCount = 0;
    let endIndex = -1;

    for (let i = startIndex; i < text.length; i++) {
      if (text[i] === '{') braceCount++;
      else if (text[i] === '}') {
        braceCount--;
        if (braceCount === 0) {
          endIndex = i;
          break;
        }
      }
    }

    if (endIndex === -1) return null;
    const rawObjStr = text.substring(startIndex, endIndex + 1);
    return parseObjectString(rawObjStr);
  }

  /**
   * Parses a single block of configuration text.
   */
  function parseSingleConfigBlock(blockText) {
    const config = {};

    // 1. Extract API_ENDPOINT / API / ENDPOINT
    const apiMatch = blockText.match(/(?:const|let|var)?\s*(?:API_ENDPOINT|ENDPOINT|API)\s*=\s*["'`]([^"'`]+)["'`]/i);
    if (apiMatch) {
      config.endpoint = apiMatch[1].trim();
    }

    // 2. Extract METHOD (with or without quotes)
    const methodMatch = blockText.match(/(?:const|let|var)?\s*METHOD\s*=\s*["'`]?([A-Za-z]+)["'`]?/i);
    if (methodMatch) {
      config.method = methodMatch[1].toUpperCase().trim();
    } else {
      config.method = 'GET';
    }

    // 3. Extract SUBMIT selector (with or without quotes)
    const submitMatch = blockText.match(/(?:const|let|var)?\s*SUBMIT\s*=\s*["'`]?([#.\w\-]+)["'`]?/i);
    if (submitMatch) {
      config.submit = submitMatch[1].trim();
    }

    // 4. Extract Object definitions: QUERY, BODY, RESPONSE
    config.query = extractObject('QUERY', blockText);
    config.body = extractObject('BODY', blockText);
    config.response = extractObject('RESPONSE', blockText);

    return (config.endpoint || config.submit) ? config : null;
  }

  /**
   * Splits script text into separate configuration blocks if multiple exist inside one script tag.
   */
  function parseScriptBlocks(scriptText) {
    // Split by occurrences of API_ENDPOINT / ENDPOINT / API if multiple exist
    const splitKeywords = /(?=(?:const|let|var)?\s*(?:API_ENDPOINT|ENDPOINT|API)\s*=)/gi;
    const chunks = scriptText.split(splitKeywords).map(s => s.trim()).filter(Boolean);

    const blocks = [];
    chunks.forEach(chunk => {
      const parsed = parseSingleConfigBlock(chunk);
      if (parsed) blocks.push(parsed);
    });

    return blocks;
  }

  /**
   * Collects configurations from all inline script tags and global variables.
   */
  function discoverConfigs() {
    const configs = [];

    // Check all inline script tags (ignoring external scripts with src)
    const scripts = document.querySelectorAll('script:not([src])');
    scripts.forEach(script => {
      const text = script.textContent || '';
      if (/(API_ENDPOINT|ENDPOINT|API)\s*=/i.test(text) || /SUBMIT\s*=/i.test(text)) {
        const parsedBlocks = parseScriptBlocks(text);
        parsedBlocks.forEach(cfg => configs.push(cfg));
      }
    });

    // Check window global variables if defined via `var` or `window.*`
    if (window.API_ENDPOINT || window.ENDPOINT || window.API || window.SUBMIT) {
      configs.push({
        endpoint: window.API_ENDPOINT || window.ENDPOINT || window.API,
        method: (window.METHOD || 'GET').toUpperCase(),
        submit: window.SUBMIT,
        query: window.QUERY || null,
        body: window.BODY || null,
        response: window.RESPONSE || null
      });
    }

    return configs;
  }

  /**
   * Executes the HTTP request for a specific configuration.
   */
  async function handleRequest(config, triggerEvent) {
    if (triggerEvent) {
      triggerEvent.preventDefault();
    }

    const { endpoint, method = 'GET', query, body, response: responseMap } = config;

    if (!endpoint) {
      console.error('[req.js] API endpoint is not defined for configuration:', config);
      return;
    }

    // 1. Build Query Parameters
    let requestUrl = endpoint;
    if (query && typeof query === 'object') {
      const urlObj = new URL(requestUrl, window.location.origin);
      for (const [key, selector] of Object.entries(query)) {
        const elem = getElement(selector);
        const val = elem ? getElementValue(elem) : selector;
        urlObj.searchParams.append(key, val);
      }
      requestUrl = urlObj.toString();
    }

    // 2. Build Request Body
    let payload = null;
    const upperMethod = method.toUpperCase();
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(upperMethod) && body && typeof body === 'object') {
      payload = {};
      for (const [key, selector] of Object.entries(body)) {
        const elem = getElement(selector);
        payload[key] = elem ? getElementValue(elem) : selector;
      }
    }

    // 3. Perform Fetch Request
    const fetchOptions = {
      method: upperMethod,
      headers: {
        'Accept': 'application/json'
      }
    };

    if (payload !== null) {
      fetchOptions.headers['Content-Type'] = 'application/json';
      fetchOptions.body = JSON.stringify(payload);
    }

    try {
      console.log(`[req.js] [${upperMethod}] ${requestUrl}`, payload || '');
      const res = await fetch(requestUrl, fetchOptions);

      if (!res.ok) {
        console.warn(`[req.js] Server responded with status: ${res.status} ${res.statusText}`);
      }

      let data;
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        try {
          data = JSON.parse(text);
        } catch {
          data = { responseText: text };
        }
      }

      console.log('[req.js] Received response:', data);

      // 4. Map Response into Target DOM Elements
      if (responseMap && typeof responseMap === 'object' && data) {
        for (const [responseKey, targetSelector] of Object.entries(responseMap)) {
          const targetElem = getElement(targetSelector);
          if (targetElem) {
            const val = getNestedValue(data, responseKey);
            setElementValue(targetElem, val);
          } else {
            console.warn(`[req.js] Target element not found for selector: "${targetSelector}"`);
          }
        }
      }

      // Dispatch custom event for extensible handling
      window.dispatchEvent(new CustomEvent('accreq:success', {
        detail: { config, data, response: res }
      }));

    } catch (err) {
      console.error('[req.js] Request failed:', err);
      window.dispatchEvent(new CustomEvent('accreq:error', {
        detail: { config, error: err }
      }));
    }
  }

  /**
   * Initializes all discovered configurations and attaches event listeners.
   */
  function init() {
    const configs = discoverConfigs();
    if (configs.length === 0) {
      return;
    }

    configs.forEach((config, index) => {
      if (!config.submit) {
        console.warn(`[req.js] Configuration #${index + 1} found without SUBMIT selector:`, config);
        return;
      }

      const submitElem = getElement(config.submit);
      if (!submitElem) {
        console.warn(`[req.js] Submit element "${config.submit}" not found in DOM.`);
        return;
      }

      // Intercept both form submission (if inside a form) and element click
      const formElem = submitElem.closest ? submitElem.closest('form') : (submitElem.tagName.toLowerCase() === 'form' ? submitElem : null);
      if (formElem && !formElem._accreq_bound) {
        formElem._accreq_bound = true;
        formElem.addEventListener('submit', (e) => handleRequest(config, e));
      }

      if (submitElem.tagName.toLowerCase() !== 'form' && !submitElem._accreq_bound) {
        submitElem._accreq_bound = true;
        submitElem.addEventListener('click', (e) => handleRequest(config, e));
      }

      console.log(`[req.js] Bound [${config.method || 'GET'}] (${config.endpoint}) to "${config.submit}"`);
    });
  }

  // Attach to DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose globally for manual triggers or inspection
  window.AccReq = {
    init,
    handleRequest,
    discoverConfigs
  };
})();
