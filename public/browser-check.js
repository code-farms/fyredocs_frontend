/*
 * Outdated-browser notice. The app bundle targets Vite's modern baseline
 * (about Chrome/Edge 111, Firefox 114, Safari/iOS 16.4); on older browsers it
 * can fail to parse or run and leave a blank page. This classic script runs
 * even when the module bundle doesn't, and shows an "update your browser"
 * banner instead.
 *
 * Deliberately ES5 (no let/const/arrows) so the oldest browsers can parse it,
 * and an external file rather than inline so the CSP stays 'self'-only.
 * Checks are runtime features close to the baseline that also catch common
 * stuck devices (e.g. iPhones on iOS < 16.4 fail the RegExp lookbehind test).
 */
(function () {
  function supported() {
    try {
      if (!("noModule" in document.createElement("script"))) return false; // no ES modules
      if (typeof structuredClone !== "function") return false; // Chrome 98, Firefox 94, Safari 15.4
      if (typeof Object.hasOwn !== "function") return false; // Chrome 93, Firefox 92, Safari 15.4
      if (typeof [].findLast !== "function") return false; // Chrome 97, Firefox 104, Safari 15.4
      new RegExp("(?<=a)b"); // lookbehind: Chrome 62, Firefox 78, Safari 16.4
      return true;
    } catch (e) {
      return false;
    }
  }

  if (supported()) return;

  function show() {
    if (document.getElementById("fd-outdated-browser")) return;
    var bar = document.createElement("div");
    bar.id = "fd-outdated-browser";
    bar.setAttribute("role", "alert");
    bar.style.cssText =
      "position:fixed;top:0;left:0;right:0;z-index:2147483647;padding:12px 16px;" +
      "background:#fff7e6;color:#5c3b00;border-bottom:1px solid #f0c36d;" +
      "font:15px/1.4 -apple-system,Segoe UI,Roboto,Arial,sans-serif;text-align:center";
    bar.appendChild(
      document.createTextNode(
        "Your browser is out of date, so Fyredocs may not work correctly. " +
          "Please update Chrome, Safari, Firefox or Edge to the latest version."
      )
    );
    document.body.insertBefore(bar, document.body.firstChild);
  }

  if (document.body) show();
  else document.addEventListener("DOMContentLoaded", show);
})();
