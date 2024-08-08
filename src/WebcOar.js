import HttpClient from "@ocdla/lib-http/HttpClient.js";
import Url from "@ocdla/lib-http/Url.js";
import OarRule from "./OarRule.js";

const OAR_ENDPOINT = "https://appdev.ocdla.org/books-online/oar.php";
// https://secure.sos.state.or.us/oard/view.action
// https://appdev.ocdla.org/books-online/oar.php?chapter=213&division=002&rule=0001

export default class WebcOar extends HTMLElement {
  chapter = null;

  division = null;

  rule = null;

  constructor() {
    super();

    ["chapter", "division", "rule"].forEach((attr) => {
      this[attr] = this.getAttribute(attr);
    });
  }

  static async loadRule(chapter, division, ruleNum) {
    const config = {};
    const client = new HttpClient(config);
    let rule = new OarRule();

    let url = WebcOar.queryByRule(chapter, division, ruleNum);

    const req = new Request(url);

    let resp = await client.send(req);
    return await rule.load(resp);
  }

  // Called each time the element is appended to the window/another element.
  async connectedCallback() {
    const shadow = this.attachShadow({ mode: "open" });

    const list = document.createElement("div");
    list.setAttribute("class", "statute");
    const style = document.createElement("style");
    style.innerText = WebcOar.getCss();

    this.list = list;

    this.shadowRoot.append(style, list);

    let rule = await WebcOar.loadRule(this.chapter, this.division, this.rule);
    rule.parse();
    rule.injectAnchors();

    let text = (this.list.innerHTML = rule.toString());
  }

  static queryByRule(chapter, division, rule) {
    // built-ins

    let url = OAR_ENDPOINT;
    url = new Url(url);
    url.buildQuery("chapter", chapter);
    url.buildQuery("division", division);
    url.buildQuery("rule", rule);

    return url.toString();
  }

  static getCss() {
    return `
        div[id*=section] {
            margin-top: 10px;
            margin-bottom: 5px;
        }
        .statute {
            font-family: monospace;
            border-left: 3px solid blue;
            margin-left: 50px;
            max-width: 80%;
            padding-left: 20px;
        }
        .level-0 {
            margin-left: 0px;
            margin-top: 5px;
            margin-bottom: 5px;
        }

        .level-1 {
            margin-left: 15px;
            margin-top: 5px;
            margin-bottom: 5px;
        }

        .level-2 {
            margin-left: 30px;
            margin-top: 5px;
            margin-bottom: 5px;
        }

        .level-3 {
            margin-left: 45px;
            margin-top: 5px;
            margin-bottom: 5px;
        }
        .section-label:before {
            content: "ORS ";
        }
        .section-label {
            padding: 5px;
            font-size:larger;
            font-weight: bold;
        }
        `;
  }
}
